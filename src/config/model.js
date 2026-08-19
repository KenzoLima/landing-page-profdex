// O único modelo 3D que esta landing serve.
//
// `null` desliga a seção 3D por completo: o botão "VER EM 3D" some e a seção
// fica no retrato 2D. É o modo de falha correto — a página continua inteira
// sem o 3D, e nunca oferece um botão que não tem o que carregar.
//
// O arquivo é gerado por `npm run model:optimize`, a partir do
// modelo-mario.glb de 26,77 MB do app. Ver o cabeçalho de
// scripts/optimize-model.mjs para o que foi feito e por quê.
export const MODEL_URL = '/models/mario-hero.glb'
