// Todo link e todo arquivo de mídia que a página referencia moram aqui.
//
// O jogo está fora do ar por algumas semanas, então a página não aponta para o
// app: os botões levam às próprias seções dela.
import { asset } from './asset.js'

export const REPO_URL = 'https://github.com/KenzoLima/landing-page-profdex'
export const COMP_URL = 'https://www.instagram.com/computacaounifil/'
export const UNIFIL_URL = 'https://www.unifil.br'

/**
 * Os dois vídeos do evento, já comprimidos (H.264 + AAC, `+faststart`).
 *
 * `width`/`height` são as dimensões reais do arquivo: o player reserva o espaço
 * certo antes de qualquer byte chegar. `preload="none"` no componente faz com
 * que nada seja baixado antes do play.
 */
export const VIDEOS = {
  teaser: {
    src: asset('/videos/profdex-teaser.mp4'),
    poster: asset('/videos/profdex-teaser-poster.webp'),
    width: 720,
    height: 1280,
  },
  encerramento: {
    src: asset('/videos/profdex-encerramento.mp4'),
    poster: asset('/videos/profdex-encerramento-poster.webp'),
    width: 1280,
    height: 720,
  },
}

/** Foto do time em duas larguras, para o `srcset`. Proporção 3:2. */
export const photo = (slug) => ({
  src: asset(`/photos/${slug}-800.webp`),
  srcset: `${asset(`/photos/${slug}-800.webp`)} 800w, ${asset(`/photos/${slug}-1600.webp`)} 1600w`,
  width: 1600,
  height: 1065,
})

export const METRICS_IMAGE = {
  src: asset('/photos/metricas-600.webp'),
  srcset: `${asset('/photos/metricas-600.webp')} 600w, ${asset('/photos/metricas-1000.webp')} 1000w`,
  full: asset('/photos/metricas-1000.webp'),
  width: 1000,
  height: 1822,
}
