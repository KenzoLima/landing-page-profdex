# assets-src/sprites/

Os sprites **de origem** do elenco. `npm run assets:optimize` lê daqui e escreve
`public/professors/<slug>-pixel.png`, `-pixel-costas.png` e `-pixel-face.png`.

Cada professor tem `<slug>-frente.png` e `<slug>-costas.png`, copiados da pasta
de arte do time (`professores profdex/`):

- Os `.jpg` de lá (Wilson, João Marcos, Matheus) são **PNG com alfa** apesar da
  extensão — copie com o nome `.png`.
- Marcelo, Renata e Simone vêm da subpasta `prof com tamanhos corrigidos/`.
- O slug é o mesmo de `src/data/professors.js` (`luiz`, `joao-marcos`…).

## O que o script faz com eles

A arte é pixel art detalhada (~370×650 px) que já chegou reamostrada — não há
grade nativa limpa para recuperar. Então `normalizeSprite()`:

1. recorta pela caixa do desenho (ignorando a margem transparente);
2. reduz para 320 px de altura;
3. **binariza o alfa** — o removedor de fundo deixa uma borda macia (e, em alguns
   arquivos, uma sombra roxa), e pixel art não tem meio-termo;
4. assenta o boneco embaixo, no centro, de um canvas 320×320 — todos pisam na
   mesma linha quando ficam lado a lado na arena.

`faceCrop()` tira o rosto do sprite de frente já normalizado (46% da altura do
boneco).

## Os `.ase` do Gustavo

`gustavo-frente.ase` e `gustavo-costas.ase` são a arte de autoria **antiga**
(64×64, 13 e 14 quadros), guardada como histórico. Os `gustavo-*.png` desta pasta
já são a arte nova — não os regenere a partir dos `.ase`.
