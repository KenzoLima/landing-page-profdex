import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// `@` aponta para src/ — é o alias que todos os imports do projeto usam
// (`@/sections/HeroSection.vue`). Sem ele nada resolve.
export default defineConfig({
  plugins: [
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
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
  },
})
