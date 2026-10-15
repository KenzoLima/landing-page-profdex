/**
 * Gera `public/models/<slug>.glb` a partir dos modelos de origem do elenco.
 *
 *   node scripts/optimize-model.mjs                 # todos
 *   node scripts/optimize-model.mjs mario tanaka    # só alguns
 *   PROFDEX_MODELS_DIR="D:\profdex\professores profdex 3D" node scripts/optimize-model.mjs
 *
 * A lista (slug → arquivo de origem) é MODEL_ENTRIES, em src/config/model.js.
 *
 * ── Por que este script existe ───────────────────────────────────────────────
 *
 * As formas especiais chegam com ~60 MB e ~1 milhão de vértices; os primeiros
 * originais do app pesavam 27–74 MB. O problema NÃO é o disco: é a GPU. A
 * assinatura típica são três texturas 4096×4096 por professor:
 *
 *   baseColor 4096²          → ~89 MB descompactada na GPU
 *   normal 4096²             → ~89 MB
 *   metallicRoughness 4096²  → ~89 MB
 *
 * São ~268 MB de textura para UM professor. Dois combatentes na arena passavam
 * de meio giga e o Safari do iOS descartava a aba no meio da batalha
 * (docs/BUG-BATALHA-TRAVANDO.md no repo principal). A geometria era detalhe:
 * 32 mil vértices ocupam 1,3 MB.
 *
 * A exceção que o briefing abre para a landing é "um modelo, sob interação
 * explícita, e otimizado antes". Este script é a parte "otimizado antes".
 *
 * ── O que ele faz, e por que nesta ordem ─────────────────────────────────────
 *
 * 1. TEXTURAS, com sharp e não com o `textureCompress` do gltf-transform: nestas
 *    imagens específicas o passo pronto quebra com `colourspace: parameter space
 *    not set`. Reduz para 1024 (baseColor), 1024 (normal) e 512
 *    (metallicRoughness) e converte para JPEG. O corte assimétrico é
 *    proposital: metallicRoughness carrega dois canais de material que ninguém
 *    olha de perto num visualizador que gira a 40 px/s.
 *
 * 2. GEOMETRIA. `weld` funde vértices duplicados — sem isso o `simplify` não
 *    tem o que colapsar. Só quem passa de SIMPLIFY_THRESHOLD é simplificado
 *    (na prática, as esculturas de ~1 milhão de vértices); nos demais o custo já
 *    é irrelevante e simplificar só tiraria silhueta de graça.
 *
 * 3. DRACO por último, porque comprime o que sobrou — rodar antes do simplify
 *    seria comprimir vértices que vão ser jogados fora.
 *
 * O decodificador Draco que o navegador usa está em `public/draco/`, copiado do
 * `three` instalado. Se atualizar o `three`, recopie de
 * `node_modules/three/examples/jsm/libs/draco/gltf/` — versões descasadas
 * quebram o carregamento em runtime, não no build.
 */
import { existsSync } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { MODEL_ENTRIES } from '../src/config/model.js'
import { resolveModelsDir } from './app-source.mjs'
import path from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, draco, prune, resample, simplify, weld } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const outDir = path.join(root, 'public', 'models')

/**
 * Tamanho máximo por tipo de textura, em pixels.
 *
 * A memória de GPU cai com o QUADRADO do lado: 4096→1024 é 16× menos, e é daí
 * que vêm os ~268 MB → ~13 MB por modelo. O JPEG no disco é consequência, não o
 * objetivo.
 */
const TEXTURE_BUDGET = {
  baseColorTexture: 1024,
  normalTexture: 1024,
  metallicRoughnessTexture: 512,
  emissiveTexture: 512,
  occlusionTexture: 512,
  default: 512,
}

/** Acima disto o modelo passa pelo simplify. Abaixo, não vale a perda de forma. */
const SIMPLIFY_THRESHOLD = 100_000

/**
 * Quantos vértices sobram, mais ou menos, depois do simplify.
 *
 * Os modelos regulares do elenco têm ~17 mil vértices; as formas especiais
 * chegam com ~1 milhão (escultura sem retopologia). Uma razão fixa não serve
 * para os dois casos, então a razão sai deste alvo. O meshopt para antes do
 * alvo quando bate em costura de UV — o número final é sempre maior que este.
 */
const SIMPLIFY_TARGET_VERTICES = 60_000

