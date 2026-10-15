/**
 * Orçamento de assets. Roda no `prebuild` e QUEBRA o build quando estourado.
 *
 *   npm run check:assets
 *
 * Existe porque o combinado verbal de "não põe .glb pesado na página" já existia
 * no projeto e não segurou — o incidente da arena (dois `<model-viewer>` de 27 e
 * 74 MB no Safari do iOS, aba descartada no meio da batalha) aconteceu com a
 * regra escrita e todo mundo de acordo. Um limite que o build não verifica é uma
 * intenção, não um limite.
 *
 * ── Uma regra mudou, e vale registrar por quê ────────────────────────────────
 *
 * A versão anterior proibia MAIS DE UM `.glb` em public/. Era a leitura correta
 * do incidente com os números daquela época: com arquivos de 27–74 MB, "quantos
 * arquivos existem" era uma proxy honesta para "quanta memória isto pode pedir".
 *
 * Depois do `optimize-model.mjs` cada modelo fica abaixo de 1 MB, com texturas
 * de 1024² na GPU. A contagem de arquivos deixou de medir o risco, e continuar
 * com ela custaria a coisa que a seção 3D existe para mostrar — o elenco inteiro.
 *
 * O que impedia o incidente nunca foi a contagem de arquivos: é UM PALCO POR
 * PÁGINA, e isso mora em `useLazyModel.js` (trava no escopo do módulo, `release`
 * ao trocar de professor, `release` ao sair da tela). O que este script cobre é
 * o tamanho — por arquivo, somado (orçamento de deploy) e de vídeos e imagens —
 * e se tudo que os dados referenciam existe em public/.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { CAPTURABLE, LEGENDARY, RARES } from '../src/data/professors.js'
import { MODEL_ENTRIES } from '../src/config/model.js'
import { METRICS_IMAGE, VIDEOS, photo } from '../src/config/links.js'
import { credits } from '../src/content/copy.js'

const root = path.resolve(import.meta.dirname, '..')
const pub = path.join(root, 'public')

/** Teto por modelo. As esculturas especiais (~0,8 MB) são as maiores. */
const MAX_MODEL_MB = 2

/** Piso por modelo: abaixo disto é o cubo de make-placeholder-assets.mjs. */
const MIN_MODEL_KB = 20

/**
 * Teto SOMADO dos modelos — orçamento de DEPLOY, não de página.
 *
 * O aluno nunca baixa mais de um modelo por vez (um palco por página, só sob
 * clique — ver src/three/useLazyModel.js), então a soma não pesa em ninguém; ela
 * existe para o repositório e o deploy não incharem sem alguém perceber.
 */
const MAX_MODELS_TOTAL_MB = 20

/** Teto por imagem. Acima disto alguém esqueceu de passar pelo optimize-assets. */
const MAX_IMAGE_KB = 350

/** Teto por vídeo. Só baixa no play, mas 8 MB ainda é muito para dados móveis. */
const MAX_VIDEO_MB = 8

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'])

const erros = []
const mb = (bytes) => bytes / 1048576
const kb = (bytes) => bytes / 1024

/** Todos os arquivos de public/, recursivamente, como caminhos relativos. */
async function walk(dir, base = dir) {
  const saida = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) saida.push(...(await walk(full, base)))
    else saida.push(path.relative(base, full).replaceAll('\\', '/'))
  }
  return saida
}

const arquivos = await walk(pub)

// ── Modelos: tamanho por arquivo e somado ───────────────────────────────────
const modelos = arquivos.filter((f) => f.endsWith('.glb'))
let totalModelos = 0

for (const rel of modelos) {
  const bytes = (await stat(path.join(pub, rel))).size
  totalModelos += bytes
  if (mb(bytes) > MAX_MODEL_MB) {
    erros.push(`${rel} tem ${mb(bytes).toFixed(2)} MB — o teto por modelo é ${MAX_MODEL_MB} MB.`)
  }
  if (kb(bytes) < MIN_MODEL_KB) {
    erros.push(`${rel} tem ${kb(bytes).toFixed(1)} kB — é o cubo de placeholder. Rode npm run model:optimize.`)
  }
}

if (mb(totalModelos) > MAX_MODELS_TOTAL_MB) {
  erros.push(
    `Os ${modelos.length} modelos somam ${mb(totalModelos).toFixed(2)} MB — o teto somado é ${MAX_MODELS_TOTAL_MB} MB.`,
  )
}

