import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// `@` aponta para src/ — é o alias que todos os imports do projeto usam
// (`@/sections/HeroSection.vue`). Sem ele nada resolve.

// Prefixo de URL da landing. Nesta cópia é SEMPRE `/landing/`, em dev e em
// produção, porque é onde o nginx de borda a publica
// (profdex.unifil.tech/landing/ — ver nginx/templates/default.conf.template).
// Manter dev e produção no mesmo prefixo é o que evita a classe de bug em que
// tudo funciona no localhost e some no deploy.
//
// `VITE_BASE` publica a página na raiz de outro domínio. É o que o deploy na
// Vercel usa: `npm run build:vercel` (ver vercel.json) builda com base '/'.
//
// Quem consome isso em runtime é `src/config/asset.js` — todo caminho para
// public/ passa por lá, porque o Vite reescreve o base sozinho só no HTML e no
// CSS, nunca em strings dentro do JS.
const base = process.env.VITE_BASE ?? '/landing/'

// Endereço público da página, para as metatags Open Graph — o crawler do
// WhatsApp não resolve caminho relativo, então `og:image` precisa ser absoluto.
// Ordem: definido à mão > domínio de produção que a Vercel injeta no build >
// o endereço histórico, atrás do nginx do app.
const siteUrl = (
  process.env.VITE_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}${base}`
    : `https://profdex.unifil.tech${base}`)
).replace(/\/?$/, '/')

/** Troca `__SITE_URL__` no index.html pelo endereço público resolvido acima. */
const siteUrlPlugin = {
  name: 'profdex-site-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
}

export default defineConfig({
  base,
  plugins: [
    siteUrlPlugin,
    vue({
      // As tags `<TresPerspectiveCamera>`, `<TresAmbientLight>` e `<primitive>`
      // não são componentes Vue: quem as interpreta é o renderer do TresJS,
      // dentro do <TresCanvas>. Sem esta regra o compilador do Vue tenta
      // resolvê-las como componentes, não acha, e enche o console de "Failed to
      // resolve component" toda vez que alguém abre o 3D.
      //
      // `TresCanvas` fica de FORA da regra: esse é um componente Vue de verdade,
      // importado do @tresjs/core, e tratá-lo como elemento nativo o faria
      // renderizar uma tag vazia — sem canvas, sem renderer, sem erro.
      //
      // Efeito colateral que morde: NENHUM componente NOSSO pode se chamar
      // `Tres*`, porque cairia nesta regra e renderizaria vazio. É por isso que
      // o palco se chama `ModelStage` e o conteúdo, `StageContent`.
      template: {
        compilerOptions: {
          isCustomElement: (tag) =>
            tag === 'primitive' || (tag.startsWith('Tres') && tag !== 'TresCanvas'),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 5174, e não a 5173 do Vite: essa é a porta do app (profdex-front), e as
    // duas sobem juntas em `npm run dev:all` na raiz do monorepo. O app repassa
    // /landing para cá em dev (ver profdex-front/vite.config.js).
    port: 5174,
    host: true,
    open: false,
  },
  build: {
    outDir: 'dist',
  },
})
