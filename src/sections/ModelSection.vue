<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { model3d } from '@/content/copy.js'
import { MODEL_URL } from '@/config/model.js'
import { CAPTURABLE } from '@/data/professors.js'
import SectionShell from '@/components/SectionShell.vue'
import PixelButton from '@/components/PixelButton.vue'
import { MODEL_SIZE_MB, useLazyModel } from '@/three/useLazyModel.js'
import { prefersReducedMotionNow } from '@/composables/useMotionPreference.js'

// O palco 3D é um `import()` dinâmico: assim `three` + `@tresjs/*` saem do
// bundle inicial e viram um chunk separado, baixado só quando alguém clica.
// Sem isto, ~600 KB de biblioteca 3D entrariam no primeiro carregamento de
// TODO aluno — inclusive os que nunca vão tocar no botão.
const ModelStage = defineAsyncComponent(() => import('@/three/ModelStage.vue'))

const poster = CAPTURABLE.find((p) => p.slug === 'mario')

// Vírgula decimal: a página é em português e este número aparece para o aluno.
const tamanhoFormatado = MODEL_SIZE_MB.toLocaleString('pt-BR')

const { status, reason, activate, release, markReady, markError } = useLazyModel({
  modelUrl: MODEL_URL,
})

const progress = ref(0)
const sectionEl = ref(null)
let observer = null

const isOpen = computed(() => status.value === 'loading' || status.value === 'ready')
const refusalMessage = computed(() =>
  status.value === 'refused' || status.value === 'error'
    ? (model3d.refusals[reason.value] ?? model3d.refusals.error)
    : '',
)

// Com movimento reduzido o modelo carrega, mas fica parado: quem pediu menos
// movimento continua podendo ver o 3D — girando por conta própria.
const autoRotate = computed(() => !prefersReducedMotionNow())

function open() {
  progress.value = 0
  activate()
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !sectionEl.value) return

  // Rolou para longe com o 3D aberto? Desmonta. O contexto WebGL e a geometria
  // não têm por que sobreviver fora da tela — foi exatamente esse tipo de
  // memória esquecida que derrubou a aba na arena (BUG-BATALHA-TRAVANDO.md).
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting && isOpen.value) release()
    },
    { threshold: 0 },
  )
  observer.observe(sectionEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

// Reabrir depois de fechar precisa recomeçar do zero.
watch(status, (value) => {
  if (value === 'idle') progress.value = 0
})
</script>

<template>
  <SectionShell :kicker="model3d.kicker" :title="model3d.title">
    <template #lede>{{ model3d.desc }}</template>

    <div ref="sectionEl" class="model gba-frame">
      <!-- Estado inicial: uma IMAGEM. Nunca um canvas vazio esperando. -->
      <div v-if="!isOpen" class="model__poster">
        <picture>
          <source :srcset="poster.image" type="image/webp" />
          <img
            :src="poster.fallback"
            :alt="`Arte do professor ${poster.name}`"
            width="512"
            height="512"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div class="model__actions">
          <PixelButton v-if="MODEL_URL" variant="ghost" @click="open">
            {{ model3d.cta }}
          </PixelButton>
          <p class="model__hint">
            {{ model3d.ctaHint }}
            <span v-if="MODEL_URL"> Cerca de {{ tamanhoFormatado }} MB.</span>
          </p>
          <p v-if="refusalMessage" class="model__refusal" role="status">
            {{ refusalMessage }}
          </p>
        </div>
      </div>

      <div v-else class="model__stage">
        <ModelStage
          :model-path="MODEL_URL"
          :auto-rotate="autoRotate"
          @ready="markReady"
          @error="markError"
          @progress="(p) => (progress = p)"
        />

        <div v-if="status === 'loading'" class="model__loading">
          <p class="model__loading-label">
            {{ model3d.loading }}
            <span v-if="progress > 0">{{ Math.round(progress * 100) }}%</span>
          </p>
          <div class="model__bar">
            <span class="model__bar-fill" :style="{ width: `${Math.round(progress * 100)}%` }" />
          </div>
        </div>

        <div class="model__stage-actions">
          <p class="model__hint">{{ model3d.dragHint }}</p>
          <PixelButton variant="ghost" @click="release">{{ model3d.close }}</PixelButton>
        </div>
      </div>
    </div>
  </SectionShell>
</template>

<style scoped>
.model {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.model__poster {
  display: grid;
  gap: var(--space-4);
  align-items: center;
}

@media (min-width: 720px) {
  .model__poster {
    grid-template-columns: minmax(0, 240px) minmax(0, 1fr);
  }
}

.model__poster img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 3px solid var(--surface-border);
  border-radius: var(--radius);
}

.model__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.model__hint {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
}

.model__refusal {
  font-size: var(--fs-body-sm);
  color: var(--unifil-gold);
  border-left: 3px solid var(--unifil-orange);
  padding-left: var(--space-3);
}

.model__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.model__loading {
  position: absolute;
  inset-inline: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding-inline: var(--space-4);
  pointer-events: none;
}

.model__loading-label {
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  color: var(--unifil-gold);
  line-height: 1.6;
}

.model__bar {
  width: min(100%, 260px);
  height: 12px;
  background: var(--bg-deep);
  border: 2px solid var(--surface-border);
  border-radius: 2px;
  overflow: hidden;
}

.model__bar-fill {
  display: block;
  height: 100%;
  background: var(--unifil-orange);
  transition: width var(--dur-base) var(--ease-pixel);
}

.model__stage-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

@media (prefers-reduced-motion: reduce) {
  .model__bar-fill {
    transition: none;
  }
}
</style>
