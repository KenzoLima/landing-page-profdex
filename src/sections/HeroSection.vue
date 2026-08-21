<script setup>
import { hero } from '@/content/copy.js'
import { APP_LOGIN_URL } from '@/config/links.js'
import PixelButton from '@/components/PixelButton.vue'
</script>

<template>
  <header class="hero">
    <div class="hero__inner container">
      <div class="hero__art">
        <!-- Esta imagem é o LCP da página, então NÃO é lazy e NÃO é async:
             ela precisa estar na primeira leva. 6,4 KB depois da quantização
             para paleta indexada (era 205 KB — ver
             scripts/make-placeholder-assets.mjs). -->
        <img
          class="hero__ball pixelated"
          src="/eagle-ball.png"
          alt="Logo do ProfDex: uma águia em pixel art dentro de uma bola de captura"
          width="500"
          height="500"
          fetchpriority="high"
          decoding="sync"
        />
      </div>

      <div class="hero__text">
        <p class="hero__context">{{ hero.context }}</p>
        <h1 class="hero__title">
          {{ hero.wordmarkStart }}<span class="hero__title-accent">{{ hero.wordmarkEnd }}</span>
        </h1>
        <p class="hero__subtitle">{{ hero.subtitle }}</p>
        <p class="hero__lede">{{ hero.lede }}</p>

        <div class="hero__cta">
          <PixelButton :href="APP_LOGIN_URL" external>{{ hero.cta }}</PixelButton>
          <p class="hero__cta-hint">{{ hero.ctaHint }}</p>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  background: var(--unifil-orange);
  /* A borda inferior grossa em `--surface` é o mesmo corte da home do app:
     é ela que faz o hero parecer a tampa de um console. */
  border-bottom: 6px solid var(--surface);
  padding-block: var(--space-5) var(--space-6);
  position: relative;
  overflow: hidden;
}

/* Scanlines: 3px de linha a cada 6px, a 6% de opacidade. Textura de tela de
   console sem virar ornamento — o PRODUCT.md pede que o retrô oriente a tarefa,
   não compita com ela. */
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(to bottom, rgb(0 0 0 / 6%) 0 3px, transparent 3px 6px);
  pointer-events: none;
}

.hero__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero__ball {
  width: clamp(112px, 26vw, 176px);
  height: auto;
  /* Sombra dura, sem blur: é a sombra que um sprite tem, não a de um cartão. */
  filter: drop-shadow(4px 4px 0 rgb(0 0 0 / 25%));
  animation: hero-float 4s steps(8, end) infinite;
}

@keyframes hero-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.hero__context {
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  /* Sobre o laranja da marca, só branco passa em contraste. O dourado daria
     3,1:1 — reprovado para texto pequeno. */
  color: var(--text-primary);
  opacity: 0.92;
}

.hero__title {
  font-family: var(--font-pixel);
  font-size: var(--fs-hero);
  line-height: 1.2;
  color: var(--text-primary);
  letter-spacing: 1px;
  text-shadow: 4px 4px 0 var(--surface);
  margin-block: var(--space-2);
}

/* O dourado aparece só aqui: display grande, onde 3,1:1 é aceitável (WCAG
   trata ≥24px como texto grande) e onde ele é a assinatura da marca. */
.hero__title-accent {
  color: var(--unifil-gold);
}

.hero__subtitle {
  font-family: var(--font-pixel);
  font-size: var(--fs-h3);
  color: var(--text-primary);
  line-height: 1.6;
}

.hero__lede {
  max-width: 46ch;
  margin-inline: auto;
  margin-top: var(--space-3);
  color: var(--text-primary);
  font-size: var(--fs-body);
  opacity: 0.95;
}

.hero__cta {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.hero__cta-hint {
  font-size: var(--fs-body-sm);
  color: var(--text-primary);
  opacity: 0.85;
}

/* O botão do hero fica sobre o laranja, então inverte: fundo escuro para não
   sumir no fundo da própria cor. */
.hero__cta :deep(.btn-pixel) {
  background: var(--surface);
  min-width: 220px;
}

.hero__cta :deep(.btn-pixel:hover) {
  background: var(--bg-deep);
}

@media (min-width: 860px) {
  .hero {
    padding-block: var(--space-6) var(--space-7);
  }

  .hero__inner {
    flex-direction: row;
    text-align: left;
    gap: var(--space-6);
  }

  .hero__ball {
    width: clamp(176px, 20vw, 240px);
  }

  .hero__lede {
    margin-inline: 0;
  }

  .hero__cta {
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__ball {
    animation: none;
  }
}
</style>
