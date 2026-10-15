<script setup>
import { battleVideo } from '@/content/copy.js'
import { VIDEOS } from '@/config/links.js'
import SectionShell from '@/components/SectionShell.vue'

// Os dois vídeos do evento, com o player NATIVO do navegador.
//
// Controles próprios (play, barra, tela cheia) custariam teclado, leitor de
// tela, legenda e tela cheia no iOS refeitos à mão — o nativo já entrega tudo
// isso. O que a casa acrescenta é a moldura GBA em volta.
//
// Peso: `preload="none"` + poster. Nenhum byte de vídeo sai antes do play; a
// página paga só o poster (~30 KB cada). Os arquivos têm `+faststart`, então o
// play começa antes de o download terminar.
const ordem = ['teaser', 'encerramento']
const lista = ordem.map((key) => ({ key, ...VIDEOS[key], ...battleVideo.videos[key] }))
</script>

<template>
  <SectionShell id="video" :kicker="battleVideo.kicker" :title="battleVideo.title">
    <template #lede>{{ battleVideo.desc }}</template>

    <div class="videos">
      <figure
        v-for="video in lista"
        :key="video.key"
        class="video"
        :class="video.height > video.width ? 'video--vertical' : 'video--horizontal'"
      >
        <div class="video__frame gba-frame">
          <video
            class="video__player"
            :src="video.src"
            :poster="video.poster"
            :width="video.width"
            :height="video.height"
            :aria-label="video.title"
            preload="none"
            controls
            playsinline
          />
        </div>
        <figcaption class="video__caption">
          <span class="video__title">{{ video.title }}</span>
          <span class="video__desc">{{ video.caption }}</span>
        </figcaption>
      </figure>
    </div>
  </SectionShell>
</template>

<style scoped>
.videos {
  display: grid;
  gap: var(--space-5);
  align-items: start;
}

/* Lado a lado a partir do tablet: o vertical numa coluna estreita, o
   horizontal com o resto. Mesma altura nos dois players sem esticar nenhum —
   a coluna do vertical tem a largura que faz 9:16 bater com a altura do 16:9
   (81/256, corrigido pelo gap e pela moldura ≈ 0,338). Alinhados pelo topo:
   as legendas têm alturas diferentes. */
@media (min-width: 860px) {
  .videos {
    grid-template-columns: minmax(0, 0.338fr) minmax(0, 1fr);
    align-items: start;
  }
}

.video {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
}

/* No celular o vertical não ocupa a tela inteira de altura: 320px de largura
   já dão um story legível sem obrigar a rolar por cima dele. */
.video--vertical {
  width: min(100%, 320px);
  justify-self: center;
}

@media (min-width: 860px) {
  .video--vertical {
    width: 100%;
  }
}

.video__frame {
  padding: var(--space-2);
}

.video__player {
  display: block;
  width: 100%;
  height: auto;
  background: var(--bg-deep);
  border-radius: var(--radius);
}

.video--vertical .video__player {
  aspect-ratio: 9 / 16;
}

.video--horizontal .video__player {
  aspect-ratio: 16 / 9;
}

.video__player:focus-visible {
  outline: 3px solid var(--unifil-gold);
  outline-offset: 3px;
}

.video__caption {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.video__title {
  font-family: var(--font-pixel);
  font-size: var(--fs-h3);
  line-height: 1.6;
  color: var(--unifil-gold);
}

.video__desc {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
  text-wrap: pretty;
}
</style>
