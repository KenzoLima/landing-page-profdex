// O elenco da Pokédex.
//
// FONTE: o cadastro do app em produção (`GET /api/professors` e
// `/api/professors/rares`) — slug, nome e tipos são os de lá, sem ajuste. Os
// sprites vêm de `/uploads/<slug>-{frente,costas}.png` (copiados para
// assets-src/sprites/) e os modelos, da pasta "professores profdex 3D".
// A landing NUNCA digita quantos professores existem: os totais saem daqui.

// Import relativo, e não pelo alias `@`: este módulo também é lido pelos scripts
// de build (Node puro), e o `@` só existe dentro do Vite.
import { asset } from '../config/asset.js'

/**
 * Monta uma entrada do elenco a partir do slug.
 *
 *  · `sprite` / `spriteBack` — o BONECO de corpo inteiro, de frente e de costas,
 *                 num canvas quadrado com os pés embaixo
 *                 (scripts/optimize-assets.mjs).
 *  · `spriteFace` — recorte do rosto, tirado do sprite de frente.
 *  · `model`      — o `.glb` otimizado (scripts/optimize-model.mjs).
 *  · `modelSource` — o arquivo de origem na pasta de modelos. Só o script lê.
 */
function entrada(slug, name, types, modelSource, extra = {}) {
  return {
    slug,
    name,
    types,
    sprite: asset(`/professors/${slug}-pixel.png`),
    spriteBack: asset(`/professors/${slug}-pixel-costas.png`),
    spriteFace: asset(`/professors/${slug}-pixel-face.png`),
    model: modelSource ? asset(`/models/${slug}.glb`) : null,
    modelSource,
    ...extra,
  }
}

/** Os professores regulares — os que aparecem na Pokédex e na batalha. */
export const CAPTURABLE = [
  entrada('eron', 'Eron', ['arquitetura', 'ia'], 'professor-eron.glb'),
  entrada('guilherme', 'Guilherme', ['matematica'], 'professor-guilherme.glb'),
  entrada('gustavo', 'Gustavo', ['arquitetura', 'ia'], 'professor-gustavo.glb'),
  entrada('joao-marcos', 'João Marcos', ['robotica', 'banco'], 'professor-joao-marcos.glb'),
  entrada('joao-victor', 'João Vitor', ['algoritmos', 'ia'], 'professor-joao.glb'),
  entrada('luiz-felipe', 'Luiz Felipe', ['robotica', 'redes'], 'professor-luis.glb'),
  entrada('marcelo-yamamoto', 'Marcelo Yamamoto', ['algoritmos'], 'professor-marcelo.glb'),
  entrada('mario', 'Mario', ['redes', 'banco'], 'professor-mario.glb'),
  entrada('matheus', 'Matheus', ['engenharia-software'], 'professor-matheus.glb'),
  entrada('renata', 'Renata', ['engenharia-software', 'algoritmos'], 'professora-renata.glb'),
  entrada('robson', 'Robson', ['banco'], 'professor-robson.glb'),
  entrada('simone-tanaka', 'Simone Tanaka', ['engenharia-software', 'humanas'], 'professora-simone.glb'),
  entrada('suzana', 'Suzana', ['matematica'], 'professora-suzana.glb'),
  entrada('tiago-ravache', 'Tiago Ravache', ['arquitetura', 'redes'], 'professor-ravache.glb'),
  entrada('tania-camila', 'Tânia Camila', ['humanas', 'matematica'], 'professora-tcamis.glb'),
  entrada('wilson', 'Wilson', ['humanas'], 'professor-wilson.glb'),
]

/** Acesso por slug — o que as seções usam para pegar um combatente específico. */
export const BY_SLUG = Object.fromEntries(CAPTURABLE.map((p) => [p.slug, p]))

/**
 * Os raros. No app eles aparecem como silhueta dourada "✦ ???" até serem
 * capturados; quatro deles formam o NDE da Coordenação na raid.
 */
export const RARES = [
  entrada('eron-muay-thai', 'Eron Muay Thai', ['arquitetura'], 'eron-muaythai.glb', { nde: true }),
  entrada('joao-ciborgue', 'João Ciborgue', ['algoritmos'], 'joao-ciborgue.glb', { nde: true }),
  entrada('simone-corredora', 'Simone Corredora', ['engenharia-software'], 'simone-corredora.glb', { nde: true }),
  entrada('tania-palmeiras', 'TCamis Palmeiras', ['matematica'], 'tcamis-palmeiras.glb', { nde: true }),
  entrada('gustavo-de-ferro', 'Gustavo de Ferro', ['robotica'], 'gustavo-de-ferro.glb'),
  entrada('ricardo-infiltrado', 'Ricardo Infiltrado', ['ia'], 'ricardo-infliltrado.glb'),
]

export const RARE_BY_SLUG = Object.fromEntries(RARES.map((p) => [p.slug, p]))

/**
 * O lendário, chefe da raid. Três estágios, um por terço do HP: o 1º é o tipo
 * do cadastro (Engenharia de Software); o 2º e o 3º são sorteados na roda.
 */
export const LEGENDARY = entrada('sergio-tanaka', 'Sérgio Tanaka', ['engenharia-software'], null, {
  stages: [1, 2, 3].map((n) => ({
    sprite: asset(`/professors/sergio-tanaka${n === 1 ? '' : `-e${n}`}-pixel.png`),
    spriteBack: asset(`/professors/sergio-tanaka${n === 1 ? '' : `-e${n}`}-pixel-costas.png`),
  })),
})

export const TOTAL_PROFESSORS = CAPTURABLE.length