/** Erro máximo aceito pelo simplify, como fração do raio do modelo. */
const SIMPLIFY_ERROR = 0.01

const mb = (bytes) => (bytes / 1048576).toFixed(2)

/** Em qual slot do material esta textura está ligada — decide o orçamento. */
function slotOf(document, texture) {
  for (const material of document.getRoot().listMaterials()) {
    for (const slot of Object.keys(TEXTURE_BUDGET)) {
      const getter = `get${slot[0].toUpperCase()}${slot.slice(1)}`
      if (material[getter]?.() === texture) return slot
    }
  }
  return 'default'
}

/**
 * Reduz e recomprime as texturas do documento no lugar.
 *
 * O `sharp` recebe o buffer cru do glTF e devolve outro buffer — o grafo do
 * documento não muda, só o payload de cada imagem.
 */
async function shrinkTextures(document) {
  let before = 0
  let after = 0

  for (const texture of document.getRoot().listTextures()) {
    const image = texture.getImage()
    if (!image) continue

    const limit = TEXTURE_BUDGET[slotOf(document, texture)] ?? TEXTURE_BUDGET.default
    before += image.byteLength

    const resized = await sharp(Buffer.from(image))
      // `withoutEnlargement` porque uma textura que já seja menor que o teto não
      // ganha nada sendo esticada — só perderia nitidez e ganharia bytes.
      .resize(limit, limit, { fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
      .jpeg({ quality: 82, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toBuffer()

    texture.setImage(new Uint8Array(resized)).setMimeType('image/jpeg')
    const uri = texture.getURI()
    if (uri) texture.setURI(uri.replace(/\.\w+$/, '.jpg'))

    after += resized.byteLength
  }

  return { before, after }
}

async function optimize(slug, sourcePath) {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    })

  const document = await io.read(sourcePath)
  const vertices = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives())
    .reduce((sum, prim) => sum + (prim.getAttribute('POSITION')?.getCount() ?? 0), 0)

  const tex = await shrinkTextures(document)

  const passes = [resample(), dedup(), prune(), weld()]

  // O simplify precisa do WASM do meshoptimizer pronto — daí o `ready`.
  if (vertices > SIMPLIFY_THRESHOLD) {
    await MeshoptSimplifier.ready
    const ratio = SIMPLIFY_TARGET_VERTICES / vertices
    passes.push(simplify({ simplifier: MeshoptSimplifier, ratio, error: SIMPLIFY_ERROR }))
  }

  passes.push(draco())
  await document.transform(...passes)

  const glb = await io.writeBinary(document)
  await mkdir(outDir, { recursive: true })
  const dest = path.join(outDir, `${slug}.glb`)
  await writeFile(dest, glb)

  const sourceSize = (await stat(sourcePath)).size
  const finalVertices = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives())
    .reduce((sum, prim) => sum + (prim.getAttribute('POSITION')?.getCount() ?? 0), 0)

  console.log(
    `✓ ${slug}: ${mb(sourceSize)} MB → ${mb(glb.byteLength)} MB` +
      ` · texturas ${mb(tex.before)} → ${mb(tex.after)} MB` +
      ` · vértices ${vertices.toLocaleString('pt-BR')} → ${finalVertices.toLocaleString('pt-BR')}`,
  )

  return { slug, bytes: glb.byteLength }
}

// Quem tem modelo sai de `professors.js` (professores e formas especiais); o
// nome do arquivo de origem é o único dado que só este script precisa.
const sourceDir = resolveModelsDir()
const only = process.argv.slice(2)
const alvos = MODEL_ENTRIES.filter((e) => only.length === 0 || only.includes(e.slug))

if (alvos.length === 0) {
  const conhecidos = MODEL_ENTRIES.map((e) => e.slug)
  throw new Error(`Nenhum modelo casa com "${only.join(', ')}". Conhecidos: ${conhecidos.join(', ')}`)
}

let total = 0
for (const entry of alvos) {
  const sourcePath = path.join(sourceDir, entry.modelSource)
  if (!existsSync(sourcePath)) {
    console.warn(`· pulado ${entry.slug}: não achei ${sourcePath}`)
    continue
  }
  const { bytes } = await optimize(entry.slug, sourcePath)
  total += bytes
}

console.log(`\nTotal processado: ${mb(total)} MB`)