// ── Imagens ─────────────────────────────────────────────────────────────────
for (const rel of arquivos.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))) {
  const bytes = (await stat(path.join(pub, rel))).size
  if (kb(bytes) > MAX_IMAGE_KB) {
    erros.push(`${rel} tem ${kb(bytes).toFixed(0)} kB — o teto por imagem é ${MAX_IMAGE_KB} kB.`)
  }
}

// ── Vídeos ──────────────────────────────────────────────────────────────────
for (const rel of arquivos.filter((f) => f.endsWith('.mp4') || f.endsWith('.webm'))) {
  const bytes = (await stat(path.join(pub, rel))).size
  if (mb(bytes) > MAX_VIDEO_MB) {
    erros.push(`${rel} tem ${mb(bytes).toFixed(2)} MB — o teto por vídeo é ${MAX_VIDEO_MB} MB.`)
  }
}

// ── Tudo que os dados referenciam existe mesmo? ─────────────────────────────
// Um card de Pokédex com imagem quebrada é pior que um card ausente, e um 404 de
// .glb some dentro do loader: o palco fica carregando para sempre, sem erro.
const existe = (url) => existsSync(path.join(pub, url.replace(/^\//, '')))

for (const prof of [...CAPTURABLE, ...RARES, LEGENDARY]) {
  for (const campo of ['sprite', 'spriteBack', 'spriteFace']) {
    if (prof[campo] && !existe(prof[campo])) {
      erros.push(`professors.js → ${prof.slug}.${campo} aponta para ${prof[campo]}, que não existe em public/.`)
    }
  }
}

// Os três estágios do lendário (a raid do simulador troca o sprite por estágio).
for (const [i, estagio] of LEGENDARY.stages.entries()) {
  for (const campo of ['sprite', 'spriteBack']) {
    if (!existe(estagio[campo])) erros.push(`Lendário, estágio ${i + 1}: ${estagio[campo]} não existe em public/.`)
  }
}

// Ícones e fundo do simulador do app (src/app-demo/).
for (const rel of ['profdex.png', 'batalha.png', 'ranking.png', 'ginasio.webp', 'logotipo-branco.png']) {
  if (!existsSync(path.join(pub, 'app', rel))) erros.push(`public/app/${rel} não existe (simulador do app).`)
}

for (const entry of MODEL_ENTRIES) {
  if (!existe(entry.url)) {
    erros.push(`${entry.slug}: ${entry.url} não existe em public/. Rode npm run model:optimize ${entry.slug}.`)
  }
}

for (const [key, video] of Object.entries(VIDEOS)) {
  for (const campo of ['src', 'poster']) {
    if (!existe(video[campo])) erros.push(`links.js → VIDEOS.${key}.${campo} (${video[campo]}) não existe em public/.`)
  }
}

for (const { slug } of credits.photos) {
  for (const url of photo(slug).srcset.split(', ').map((s) => s.split(' ')[0])) {
    if (!existe(url)) erros.push(`copy.js → foto "${slug}": ${url} não existe em public/.`)
  }
}

if (!existe(METRICS_IMAGE.full)) erros.push(`links.js → METRICS_IMAGE: ${METRICS_IMAGE.full} não existe.`)

// ── O decodificador Draco casa com o `three` instalado? ─────────────────────
// Versão descasada não quebra o build: quebra o carregamento no navegador do
// aluno, que é onde ninguém vai olhar.
const dracoLocal = path.join(pub, 'draco', 'draco_decoder.js')
const dracoThree = path.join(root, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf', 'draco_decoder.js')
if (existsSync(dracoLocal) && existsSync(dracoThree)) {
  const [a, b] = await Promise.all([
    readFile(dracoLocal, 'utf8'),
    readFile(dracoThree, 'utf8'),
  ])
  // O checkout do Git no Windows pode converter apenas a cópia versionada
  // para CRLF. Normalize as quebras antes de comparar e reserve a falha para
  // diferenças funcionais reais no decoder.
  if (a.replaceAll('\r\n', '\n') !== b.replaceAll('\r\n', '\n')) {
    erros.push(
      'public/draco/ está diferente do decodificador do three instalado.' +
        ' Recopie de node_modules/three/examples/jsm/libs/draco/gltf/.',
    )
  }
}

// ── Resultado ───────────────────────────────────────────────────────────────
if (erros.length > 0) {
  console.error('\n✗ Orçamento de assets estourado:\n')
  for (const e of erros) console.error(`  · ${e}`)
  console.error('')
  process.exit(1)
}

console.log(
  `✓ Assets dentro do orçamento: ${modelos.length} modelo(s), ${mb(totalModelos).toFixed(2)} MB somados.`,
)
