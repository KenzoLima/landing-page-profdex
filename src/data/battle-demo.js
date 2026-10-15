// Roteiro da batalha que roda em loop na seção "Batalha" da landing.
//
// ⚠️ Isto NÃO é o motor de batalha. O motor real vive em
// profdex-back/src/battle/ e resolve dano no servidor; aqui os números são
// escritos à mão, porque o objetivo é uma vitrine determinística — a mesma
// partida, do mesmo jeito, toda vez que alguém rola a página até aqui.
//
// O que NÃO é hardcoded: a efetividade de tipo. A seção calcula o
// multiplicador com o `typeMultiplier` de data/types.js, ou seja, a mesma roda
// que a batalha de verdade usa. Se alguém reordenar o TYPE_CYCLE, a mensagem
// ("super-eficaz" / "pouco eficaz") acompanha sozinha em vez de virar mentira.
//
// Os golpes são os do movepool real do app (profdex-front/src/data/moves.js):
// Gustavo é Arquitetura + IA, Mario é Redes + Banco, Eron é Arquitetura + IA.

/** Quem o visitante "controla" — o mesmo avatar da arena PvE. */
export const PLAYER_SLUG = 'gustavo'

/**
 * O moveset de quatro golpes, tirado do movepool dos tipos dele (Arquitetura +
 * IA) — é a regra que o `battle.desc` do copy.js descreve.
 *
 * `category` sai da lista `battle.moveCategories`: nem todo golpe é dano, e a
 * demo escolhe um de defesa no meio da segunda luta justamente para isso
 * aparecer.
 */
export const PLAYER_MOVES = [
  { name: 'Tela da Morte', category: 'ataque', type: 'arquitetura' },
  { name: 'Fura-Fila do Bus', category: 'ataque', type: 'arquitetura' },
  { name: 'Achou no Cache', category: 'defesa', type: 'arquitetura' },
  { name: 'Decoreba', category: 'ataque', type: 'ia' },
]

/**
 * As duas lutas, em ordem, em loop infinito.
 *
 * Cada turno é UM destes dois formatos:
 *   { move: <índice em PLAYER_MOVES>, enemyHp?: <0-100>, note?: <texto> }
 *   { enemyMove: <nome>, playerHp: <0-100> }
 *
 * O HP é ABSOLUTO (o valor em que a barra fica depois do golpe), e não o dano
 * subtraído: assim dá para ler a curva da luta na vertical, sem somar nada de
 * cabeça, e um ajuste no meio não desloca todos os turnos seguintes.
 */
export const BATTLES = [
  {
    enemy: 'mario',
    turns: [
      { move: 0, enemyHp: 68 },
      { enemyMove: 'SELECT * Certeiro', playerHp: 82 },
      { move: 1, enemyHp: 34 },
      { enemyMove: 'Entrega Garantida', playerHp: 71 },
      { move: 0, enemyHp: 0 },
    ],
  },
  {
    enemy: 'eron',
    turns: [
      { move: 0, enemyHp: 79 },
      { enemyMove: 'Transbordou o Balde', playerHp: 78 },
      { move: 2, note: 'Gustavo vai receber menos dano no próximo golpe!' },
      { enemyMove: 'Descida Ladeira Abaixo', playerHp: 66 },
      { move: 1, enemyHp: 52 },
      { enemyMove: 'Transbordou o Balde', playerHp: 49 },
      { move: 1, enemyHp: 31 },
      { move: 0, enemyHp: 0 },
    ],
  },
]
