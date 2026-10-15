// Quais modelos 3D esta landing serve.
//
// A lista sai do `professors.js`: os professores regulares e os raros. O
// lendário (Sérgio Tanaka) fica de fora de propósito: ele só aparece na aba
// Raid do simulador. Lista vazia desliga a seção 3D por completo.
//
// Imports relativos: scripts/optimize-model.mjs e check-asset-budget.mjs leem
// este módulo no Node puro, onde o alias `@` não existe.
import { CAPTURABLE, RARES } from '../data/professors.js'

const toEntry = (group) => (prof) => ({
  slug: prof.slug,
  name: prof.name,
  types: prof.types,
  url: prof.model,
  modelSource: prof.modelSource,
  // O retrato antes do 3D é o ROSTO em pixel.
  poster: prof.spriteFace,
  group,
})

export const MODEL_ENTRIES = [
  ...CAPTURABLE.filter((p) => p.model).map(toEntry('professores')),
  ...RARES.filter((p) => p.model).map(toEntry('especiais')),
]

/** O modelo aberto por padrão: o Mario, um dos mais leves do elenco. */
export const DEFAULT_MODEL_SLUG = MODEL_ENTRIES.some((e) => e.slug === 'mario')
  ? 'mario'
  : MODEL_ENTRIES[0]?.slug
