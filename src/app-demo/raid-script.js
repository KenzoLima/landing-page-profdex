// O roteiro da raid contra o lendário, como apresentação.
//
// Os TEXTOS seguem os do servidor do app (profdex-back/src/battle/raid-room.service.ts,
// raid-eventos.ts e raid-estagios.ts), só sem travessão. O que é ilustrativo é a
// sequência: numa raid de verdade os tipos dos estágios 2 e 3 são sorteados na
// roda (sempre a dois passos ou mais dos tipos já usados), e o NDE e o Ricardo
// entram quando as condições acontecem. Aqui escolhemos uma raid possível
// (Matemática no estágio 2, Robótica no 3) e mostramos tudo na ordem.
import { TYPE_CYCLE } from '@/data/types.js'
import { LEGENDARY, RARE_BY_SLUG } from '@/data/professors.js'

export const BOSS = LEGENDARY
export const BOSS_MAX_HP = 480 // raid.hp_multiplier (4) × 120

/** Os quatro raros que formam o NDE da Coordenação (raid-eventos.ts). */
export const NDE = ['eron-muay-thai', 'joao-ciborgue', 'simone-corredora', 'tania-palmeiras'].map(
  (slug) => RARE_BY_SLUG[slug],
)
export const RICARDO = RARE_BY_SLUG['ricardo-infiltrado']

/** A roda de buffs do Ricardo, na ordem e com os pesos do servidor (4/2/1). */
export const BUFFS = [
  { name: 'Ponto Extra', weight: 4, desc: '+1 em todos os atributos' },
  { name: 'Monitoria', weight: 4, desc: 'cura 8% por turno' },
  { name: 'Cola na Manga', weight: 4, desc: 'limpa os debuffs e cura 30%' },
  { name: 'Vista Grossa', weight: 4, desc: 'o chefe perde 2 de Ataque' },
  { name: 'Gabarito Vazado', weight: 2, desc: 'os próximos 3 golpes acertam e ignoram a Defesa' },
  { name: 'Recurso Deferido', weight: 2, desc: 'bloqueia os próximos 2 golpes' },
  { name: 'Semana de Provas', weight: 2, desc: 'o chefe perde 10% do HP máximo' },
  { name: 'Prova Substitutiva', weight: 1, desc: 'revive um professor caído com 50%' },
  { name: 'Orientação de TCC', weight: 1, desc: '+2 de Ataque' },
]

const nome = BOSS.name
const [E1, E2, E3] = BOSS.stages.map((s) => s.sprite)
const TIPOS = TYPE_CYCLE.map((t) => t.id)

/** A roda de tipos de uma virada de estágio: os nove, na ordem da roda. */
const rodaDeTipos = (resultado) => ({ kind: 'tipo', opcoes: TIPOS, resultado })

/**
 * Cada cena tem `palco` (o que aparece) e `falas` (uma por toque).
 *
 *  · palco.kind 'status' | 'time' | 'vitoria' — quadros parados.
 *  · palco.kind 'roteiro' — a encenação do app: `ator` entra andando, a `roda`
 *    (se houver) gira, recua, e o ator se transforma se tiver `spriteDepois`.
 *  · palco.hud — o HP do chefe naquele momento, para situar a cena.
 */
export const SCENES = [
  {
    id: 'status',
    title: 'Raid do lendário',
    palco: { kind: 'status' },
    falas: [
      'A raid abre todo dia das 18h às 22h.',
      'Para desafiar o lendário, complete a Pokédex, raros incluídos.',
      'Perdeu? Aguarde 30 min para tentar de novo.',
    ],
  },
  {
    id: 'time',
    title: `Raid contra ${nome}`,
    palco: { kind: 'time' },
    falas: [
      'O lendário é um só, mas aguenta muito mais pancada. Leve os três.',
      'Toque no professor do seu time que encara o lendário primeiro. Os outros entram quando ele cair.',
      'Pronto. A raid vai começar.',
    ],
  },
  {
    id: 'estagio-1',
    title: 'Estágio 1 de 3',
    palco: {
      kind: 'roteiro',
      hud: { estagio: 1, hp: BOSS_MAX_HP, types: ['engenharia-software'], effect: 'Refatoração Contínua' },
      ator: { sprites: [E1] },
      // No estágio 1 a roda gira, mas cai viciada no tipo do cadastro.
      roda: rodaDeTipos('engenharia-software'),
    },
    falas: [
      `${nome} apareceu! HP ${BOSS_MAX_HP}.`,
      'Ele começa a refatorar o próprio código, e a se curar.',
    ],
  },
  {
    id: 'estagio-2',
    title: 'Estágio 2 de 3',
    palco: {
      kind: 'roteiro',
      hud: { estagio: 2, hp: 318, types: ['matematica'], effect: 'Rigor Formal' },
      ator: { sprites: [E1], spriteDepois: E2 },
      roda: rodaDeTipos('matematica'),
    },
    falas: [
      `${nome} não vai mais segurar.`,
      'Estágio 2 de 3: ele agora é Matemática!',
      'Ele passa a exigir demonstração formal. A guarda subiu.',
    ],
  },
  {
    id: 'estagio-3',
    title: 'Estágio 3 de 3',
    palco: {
      kind: 'roteiro',
      hud: { estagio: 3, hp: 158, types: ['robotica'], effect: 'Blindagem' },
      ator: { sprites: [E2], spriteDepois: E3 },
      roda: rodaDeTipos('robotica'),
    },
    falas: [
      `${nome} não vai mais segurar.`,
      'Estágio 3 de 3: ele agora é Robótica!',
      'Ele ergueu uma blindagem que se recompõe sozinha.',
    ],
  },
  {
    id: 'nde',
    title: 'O NDE da Coordenação',
    palco: {
      kind: 'roteiro',
      hud: { estagio: 3, hp: 158, types: ['robotica'] },
      ator: { sprites: NDE.map((r) => r.sprite) },
    },
    falas: [
      'O NDE da Coordenação aparece!',
      `Eron, João, Simone e Tânia entram na frente de ${nome}.`,
      `${nome} vai se recuperar enquanto eles seguram, e não vai atacar.`,
      'Derrube os quatro. Use o tempo.',
      'O NDE caiu!',
      `${nome} volta para o combate.`,
    ],
  },
  {
    id: 'ricardo',
    title: 'Ricardo Infiltrado',
    palco: {
      kind: 'roteiro',
      hud: { estagio: 3, hp: 172, types: ['robotica'] },
      ator: { sprites: [RICARDO.sprite] },
      roda: {
        kind: 'buff',
        opcoes: BUFFS.map((b) => b.name),
        pesos: BUFFS.map((b) => b.weight),
        resultado: 'Gabarito Vazado',
      },
      buff: 'Gabarito Vazado',
    },
    falas: [
      'Ricardo Infiltrado aparece. Ele estava infiltrado esse tempo todo.',
      '"Calma. Eu tenho uma coisa aqui que pode te ajudar."',
      'Gabarito Vazado!',
    ],
  },
  {
    id: 'vitoria',
    title: 'Vitória',
    palco: { kind: 'vitoria', hud: { estagio: 3, hp: 0, types: ['robotica'] } },
    falas: ['Lendário capturado!', 'Ele entra na sua Profdex com atributos perfeitos.'],
  },
]
