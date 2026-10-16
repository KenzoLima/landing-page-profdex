// Os tempos e os números da partida que a seção PvP encena.
//
// Separado de roteiro.js de propósito: a trilha das cenas e a escada de tiers
// (que vão no bundle principal) só precisam disto, e o elenco e os golpes
// (roteiro.js, que puxa o banco de golpes do motor) descem só com as telas.
//
// Elo (profdex-back/src/battle/elo.ts): você com 1099 vence a Isabela com
// 1336, K = 24 → E = 0,21 → +19. Você termina com 1118, Prata, o mesmo Elo do
// "Você" na aba Ranking do simulador.

export const ELO_ANTES = 1099
export const ELO_DEPOIS = 1118
export const ELO_DELTA = ELO_DEPOIS - ELO_ANTES

/**
 * As cenas, na ordem da partida. Cada cena roda numa TELA do app, e cenas
 * seguidas podem dividir a mesma tela: o desafio chega por cima do lobby, e o
 * resultado cobre a arena, como no app. `ini` é o instante da cena dentro da
 * tela dela; `poster` é o quadro mostrado parado (pausa, movimento reduzido ou
 * quando a pessoa pula para a cena).
 *
 * Todos os tempos em milissegundos.
 */
export const CENAS = [
  { id: 'lobby', tela: 'lobby', ini: 0, dur: 4600, poster: 3800 },
  { id: 'desafio', tela: 'lobby', ini: 4600, dur: 6000, poster: 8600 },
  { id: 'times', tela: 'selecao', ini: 0, dur: 9200, poster: 5800 },
  { id: 'turno', tela: 'arena', ini: 0, dur: 8800, poster: 2600 },
  { id: 'elo', tela: 'arena', ini: 8800, dur: 6600, poster: 15300 },
]

/** Os momentos de cada tela, num lugar só: mexer no ritmo é mexer aqui. */
export const T = {
  lobby: {
    lista: 300,
    linhas: 600,
    linhaPasso: 130,
    chegou: 2600,
    desafio: 4800,
    outroDesafio: 6900,
    aceitar: 9000,
    entrando: 9300,
    sai: 9900,
  },
  selecao: {
    escolhe: [800, 1600, 2400],
    rivalPronto: 2000,
    confirma: 3300,
    preview: 4200,
    rivalPasso: 150,
    primeiro: 6600,
    comecando: 7900,
  },
  arena: {
    escolha: 1200,
    usa: 3200,
    resolvendo: 4400,
    meuGolpe: 5000,
    acerto: 5700,
    golpeDele: 6600,
    acertoDele: 7300,
    proximo: 8100,
    // Cena do Elo: a partida terminou alguns turnos depois.
    fim: 8800,
    resultado: 9300,
    elo: 10100,
    novoElo: 10700,
    botao: 11200,
  },
}


/** Segundos que sobram de um prazo de 60s que começou em `desde`. */
export function restam(t, desde, total = 60) {
  return Math.max(0, total - Math.floor(Math.max(0, t - desde) / 1000))
}
