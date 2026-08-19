// O elenco da Pokédex.
//
// FONTE: profdex-front/src/data/{professorTypes,professorSprites}.js.
//
// ⚠️ Correção em relação ao LANDING-PAGE.md §3, que fala em "16 professores
// mapeados": o PROFESSOR_TYPES tem 16 CHAVES, não 16 pessoas. Duas são pares de
// apelido — o mapa registra slug e nome porque `typesForProfessor` tenta os
// dois ao casar o que vem da API:
//
//     'ricardo-petri' ≡ 'ricardo'   (ambos ['ia-ml'])
//     't-camis'       ≡ 'camis'     (ambos ['calculo', 'logica'])
//
// Logo: 14 professores distintos, 3 com arte. A landing NUNCA digita esses
// números — eles saem de `TOTAL_PROFESSORS` e `LOCKED_COUNT`, derivados daqui.
// Um professor novo com arte é uma linha nesta lista, e a página se ajusta.

/** Os únicos com arte e presença no seed do banco. */
export const CAPTURABLE = [
  {
    slug: 'mario',
    name: 'Mário',
    types: ['algoritmos'],
    // Os arquivos `-cartoon` do app são JPEG apesar da extensão .png. O nome foi
    // mantido igual ao do app de propósito, para os dois repositórios seguirem
    // comparáveis; o .webp ao lado é gerado por scripts/optimize-assets.mjs.
    image: '/professors/mario-cartoon.webp',
    fallback: '/professors/mario-cartoon.png',
  },
  {
    slug: 'eron',
    name: 'Eron',
    types: ['arquitetura', 'ia-ml'],
    image: '/professors/eron-cartoon.webp',
    fallback: '/professors/eron-cartoon.png',
  },
  {
    slug: 'gustavo',
    name: 'Gustavo',
    types: ['arquitetura'],
    image: '/professors/gustavo-cartoon.webp',
    fallback: '/professors/gustavo-cartoon.png',
    // Gustavo é também o boneco que o jogador controla na arena PvE.
    isPlayerAvatar: true,
  },
]

/**
 * Professores mapeados no sistema de tipos mas ainda sem retrato.
 *
 * Só o tipo é exposto — o nome fica em segredo, que é exatamente a graça de uma
 * Pokédex com entradas por descobrir. Os tipos vêm do PROFESSOR_TYPES; o
 * primeiro tipo de cada um é o que colore a silhueta.
 */
export const LOCKED = [
  { types: ['ia-ml'] }, // Ricardo Petri
  { types: ['npi'] }, // Simone
  { types: ['calculo', 'logica'] }, // T. Camis
  { types: ['logica', 'algoritmos'] }, // João
  { types: ['logica'] }, // Marcelo — "Programação" virou Lógica
  { types: ['logica'] }, // Guilherme
  { types: ['npi'] }, // Renata
  { types: ['ia-ml'] }, // Serginho
  { types: ['banco'] }, // Marcos — "Segurança" foi descartada
  { types: ['robotica', 'redes'] }, // Igor
  { types: ['banco'] }, // Edson — idem Marcos
]

export const TOTAL_PROFESSORS = CAPTURABLE.length + LOCKED.length
export const LOCKED_COUNT = LOCKED.length
