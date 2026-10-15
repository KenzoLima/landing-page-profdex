/**
 * Gera `public/professors/*` a partir da arte de origem.
 *
 *   node scripts/optimize-assets.mjs
 *
 * Os **sprites** vêm de `assets-src/sprites/`, versionados aqui. São os bonecos
 * de corpo inteiro, de frente e de costas, que a Pokédex e a batalha usam.
 * Viram `-pixel.png`, `-pixel-costas.png` e o recorte `-pixel-face.png`.
 *
 * ── Sobre os sprites, que é a parte que merece explicação ────────────────────
 *
 * A arte do elenco atual (pasta "professores profdex", ~370×650 px por arquivo)
 * é pixel art detalhada que já chegou reamostrada: não há grade nativa limpa
 * para recuperar. Cada boneco é recortado pela caixa do desenho, reduzido para
 * caber em SPRITE_SIDE de altura e assentado embaixo, no centro, de um canvas
 * quadrado — todos pisam na mesma linha quando ficam lado a lado.
 *
 * O **alfa é binarizado**: o removedor de fundo deixa uma borda macia
 * semitransparente (e uma sombra roxa em alguns arquivos), e pixel art não tem
 * meio-termo — ou o pixel é do boneco, ou é do fundo.
 *
 * Os `.jpg` da pasta de origem são PNG com alfa apesar da extensão; copie-os
 * para `assets-src/sprites/<slug>-{frente,costas}.png`.
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import { CAPTURABLE, LEGENDARY, RARES } from '../src/data/professors.js'

const root = path.resolve(import.meta.dirname, '..')
const pub = path.join(root, 'public')
const spriteSrc = path.join(root, 'assets-src', 'sprites')

/**
 * Lado do sprite publicado.
 *
 * O elenco atual é arte de ~370×650 px sem grade nativa limpa (foi reamostrada
 * antes de chegar aqui), então não existe "o tamanho de autoria" para voltar.
 * 320 cobre o maior uso na página (~170 px CSS) com folga para tela 2×, e
 * mantém o canvas quadrado com os pés embaixo — o contrato que as seções já
 * esperam do sprite.
 */
const SPRITE_SIDE = 320

/**
 * Acima deste alfa o pixel é do boneco; abaixo, é fundo.
 *
 * 110 e não 128 porque a borda macia do removedor de fundo é assimétrica: ela
 * come o contorno escuro do sprite antes de comer o fundo. Um corte no meio
 * emagrecia o boneco em um pixel de contorno; 110 devolve o contorno inteiro sem
 * trazer halo junto.
 */
const ALPHA_CUT = 110

const kb = (bytes) => (bytes / 1024).toFixed(1)

async function write(rel, buffer) {
  const dest = path.join(pub, rel)
  await mkdir(path.dirname(dest), { recursive: true })
  await writeFile(dest, buffer)
  console.log(`✓ public/${rel} (${kb(buffer.byteLength)} kB)`)
}

/** Caixa do desenho dentro do arquivo, ignorando a margem transparente. */
async function alphaBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  let minX = info.width
  let minY = info.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      // 40 e não 0: o halo do removedor de fundo tem alfa baixo mas não zero, e
      // contá-lo devolveria o arquivo inteiro como "caixa do desenho".
      if (data[(y * info.width + x) * 4 + 3] <= 40) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0) return null
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/**
 * Devolve o sprite à grade nativa, num canvas de `SPRITE_SIDE`.
 *
 * O boneco é alinhado EMBAIXO e centralizado na horizontal, que é como o
 * `gustavo-pixel.png` do Aseprite já vem — assim os três pisam na mesma linha
 * quando ficam lado a lado numa arena.
 */
async function normalizeSprite(file) {
  const box = await alphaBox(file)
  if (!box) throw new Error(`${path.basename(file)} está inteiro transparente.`)

  // Já está na grade de autoria: não reamostra. Reamostrar pixel art correta é
  // sempre perda, nunca ganho.
  const jaNativo = box.height <= SPRITE_SIDE

  const alturaAlvo = Math.min(box.height, SPRITE_SIDE)
  const larguraAlvo = Math.max(1, Math.round((box.width * alturaAlvo) / box.height))

  const recorte = sharp(file).extract(box)
  const escalado = jaNativo
    ? recorte
    : recorte.resize(larguraAlvo, alturaAlvo, { kernel: 'lanczos3' })

  const { data, info } = await escalado.ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  // Alfa binário: pixel art não tem borda macia. Sem isto o `pixelated` do CSS
  // amplia o halo do removedor de fundo junto com o desenho, e o boneco fica com
  // uma auréola de 3 px na tela.
  for (let i = 3; i < data.length; i += 4) data[i] = data[i] >= ALPHA_CUT ? 255 : 0

  const desenho = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: SPRITE_SIDE,
      height: SPRITE_SIDE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: desenho,
        left: Math.round((SPRITE_SIDE - info.width) / 2),
        top: SPRITE_SIDE - info.height,
      },
    ])
    .png({ palette: true, colors: 256, dither: 0.6, effort: 10 })
    .toBuffer()
}

