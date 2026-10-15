// Estado FICTÍCIO do simulador do app.
//
// Nada aqui vem de banco nem de aluno real: o elenco é o de verdade (é público
// na própria landing), mas os IVs e o ranking são inventados e determinísticos,
// então o mesmo visitante vê a mesma coisa toda vez. Os nomes do ranking são
// inventados: não são de alunos, nem do time, nem de professores.
import { CAPTURABLE, RARES } from '@/data/professors.js'

/** Gerador pseudoaleatório com semente: mesmos números a cada carregamento. */
function semente(seed) {
  // mulberry32: espalha bem já no primeiro número (um LCG com semente pequena
  // começava devolvendo zeros, e todo professor saía com IV 0).
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
}

const rand = semente(2026)
const iv = () => Math.floor(rand() * 16)

/**
 * IVs de cada professor na coleção do treinador fictício, que tem a Pokédex
 * completa: os 16 regulares e os 6 raros. O lendário fica para a raid.
 */
export const IVS = Object.fromEntries(
  [...CAPTURABLE, ...RARES].map((p) => [
    p.slug,
    { ivHp: iv(), ivRigor: iv(), ivDidatica: iv(), ivRaciocinio: iv() },
  ]),
)

export const TRAINER = 'Visitante'

/** Total da dex no app: regulares e raros (o lendário não conta). */
export const DEX_TOTAL = CAPTURABLE.length + RARES.length

// ── Ranking ────────────────────────────────────────────────────────────────

/** Faixas de Elo: os mesmos cortes de profdex-back/src/battle/elo.ts. */
export function tierDoElo(rating) {
  if (rating >= 1500) return 'Mestre'
  if (rating >= 1400) return 'Diamante'
  if (rating >= 1300) return 'Platina'
  if (rating >= 1200) return 'Ouro'
  if (rating >= 1100) return 'Prata'
  return 'Bronze'
}

/** Nomes inventados, com cara de nome de verdade. */
const NOMES = [
  'Ana Clara Moreira', 'Pedro Henrique Lima', 'Beatriz Nogueira', 'Lucas Andrade',
  'Larissa Fontana', 'Rafael Tavares', 'Isabela Rocha', 'Bruno Carvalho',
  'Júlia Bertoni', 'Vinícius Prado', 'Letícia Moura', 'Caio Monteiro',
  'Fernanda Lopes', 'Diego Saraiva',
]

const r2 = semente(77)
const jogadores = NOMES.map((name, i) => {
  const wins = Math.round(4 + r2() * 26)
  const losses = Math.round(2 + r2() * 14)
  const total = Math.max(4, Math.round(DEX_TOTAL - i * 1.1 - r2() * 3))
  return {
    id: `j${i}`,
    name,
    rating: Math.round(1540 - i * 34 - r2() * 20),
    wins,
    losses,
    total: Math.min(total, DEX_TOTAL),
  }
})

const VOCE = { id: 'voce', name: TRAINER, rating: 1118, wins: 7, losses: 5, total: DEX_TOTAL }

/** As três abas do ranking, no formato que a tela consome. */
export function rankingDe(aba) {
  const todos = [...jogadores, VOCE]
  if (aba === 'elo') {
    return todos
      .sort((a, b) => b.rating - a.rating)
      .map((j, i) => ({
        ...j,
        position: i + 1,
        value: j.rating,
        unit: 'pts',
        tier: tierDoElo(j.rating),
        detail: `${j.wins}V·${j.losses}D`,
      }))
  }
  return todos
    .sort((a, b) => b.total - a.total || (a.id === 'voce' ? 1 : -1))
    .map((j, i) => ({
      ...j,
      position: i + 1,
      value: aba === 'dex' ? Math.round((j.total / DEX_TOTAL) * 100) : j.total,
      unit: aba === 'dex' ? '% da dex' : 'capturas',
      detail: aba === 'dex' ? `${j.total} de ${DEX_TOTAL} professores` : '',
    }))
}
