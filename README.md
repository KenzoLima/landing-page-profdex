# Landing page do ProfDex

Página de divulgação do [ProfDex](https://profdex-two.vercel.app) para a Semana
Tecnológica da UniFil. Estática, sem backend, com um único CTA: levar o aluno ao
login institucional.

O briefing de conteúdo e identidade está em [LANDING-PAGE.md](./LANDING-PAGE.md).

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # roda o orçamento de assets antes de compilar
npm run preview
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prebuild` verifica o orçamento de assets, depois `vite build` |
| `npm run check:assets` | Só a verificação de orçamento |
| `npm run assets:optimize` | Recomprime imagens e regenera a imagem de Open Graph |
| `npm run model:optimize` | Regenera `public/models/mario-hero.glb` a partir do app |
| `npm run lint` / `npm run format` | oxlint / prettier |

## Como se relaciona com o repositório principal

O app vive em `D:\profdex\main\profdex-front` (Vue 3 + Vite + Pinia). Esta landing
é um projeto separado, e isso é deliberado: o app é uma casca mobile de 480px com
`overflow: hidden` no `body`, que não serve como vitrine nem em desktop.

O que foi copiado de lá, e precisa continuar em sincronia:

| Aqui | Origem | Observação |
|---|---|---|
| `src/styles/tokens.css` | `profdex-front/src/style.css` | Só os tokens de marca; os aliases de compatibilidade (`--red`, `--yellow`…) ficaram de fora |
| `src/styles/gba.css` | `HomeView.vue` | O molde GBA e o botão de pixel, extraídos do `<style scoped>` |
| `src/data/types.js` | `profdex-front/src/data/types.js` | **Cópia literal** + dois helpers de cor no fim. A roda da landing é derivada de `TYPE_CYCLE`/`strongAgainst()`, nunca digitada |
| `src/data/professors.js` | `professorTypes.js`, `professorSprites.js` | Ver a correção de contagem abaixo |
| `public/eagle-ball.png`, `public/professors/*` | `profdex-front/public/` | Recomprimidos |
| `public/models/mario-hero.glb` | `modelo-mario.glb` | 26,77 MB → 0,41 MB, ver abaixo |

Os cortes de Elo (`src/content/copy.js` → `pvp.tiers`) vieram de
`profdex-back/src/battle/elo.ts`, que é a fonte de verdade.

### Duas correções em relação ao briefing

1. **Não são 16 professores.** O `PROFESSOR_TYPES` tem 16 *chaves*, mas
   `ricardo-petri`/`ricardo` e `t-camis`/`camis` são pares de apelido do mesmo
   professor (o mapa registra slug e nome). São **14 pessoas**, 3 com arte. A
   página nunca digita esses números: eles saem de `TOTAL_PROFESSORS` e
   `LOCKED_COUNT`.
2. **Os cortes de Ouro e Platina** não estavam no briefing; foram lidos do
   `elo.ts`.

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

Reduz as texturas a 1024/1024/512 e as converte para JPEG, depois comprime a
geometria com Draco: **26,77 MB → 0,41 MB**, e a memória de GPU cai de ~268 MB
para ~13 MB. O `gltf-transform optimize` pronto não serve aqui: o passo
`textureCompress` quebra nestas texturas (`colourspace: parameter space not set`),
então elas são tratadas com sharp e só a geometria vai pelo CLI.

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

- houver mais de um `.glb` em `public/` (dois modelos foi o que estourou a memória);
- algum `.glb` passar de 5 MB;
- alguma imagem passar de 350 kB;
- o `MODEL_SIZE_MB` divergir do arquivo real (a página anuncia o tamanho antes de
  baixar; um aviso que mente é pior que nenhum aviso).

O combinado verbal de "não põe `.glb` pesado" já existia no projeto e não
segurou. Por isso o limite é código.

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
| `index.html` (CSS embutido) | 26,1 kB | 5,9 kB | sempre |
| `index.js` | 100,5 kB | 38,6 kB | sempre |
| `gsap` + `ScrollTrigger` | 112,7 kB | 45,0 kB | só ≥860px e sem movimento reduzido |
| `ModelStage` (three + tresjs) | 949,8 kB | 257,0 kB | só depois do clique em "VER EM 3D" |

Mais: fonte 12,5 kB, `eagle-ball.png` 9,5 kB.

O CSS da entrada é embutido no HTML por um plugin em `vite.config.js`: ele era o
único recurso bloqueando a renderização. A medida é neutra na métrica (o LCP é
dominado pelo mount do Vue, não pela rede), mas remove uma viagem de ida e volta
sem custo de bytes.

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

## Acessibilidade

Contraste conferido e anotado em `tokens.css`. A armadilha: `--unifil-gold` sobre
`--unifil-orange` dá 3,1:1 — reprovado para texto pequeno, e por isso o dourado só
aparece no `DEX` do hero (display de 56px).

As cores canônicas dos tipos foram desenhadas para preencher área, não para virar
texto: `legibleColor()` em `src/data/types.js` clareia a cor até passar em 4,5:1
sobre o fundo escuro, mantendo o matiz (o NPI, `#495057`, dava 1,7:1).

A roda SVG é `aria-hidden`: toda a informação dela existe em HTML — os nove
botões, o painel do tipo e uma tabela completa de vantagens para leitor de tela.

## Deploy

Projeto Vercel próprio, build `vite build` → `dist`. O `vercel.json` só define
cache longo para `/models/` e `/draco/`; não há reescrita de `/api`, porque a
landing não fala com o backend — o CTA é um link absoluto, centralizado em
`src/config/links.js`. A pendência do Cloudflare descrita em `DEPLOY-FRONT.md`
não afeta esta página.

`public/fonts/` traz a `Press Start 2P` auto-hospedada (OFL, 12,5 kB): serve para
tirar dois handshakes com o Google do caminho crítico. Ver o README de lá.

`public/draco/` é o decodificador Draco copiado do pacote `three` instalado — a
versão precisa casar com a do `GLTFLoader` em uso. Se atualizar o `three`,
recopie de `node_modules/three/examples/jsm/libs/draco/gltf/`.