/**
 * Recorte do ROSTO a partir do sprite de frente.
 *
 * É o retrato que a seção 3D mostra antes de carregar o modelo. Antes ali ficava
 * o cartoon; um card emoldurado em QR ao lado de um seletor de bonecos misturava
 * duas linguagens, e o rosto em pixel diz "é este professor" tão bem quanto.
 *
 * `FACE_RATIO` é fração da ALTURA do boneco, não da largura: a cabeça é a mesma
 * fatia vertical em todos os três (0,38 cortava o cabelo do Mário e do Gustavo;
 * 0,50 já pegava ombro demais e deixava de ser um zoom).
 *
 * O `HEADROOM` existe porque o desenho começa em y=0 nesses arquivos — o cabelo
 * encosta na borda de cima e o recorte fica sem ar. Três linhas transparentes
 * resolvem, e como o resultado é PNG com alfa elas somem no fundo da seção.
 */
const FACE_RATIO = 0.46
const HEADROOM = 3

async function faceCrop(spriteFile) {
  const box = await alphaBox(spriteFile)
  if (!box) throw new Error(`${path.basename(spriteFile)} está inteiro transparente.`)

  const lado = Math.round(box.height * FACE_RATIO)
  const centro = Math.round(box.left + box.width / 2)
  const { width: W } = await sharp(spriteFile).metadata()
  const left = Math.max(0, Math.min(W - lado, centro - Math.round(lado / 2)))

  const cabeca = await sharp(spriteFile)
    .extract({ left, top: box.top, width: lado, height: lado })
    .png()
    .toBuffer()

  const canvas = lado + HEADROOM * 2
  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: cabeca, left: HEADROOM, top: HEADROOM }])
    .png({ palette: true, colors: 256, dither: 0.6, effort: 10 })
    .toBuffer()
}

/**
 * Gera frente, costas e rosto de um boneco.
 *
 * `base` é o nome do arquivo de origem sem o lado (`eron`, `raros/sergio-tanaka`)
 * e `sufixo` separa os estágios do lendário (`-e2`, `-e3`).
 */
async function boneco(base, slug, sufixo = '') {
  for (const [lado, saida] of [
    ['frente', `professors/${slug}${sufixo}-pixel.png`],
    ['costas', `professors/${slug}${sufixo}-pixel-costas.png`],
  ]) {
    const origem = path.join(spriteSrc, `${base}-${lado}${sufixo}.png`)
    if (!existsSync(origem)) {
      console.warn(`· ${slug}${sufixo} (${lado}): não achei assets-src/sprites/${base}-${lado}${sufixo}.png`)
      continue
    }
    await write(saida, await normalizeSprite(origem))
  }

  // O rosto sai do sprite JÁ NORMALIZADO, não da origem: recortar antes de
  // acertar a escala daria um rosto no tamanho errado.
  const frente = path.join(pub, 'professors', `${slug}${sufixo}-pixel.png`)
  if (existsSync(frente)) {
    await write(`professors/${slug}${sufixo}-pixel-face.png`, await faceCrop(frente))
  }
}

for (const prof of CAPTURABLE) await boneco(prof.slug, prof.slug)

// Raros e lendário moram em assets-src/sprites/raros/. O lendário tem um boneco
// por estágio da raid (o 1º sem sufixo, depois -e2 e -e3).
for (const prof of RARES) await boneco(`raros/${prof.slug}`, prof.slug)
for (const sufixo of ['', '-e2', '-e3']) await boneco(`raros/${LEGENDARY.slug}`, LEGENDARY.slug, sufixo)

// A águia é arte real e versionada aqui; o favicon e o Open Graph saem dela para
// a aba do navegador e o card do WhatsApp serem a mesma marca da página.
if (!existsSync(path.join(pub, 'eagle-ball.png'))) {
  throw new Error('public/eagle-ball.png não encontrado — é arte real e precisa estar versionada.')
}
