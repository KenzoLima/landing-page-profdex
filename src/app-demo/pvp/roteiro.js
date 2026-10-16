// O roteiro da partida ranqueada que a seção PvP encena.
//
// Tudo aqui é FICTÍCIO e fixo: os nomes são os inventados do ranking do
// simulador (mock.js), os professores são o elenco real e os golpes são os do
// app (engine/moves.js). Os números fecham com as regras de verdade:
//
//   · Elo: ver cenas.js, junto dos tempos de cada cena.
//   · Tipos (data/types.js): Arquitetura é super eficaz contra Engenharia de
//     Software, e Humanas contra Arquitetura. O primeiro turno é uma troca de
//     golpes super eficazes, o que a dica "SUPER x2" do golpe já antecipa.
//
// Os textos das telas são os do app (BatalhaView, ConvitePilha, PvpPickView,
// PvpArenaView), copiados como estão. A única troca é o travessão, que a
// landing não usa.
import { BY_SLUG } from '@/data/professors.js'
import { getMoveById } from '../engine/moves.js'

export { T, restam } from './cenas.js'
export { ELO_DELTA, ELO_DEPOIS } from './cenas.js'

export const RIVAL = 'Isabela Rocha'

/** O lobby aberto: quem está online e o que cada um está fazendo. */
export const LOBBY = [
  { name: RIVAL, ocupado: false },
  { name: 'Pedro Henrique Lima', ocupado: true },
  { name: 'Caio Monteiro', ocupado: false },
  { name: 'Letícia Moura', ocupado: false },
  { name: 'Diego Saraiva', ocupado: true },
]
/** Quem fica online com a lista aberta (a presença chega ao vivo). */
export const CHEGOU = 'Fernanda Lopes'
/** O segundo desafio, que entra na pilha atrás do primeiro. */
export const OUTRO_DESAFIO = 'Caio Monteiro'

const prof = (slug) => BY_SLUG[slug]

/** A coleção na seleção de time e o time que sai dela. */
export const COLECAO = ['eron', 'renata', 'mario', 'suzana', 'joao-marcos', 'tiago-ravache'].map(prof)
export const TIME = ['eron', 'renata', 'mario'].map(prof)
export const TIME_RIVAL = ['simone-tanaka', 'wilson', 'robson'].map(prof)

export const MEU = TIME[0]
export const DELE = TIME_RIVAL[0]
export const GOLPES = ['transbordou-o-balde', 'fura-fila-do-bus', 'decoreba', 'achou-no-cache'].map(getMoveById)
export const GOLPE_USADO = GOLPES[0]
export const GOLPE_DELE = getMoveById('treplica-sem-do')

export const HP_MAX = 120

/** Dano do primeiro turno (o motor do app sorteia; aqui ficam fixos). */
export const DANO = { meu: 46, dele: 38 }
/** HP de quem sobra quando o último professor do rival cai. */
export const HP_FINAL = 31
