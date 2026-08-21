# public/fonts/

Aqui deveria estar `press-start-2p-latin.woff2` (OFL, ~12,5 kB), a fonte de
display auto-hospedada — ela é pré-carregada pelo `index.html` e usada por
`--font-pixel`.

O arquivo **não está versionado neste repositório**. Enquanto ele não estiver
aqui, a página cai no fallback declarado em `src/styles/tokens.css`
(`'Courier New', monospace`): tudo continua legível, só perde o traço 8-bit.

Para colocar a fonte no lugar, baixe o `.woff2` latino de
<https://fonts.google.com/specimen/Press+Start+2P> (ou copie de
`profdex-front/public/fonts/`) e salve com exatamente este nome:

    public/fonts/press-start-2p-latin.woff2

Nenhuma outra mudança é necessária — o `@font-face` já aponta para cá.
