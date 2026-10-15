# Landing page do ProfDex

Página de divulgação do ProfDex, feito para a TechFil (antiga Semana Tecnológica
da UniFil). Estática, sem backend. Enquanto o jogo está fora do ar, a página não
linka para o app: os botões levam aos vídeos e aos créditos da própria página.

Publicação: projeto próprio na Vercel (raiz do domínio) ou
**https://profdex.unifil.tech/landing/**, atrás do nginx de borda do monorepo —
ver "Deploy" no fim deste arquivo.

O briefing de conteúdo e identidade está em [LANDING-PAGE.md](./LANDING-PAGE.md).

```bash
npm install
npm run dev       # http://localhost:5174/landing/
npm run build     # roda o orçamento de assets antes de compilar
npm run preview
```

Da raiz do monorepo, `npm run dev:landing` sobe só a landing e
`npm run dev:all` sobe app + backend + landing juntos. Com os dois no ar, o dev
server do app repassa `/landing` para cá — ou seja,
`http://localhost:5173/landing/` funciona igual à produção.

## De onde este código veio

Cópia de [KenzoLima/landing-page-profdex](https://github.com/KenzoLima/landing-page-profdex),
trazida para o monorepo em 22/08/2026 para que a landing seja publicada no mesmo
domínio do app, pelo mesmo pipeline (um `git push` na `deploy`, uma imagem no
GHCR, um `docker compose up`).

`node_modules/` e `dist/`, que estavam versionados no repo de origem, ficaram de
fora — são 228 dos 232 MB daquele clone e nenhum dos dois é fonte.

### O que mudou em relação ao original

Só o necessário para a página viver sob um prefixo de URL e ao lado do app:

| Arquivo | Mudança | Porquê |
|---|---|---|
| `vite.config.mjs` | `base: '/landing/'` (via `VITE_BASE`), porta de dev 5174 | O prefixo do nginx; a 5173 é do app |
| `src/config/asset.js` | **Novo** | O Vite aplica o `base` no HTML e no CSS, nunca em strings dentro do JS |
| `src/data/professors.js` | Caminhos de `public/` passam por `asset()` | Idem — sem isso, os `.glb` e sprites apontariam para a raiz do domínio, onde mora o app |
| `src/three/GlbModel.vue`, `SiteNav.vue`, `SiteFooter.vue`, `HeroSection.vue` | Idem | O compilador do Vue não reescreve `src="/..."` absoluto |
| `src/config/links.js` | Sem link para o app; registra vídeos e fotos | O jogo está fora do ar por algumas semanas |
| `index.html` | `og:url`/`og:image` absolutos via `__SITE_URL__` | `meta[content]` é o único atributo que o Vite não reescreve com o `base`; o plugin em `vite.config.mjs` resolve o domínio |
| `Dockerfile`, `nginx.conf` | **Novos** | Build estático + nginx interno, espelhando `profdex-front/` |

### Como trazer mudanças novas do repo de origem

```bash
git clone --depth 1 https://github.com/KenzoLima/landing-page-profdex /tmp/landing-upstream
diff -ru --exclude=node_modules --exclude=dist --exclude=.git \
  /tmp/landing-upstream profdex-landing
```

Aplique o que interessa à mão e confira a tabela acima antes de sobrescrever um
dos arquivos listados — são os que divergem de propósito.

## Como é publicada

```
Internet → Cloudflare → nginx de borda (../nginx/)
                          └── /landing/ → container `landing` (este diretório)
```

`Dockerfile` compila com Vite e serve o `dist/` por um nginx interno, a partir de
`/usr/share/nginx/html/landing/` — o prefixo existe no disco porque o nginx de
borda repassa a URL inteira (`proxy_pass` sem barra final). Detalhes do deploy em
[../deploy.md](../deploy.md).

---

## Como se relaciona com o app

O app é o `../profdex-front` (Vue 3 + Vite + Pinia). A landing continua sendo um
projeto à parte mesmo dentro do monorepo, e isso é deliberado: o app é uma casca
mobile de 480px com `overflow: hidden` no `body`, que não serve como vitrine nem
em desktop. São builds separados, dependências separadas, containers separados.

O que foi copiado de lá, e precisa continuar em sincronia:

| Aqui | Origem | Observação |
|---|---|---|
| `src/styles/tokens.css` | `profdex-front/src/style.css` | Só os tokens de marca; os aliases de compatibilidade (`--red`, `--yellow`…) ficaram de fora |
| `src/styles/gba.css` | `HomeView.vue` | O molde GBA e o botão de pixel, extraídos do `<style scoped>` |
| `src/data/types.js` | `profdex-front/src/data/types.js` | **Cópia literal** + dois helpers de cor no fim. A roda da landing é derivada de `TYPE_CYCLE`/`strongAgainst()`, nunca digitada |
| `src/data/professors.js` | Cadastro do app em produção (nome, slug, tipos) | Tipos não conferidos ficam `[]` e o card mostra "Tipo ???" |
| `public/professors/*-pixel*.png` | `assets-src/sprites/` (aqui), copiados de `professores profdex/` | 320×320, ver abaixo |
| `public/models/<slug>.glb` | `professores profdex 3D/` | ~1 GB de origem → 9,5 MB, ver abaixo |
| `public/videos/`, `public/photos/` | `profdex-midia/` | Comprimidos uma vez (ffmpeg / sharp); ver "Mídia" |

Os cortes de Elo (`src/content/copy.js` → `pvp.tiers`) vieram de
`profdex-back/src/battle/elo.ts`, que é a fonte de verdade.

Os pesados não são versionados aqui em bruto: os `.glb` de até 65 MB ficam na
pasta `professores profdex 3D`, e este repo guarda o resultado mais o script que
sabe refazê-lo. Ele acha a pasta sozinho ao lado do repo; se ela estiver noutro
canto, `PROFDEX_MODELS_DIR=<caminho> npm run model:optimize`.

### Os sprites

Os bonecos de frente e de costas de cada professor ficam em
[`assets-src/sprites/`](./assets-src/sprites/) como `<slug>-{frente,costas}.png`
(copiados da pasta `professores profdex`; os `.jpg` de lá são PNG com alfa apesar
da extensão, e Marcelo, Renata e Simone vêm da subpasta de tamanhos corrigidos).

A arte do elenco atual é pixel art detalhada (~370×650 px) que já chegou
reamostrada, sem grade nativa para recuperar. `assets:optimize` recorta cada
boneco pela caixa do desenho, reduz para 320 px de altura, **binariza o alfa**
(o removedor de fundo deixa borda macia e, em alguns, uma sombra roxa) e assenta
o boneco embaixo, no centro, de um canvas 320×320 — todos pisam na mesma linha.
Como a página exibe o sprite a ~170 px, é uma redução: as `<img>` não usam
`image-rendering: pixelated`.

Também recorta um `-pixel-face.png` de cada sprite de frente (46% da altura do
boneco): é o retrato da seção 3D e do seletor de modelos.

Onde cada um entra: corpo de frente no card da Pokédex; na arena, o adversário de
frente e o Gustavo **de costas** (o seu, em primeiro plano); o rosto na seção 3D.

O enquadramento clássico é esse: o adversário encara você, e a câmera está atrás
do ombro do seu. Quem diz de que lado cada um está é o **disco no chão**
(vermelho/azul), não uma moldura — emoldurar um sprite recortado o devolve à
condição de retrato.

### O disco no chão, que custou duas tentativas

O sprite tem os pés encostados na borda de baixo da própria imagem (a caixa do
desenho vai de `y=0` a `y=63` num arquivo de 64 px), então **a linha do chão é
exatamente a base da `<img>`**. Duas coisas quebraram nesse alinhamento:

1. **O disco pintava por cima do boneco.** `::before` é `position: absolute`, e
   conteúdo posicionado pinta depois de conteúdo não posicionado — mesmo vindo
   antes no documento. A `<img>` precisou de `position: relative; z-index: 1`.
2. **`bottom: 9%` e `padding-bottom: 9%` não são a mesma medida.** Porcentagem de
   `bottom` resolve contra a ALTURA do contêiner; de `padding`, contra a LARGURA
   — e, num flex item, contra a largura do *flex container* (a linha de ~680 px),
   não a da própria figure. Dava 61 px de espaço morto e a elipse subia para a
   canela.

A versão que funciona não usa posicionamento absoluto: disco e boneco são o
**mesmo item de grade** (`grid-area: 1 / 1`), os dois `align-self: end`, e um
`translate: 0 50%` leva o centro da elipse até a base — que é a linha dos pés por
construção, não por um número mantido à mão. O respiro de baixo sai de
`calc(var(--largura) * 0.091)`, onde 0,091 é meia elipse derivada da mesma
largura, então os dois continuam casados em qualquer tela.

## Conteúdo: onde mexer

Todo o texto está em [`src/content/copy.js`](./src/content/copy.js), com o bloco
de **guardas factuais** no topo — a lista do que a página não pode afirmar
(não existe app nativo, não existe cadastro por formulário, a batalha contra a IA
não ranqueia…). Leia antes de escrever qualquer frase nova.

### Regra de tipografia que não é óbvia

**Texto em fonte pixel nunca leva `text-transform: uppercase`.**

A `Press Start 2P` não tem maiúscula acentuada utilizável: desenha `Ó` como um
`o` de altura minúscula e **descarta** o til de `Ã` e o grave de `À` — acento
acima da caixa alta não cabe na grade de pixel. (`Ç` funciona, porque o cedilha
fica abaixo da linha de base.)

Em português isso quebra palavras centrais: `COLEÇÃO` vira `COLECAO`. O app nunca
esbarrou nisso porque os textos dele em pixel não têm acento. Aqui a caixa é
decidida pelo conteúdo, no `copy.js`. A regra está registrada em
`src/styles/base.css`.

## A camada 3D

O briefing proíbe, com todas as letras, colocar os `.glb` do projeto nesta
página, e abre uma exceção: *um só, sob interação explícita do usuário, e
otimizado antes*. É exatamente o que está implementado.

### Por que a proibição existe

`docs/BUG-BATALHA-TRAVANDO.md` no repositório principal: a arena PvP montava dois
`<model-viewer>` simultâneos, o Safari do iOS estourava o orçamento de memória da
aba e **descartava a página no meio da batalha**. Chegou ao time como "a batalha
dá refresh sozinha".

O `gltf-transform inspect` mostrou que a explicação do documento — "~148 MB de
geometria" — não é o que acontecia:

| | Disco | Memória de GPU |
|---|---|---|
| Geometria (32.180 vértices) | 1,33 MB | — |
| baseColor 4096×4096 | 12,53 MB | **89,48 MB** |
| normal 4096×4096 | 5,96 MB | **89,48 MB** |
| metallicRoughness 4096×4096 | 8,25 MB | **89,48 MB** |

São **268 MB de textura na GPU para um professor**. Dois combatentes passavam de
meio gigabyte. A geometria era irrelevante.

### O que `npm run model:optimize` faz

Reduz as texturas a 1024/1024/512 e as converte para JPEG, depois solda os
vértices, simplifica a malha (só acima de 100 mil vértices, mirando ~60 mil) e
comprime a geometria com Draco. Os 23 modelos (16 professores + 7 formas
especiais) saem entre 0,24 e 0,82 MB:

| | Disco antes | Disco depois | Vértices |
|---|---|---|---|
| Professores regulares (×15) | 1,2–3,5 MB | **0,24–0,33 MB** | ~17 mil, intactos |
| Marcelo | 58,51 MB | **0,57 MB** | 1.013.737 → 68.507 |
| Formas especiais (×6 esculturas) | 59–64 MB | **0,59–0,82 MB** | ~1 milhão → ~70 mil |
| Tânia Palmeiras | 1,35 MB | **0,28 MB** | 17.042 |

A lista slug → arquivo de origem é `MODEL_ENTRIES` (`src/config/model.js`), que
sai do `professors.js`. A página **não** mostra o tamanho dos modelos.

O `textureCompress` do gltf-transform quebra nestas texturas específicas
(`colourspace: parameter space not set`), então elas passam pelo sharp e só a
geometria vai pelos passos da lib.

### Vários modelos, um palco

A seção 3D deixa escolher o professor ou uma forma especial. A regra que importa não é "quantos
arquivos existem" — é **um palco WebGL por página**, e ela mora em
`useLazyModel.js`: trava no escopo do módulo, `release()` ao trocar de professor
(o `v-if` desmonta o palco entre um e outro, e é o desmonte que devolve as
texturas) e `release()` ao sair da tela. Trocar a URL de um palco vivo vazaria o
modelo anterior — por isso a troca passa por fechar e reabrir.

### A cadeia de guardas

`src/three/useLazyModel.js`. Nesta ordem, e todas precisam passar:

1. Seção visível (`IntersectionObserver`)
2. **Clique explícito** — sem gesto, nenhum byte é pedido
3. `navigator.connection.saveData` desligado
4. `effectiveType` fora de `slow-2g`/`2g`
5. `deviceMemory` ≥ 4 GB
6. WebGL disponível (contexto de sondagem é destruído com `WEBGL_lose_context`)

Cada recusa mostra o motivo ao usuário; o estado inicial e o de recusa são a
mesma imagem 2D. Uma trava no escopo do módulo garante **um** palco por página.
Rolar para fora desmonta.

O `import()` do palco é dinâmico, então `three` + `@tresjs` ficam num chunk
separado que só existe depois do clique.

### Por que há um `disposeObject3D.js` próprio

O `@tresjs/core` exporta um `dispose`, mas o `disposeMaterial` dele descarta
**apenas** `material.map`. Nosso modelo tem `map`, `normalMap` e
`metalnessMap`/`roughnessMap` — usar o da biblioteca vazaria duas de três
texturas, que é precisamente o modo de falha do incidente. O nosso varre o
material por contrato (`isTexture`).

## Orçamento de assets

`scripts/check-asset-budget.mjs` roda no `prebuild` e **quebra o build** se:

- algum `.glb` passar de **2 MB** (ou ficar abaixo de 20 kB — é o cubo de
  placeholder);
- os `.glb` **somados** passarem de **20 MB** (orçamento de deploy: o aluno nunca
  baixa mais de um por vez);
- alguma imagem passar de 350 kB, ou algum vídeo passar de 8 MB;
- algum sprite, modelo, vídeo, poster ou foto referenciado em `professors.js`,
  `links.js` ou `copy.js` não existir em `public/` (card quebrado é pior que card
  ausente, e um 404 de `.glb` some dentro do loader — o palco fica carregando
  para sempre, sem erro);
- o `public/draco/` divergir do decodificador do `three` instalado (versão
  descasada não quebra o build: quebra o navegador do aluno).

O combinado verbal de "não põe `.glb` pesado" já existia no projeto e não
segurou. Por isso o limite é código.

**Uma regra mudou.** A versão anterior proibia mais de um `.glb` em `public/` —
leitura correta do incidente com arquivos de 27–74 MB, quando "quantos arquivos
existem" era uma proxy honesta para "quanta memória isto pode pedir". Depois do
`optimize-model.mjs` cada modelo fica abaixo de 1 MB, a contagem deixou de medir
o risco, e mantê-la custaria justamente o que a seção 3D existe para mostrar: o
elenco inteiro. O que impedia o incidente sempre foi um palco por página, e isso
continua onde estava.

## Mídia

Os dois vídeos de `profdex-midia/` (WhatsApp, 40 e 68 MB) foram comprimidos uma
vez com ffmpeg — H.264 + AAC, `+faststart`, CRF 27 (teaser vertical, 720×1280,
5,5 MB) e CRF 31 (encerramento, 1280×720, 7,4 MB) — e têm poster `.webp` (~30 kB).
O player é o nativo, com `preload="none"`: nenhum byte de vídeo sai antes do play.

As fotos do time (4 das 14 do evento) e o relatório de métricas saem em `.webp`
com duas larguras para o `srcset` (`public/photos/`), todas abaixo de 120 kB.

## Números medidos

Build de produção, Chrome DevTools, **Slow 4G + CPU 4×**, viewport 390×844:

| | |
|---|---|
| LCP | **2,08 s** (elemento: o parágrafo do hero) |
| CLS | **0,00** |
| Lighthouse | Acessibilidade **100** · Boas práticas **100** · SEO **100** |
| Carregamento inicial | **~44 kB** comprimido (HTML com CSS embutido + JS) |

| Chunk | Bruto | Gzip | Quando carrega |
|---|---|---|---|
| `index.html` | 2,5 kB | 1,2 kB | sempre |
| `index.css` | 24,6 kB | 4,9 kB | sempre |
| `index.js` | 101,4 kB | 38,9 kB | sempre |
| `gsap` + `ScrollTrigger` | 112,7 kB | 45,0 kB | só ≥860px e sem movimento reduzido |
| `ModelStage` (three + tresjs) | 959,6 kB | 259,4 kB | só depois do clique em "VER EM 3D" |
| Draco (wasm + wrapper) | 478 kB | 154 kB | só junto com o `ModelStage` |

Mais: `eagle-ball.png` 6,4 kB, sprites 1,3–2,3 kB cada, retratos ~24 kB cada.

> ⚠️ **O in-line do CSS não está ligado.** Esta seção descrevia um plugin em
> `vite.config.js` que embutia o CSS da entrada no HTML — o arquivo não existe
> (a config é `vite.config.mjs`) e o build de hoje emite `index.css` à parte,
> como a tabela acima mostra. As linhas de LCP/CLS/Lighthouse são de uma medição
> anterior e não foram refeitas; os tamanhos de chunk são do build atual. Vale
> uma medição nova antes de citar esses números em qualquer lugar.

**Próxima alavanca, se quiserem mais:** o LCP restante é quase todo execução de
JavaScript, porque a página é renderizada no cliente. Pré-renderizar o HTML no
build (SSG) atacaria isso de frente. Não foi feito — é uma mudança de arquitetura,
e a meta de 2,5 s já é cumprida com folga.

## Movimento

Três camadas, por custo crescente:

1. **CSS** cobre quase tudo — reveal por `IntersectionObserver` (`useReveal.js`,
   ~30 linhas), barras de HP, barras da tabela de pontos. `steps()` em vez de
   `ease` é o que dá o gesto 8-bit.
2. **GSAP + ScrollTrigger**, `import()` dinâmico, só na roda de tipos, e só com
   viewport ≥860px, sem `prefers-reduced-motion` e após interação. No celular
   nunca é baixado.
3. **WebGL**, só sob clique.

O estado inicial invisível do reveal é aplicado pelo próprio JS
(`data-reveal="pending"`). Se o script falhar, o atributo não aparece, o seletor
não casa e o conteúdo fica visível — o modo de falha certo para uma landing.

Com `prefers-reduced-motion: reduce`, o GSAP não é baixado e o 3D continua
disponível, sem rotação automática: preferência de movimento não deve negar
conteúdo.

### A roda que gira na mão

`TypeWheelSection.vue` tem um quarto tipo de movimento, que não é nenhuma das
três camadas: **física própria num `requestAnimationFrame`**, ~40 linhas, zero
bytes de biblioteca. Segurar a roda carrega impulso, soltar deixa a inércia
correr com atrito exponencial, e ao parar ela trava no múltiplo de 40° mais
próximo. O tipo que ficou sob o ponteiro do topo é a seleção.

Quatro decisões que não são óbvias:

1. **O estado é um ângulo.** `rotation` é a fonte de verdade; `selectedId` é
   `indexAtTop(rotation)` gravado no momento do assentamento. Ele é publicado no
   INÍCIO da parada, não no fim — assim o painel acompanha a roda chegando, sem
   repintar a cada 40° durante o giro livre.
2. **Os ícones contra-giram.** O grupo dos setores gira por CSS; cada ícone
   recebe `rotate(-θ 14 14)` no atributo SVG. Sem isso os nove símbolos ficam de
   cabeça para baixo na primeira meia volta. É também por isso que o
   assentamento é interpolado em JS e não por `transition` de CSS: os dois
   precisam sair do MESMO número, ou o símbolo fica para trás do setor.
3. **O scroll-spin não disputa o transform.** O GSAP gira o `<svg>` inteiro
   (ponteiro junto); a mão gira só o grupo interno. No primeiro `pointerdown` o
   ângulo do scroll é dobrado no da mão e o ScrollTrigger morre — daí em diante
   a roda é do usuário.
4. **`touch-action: pan-y`.** A roda ocupa meia tela no celular; capturar o
   gesto vertical prenderia o aluno na seção. O que sobra para o gesto é o toque
   parado, que é exatamente o clique longo. Se o navegador decidir rolar no meio
   do giro, chega um `pointercancel` e a roda é solta com a inércia que tinha.

O clique curto continua selecionando o setor tocado (agora ele também viaja até
o topo). Com movimento reduzido não há giro nem inércia: o clique curto é um
corte seco e o clique longo avança um tipo. Pelo teclado, os nove chips
continuam alcançando tudo, e ←/→ andam de um tipo por vez — a `<svg>` segue
`aria-hidden`, e nunca foi a única porta.

### As variações do reveal

O reveal global (`useReveal.js` + `data-reveal`) ganhou duas variações em
`base.css`, aplicadas por classe no mesmo elemento observado, sem observador
novo: `.reveal-steps` troca o easing por `steps()` (para caixas de UI de jogo) e
`.reveal-stagger` mantém o contêiner visível e faz os FILHOS entrarem em
cascata, com o índice vindo do template (`--reveal-i`, 70ms por posição). Usam
isso a lista de passos, o fluxo do PvP, a grade da Pokédex, as barras da tabela
de pontos e as da escada de Elo.

## Acessibilidade

Contraste conferido e anotado em `tokens.css`. A armadilha: `--unifil-gold` sobre
`--unifil-orange` dá 3,1:1 — reprovado para texto pequeno, e por isso o dourado só
aparece no `DEX` do hero (display de 56px).

As cores canônicas dos tipos foram desenhadas para preencher área, não para virar
texto: `legibleColor()` em `src/data/types.js` clareia a cor até passar em 4,5:1
sobre o fundo escuro, mantendo o matiz (o NPI, `#495057`, dava 1,7:1).

A roda SVG é `aria-hidden`: toda a informação dela existe em HTML — os nove
botões, o painel do tipo e uma tabela completa de vantagens para leitor de tela.

## Simulador do app (`src/app-demo/`)

Com o jogo fora do ar, a seção "Experimente" (`#simulador`) traz uma réplica
navegável do app dentro de um celular desenhado: ProfDex (coleção + ficha),
Capturar (scanner sem câmera), Batalha (treino jogável contra a IA), Ranking e
Raid (o lendário Sérgio Tanaka, cena a cena).

- **Motor de batalha:** `src/app-demo/engine/` é cópia do motor de TREINO do app
  (`moves.js`, `battleEngine.js`, `useBattle.js`…), que já rodava 100% no
  navegador. Só os imports mudaram, e o `useBattle` expõe `state`/`tick` para as
  pílulas de efeito. Se o balanceamento mudar no app, recopie.
- **Dados:** `src/app-demo/mock.js` é tudo fictício (coleção, IVs com semente,
  ranking com apelidos genéricos). Nenhum nome de aluno aparece.
- **Raid:** `src/app-demo/raid-script.js` usa os textos do servidor do app; a
  sequência (Matemática no estágio 2, Robótica no 3) é uma raid possível.
- **Elenco:** nomes, slugs e tipos vêm do cadastro de produção
  (`GET /api/professors` e `/api/professors/rares`); os sprites, de
  `/uploads/<slug>-{frente,costas}[-e2|-e3].png`, copiados para
  `assets-src/sprites/` (raros e lendário em `assets-src/sprites/raros/`).
- O simulador é um chunk separado, montado só quando a seção chega perto da tela.

## Deploy

Dois caminhos, o mesmo código:

- **Vercel (projeto próprio, raiz do domínio).** Importe o repositório; o
  `vercel.json` já define `npm run build:vercel` (orçamento de assets + build com
  `VITE_BASE=/`) e a saída `dist`. Cache `immutable` para `/assets/` e `/draco/`,
  cache de uma semana para modelos, vídeos, fotos e sprites. O `og:url` e o
  `og:image` usam o domínio de produção que a Vercel injeta no build
  (`VERCEL_PROJECT_PRODUCTION_URL`); para um domínio próprio, defina
  `VITE_SITE_URL=https://seu-dominio/` nas variáveis do projeto. O
  `.vercelignore` deixa o `node_modules` versionado de fora, para a Vercel
  instalar as dependências de Linux.
- **nginx do monorepo (`/landing/`).** `Dockerfile` + `nginx.conf`, base padrão
  `/landing/` — continua funcionando como antes.

A landing não fala com o backend nem linka para o app: o jogo está fora do ar, e
os botões levam às seções da própria página.

`public/fonts/` traz a `Press Start 2P` auto-hospedada (OFL, 12,5 kB): serve para
tirar dois handshakes com o Google do caminho crítico. Ver o README de lá.

`public/draco/` é o decodificador Draco copiado do pacote `three` instalado — a
versão precisa casar com a do `GLTFLoader` em uso. Se atualizar o `three`,
recopie de `node_modules/three/examples/jsm/libs/draco/gltf/`.
