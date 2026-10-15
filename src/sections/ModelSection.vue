<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { model3d } from '@/content/copy.js'
import { DEFAULT_MODEL_SLUG, MODEL_ENTRIES } from '@/config/model.js'
import { getType, legibleColor } from '@/data/types.js'
import SectionShell from '@/components/SectionShell.vue'
import PixelButton from '@/components/PixelButton.vue'
import TypeIcon from '@/components/TypeIcon.vue'
import { useLazyModel } from '@/three/useLazyModel.js'
import { prefersReducedMotionNow } from '@/composables/useMotionPreference.js'

// O palco 3D é um `import()` dinâmico: assim `three` + `@tresjs/*` saem do
// bundle inicial e viram um chunk separado, baixado só quando alguém clica.
// Sem isto, ~600 KB de biblioteca 3D entrariam no primeiro carregamento de
// TODO aluno — inclusive os que nunca vão tocar no botão.
const ModelStage = defineAsyncComponent(() => import('@/three/ModelStage.vue'))

// Todos os modelos do elenco, em dois grupos. A regra de "um palco por página"
// não muda com a quantidade: `useLazyModel` guarda uma trava no escopo do
// módulo, e trocar de professor DERRUBA o palco anterior antes de montar o
// próximo — nunca há dois contextos WebGL vivos, que é o que estourou a memória
// na arena.
const escolhido = ref(DEFAULT_MODEL_SLUG)
const atual = computed(() => MODEL_ENTRIES.find((m) => m.slug === escolhido.value) ?? null)

const grupos = computed(() =>
  Object.entries(model3d.groups)
    .map(([key, label]) => ({ key, label, entries: MODEL_ENTRIES.filter((e) => e.group === key) }))
    .filter((g) => g.entries.length > 0),
)

const { status, reason, activate, release, markReady, markError } = useLazyModel({
  modelUrl: () => atual.value?.url ?? null,
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

/**
 * Cor legível do tipo primário — a mesma regra da roda e das badges.
 *
 * Vai em PRIMEIRO PLANO (borda e ícone do botão), então passa pelo `legibleColor`:
 * a paleta canônica dos tipos foi desenhada para preencher área, e a Eng. de
 * Software (`#495057`) sobre o fundo escuro daria 1,7:1.
 */
function corDoTipo(types) {
  const tipo = getType(types?.[0])
  return tipo ? legibleColor(tipo.color) : 'var(--unifil-gold)'
}

/**
 * Cor CANÔNICA do tipo — a placa atrás do rosto.
 *
 * Aqui é o contrário: a cor preenche área, que é exatamente para o que a paleta
 * foi desenhada. Clarear com `legibleColor` deixaria a placa lavada e diferente
 * da do card da Pokédex, que usa a cor crua.
 */
function corPlacaDoTipo(types) {
  return getType(types?.[0])?.color ?? 'var(--surface-border)'
}

// Com movimento reduzido o modelo carrega, mas fica parado: quem pediu menos
// movimento continua podendo ver o 3D — girando por conta própria.
const autoRotate = computed(() => !prefersReducedMotionNow())

function open() {
  progress.value = 0
  activate()
}

/**
 * Troca de professor.
 *
 * Com o palco fechado é só mudar a seleção. Com o palco ABERTO, o modelo velho
 * precisa ser destruído antes de o novo montar — daí o `release()` seguido de
 * `activate()` no tick seguinte: o `v-if` do template desmonta o `ModelStage`
 * entre os dois, e é esse desmonte que dispara o `dispose` das texturas.
 * Reaproveitar o mesmo palco trocando só a URL vazaria o modelo anterior.
 */
async function escolher(slug) {
  if (slug === escolhido.value) return

  const estavaAberto = isOpen.value
  if (estavaAberto) release()
  escolhido.value = slug

  if (estavaAberto) {
    await nextTick()
    open()
  }
}

/** "VER EM 3D" na ficha do simulador: escolhe o professor e rola até aqui. */
function onVer3d(event) {
  if (!MODEL_ENTRIES.some((m) => m.slug === event.detail)) return
  escolher(event.detail)
  sectionEl.value?.scrollIntoView({ block: 'start' })
}

onBeforeUnmount(() => window.removeEventListener('profdex:ver-3d', onVer3d))

onMounted(() => {
  window.addEventListener('profdex:ver-3d', onVer3d)
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
      <!-- Seletor em dois grupos. Cada botão traz o ROSTO do professor (ou o
           ícone do tipo, para quem ainda não tem sprite) com a borda na cor do
           tipo — a mesma chave visual das badges e da roda. No celular cada
           grupo vira uma fileira que rola na horizontal, em vez de empilhar
           duas dezenas de botões antes do palco. -->
      <div v-if="MODEL_ENTRIES.length > 1" class="picker" role="group" :aria-label="model3d.pickerLabel">
        <div v-for="grupo in grupos" :key="grupo.key" class="picker__group">
          <p :id="`picker-${grupo.key}`" class="picker__label">{{ grupo.label }}</p>
          <ul class="picker__list" :aria-labelledby="`picker-${grupo.key}`">
            <li v-for="entry in grupo.entries" :key="entry.slug">
              <button
                type="button"
                class="picker__btn"
                :class="{ 'picker__btn--on': entry.slug === escolhido }"
                :style="{ '--tipo': corDoTipo(entry.types) }"
                :aria-pressed="entry.slug === escolhido"
                @click="escolher(entry.slug)"
              >
                <img draggable="false"
                  v-if="entry.poster"
                  class="picker__face"
                  :src="entry.poster"
                  alt=""
                  width="32"
                  height="32"
                  loading="lazy"
                  decoding="async"
                />
                <TypeIcon v-else-if="entry.types?.length" :type="entry.types[0]" :size="18" />
                <span class="picker__name">{{ entry.name }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Estado inicial: uma IMAGEM (ou o nome, para quem não tem sprite).
           Nunca um canvas vazio esperando. -->
      <div
        v-if="!isOpen && atual"
        class="model__poster"
        :style="{ '--tipo-atual': corPlacaDoTipo(atual.types) }"
      >
        <img draggable="false"
          v-if="atual.poster"
          class="pixelated"
          :src="atual.poster"
          :alt="`Rosto de ${atual.name} em pixel art`"
          width="160"
          height="160"
          loading="lazy"
          decoding="async"
        />
        <p v-else class="model__poster-name">{{ atual.name }}</p>

        <div class="model__actions">
          <PixelButton variant="ghost" @click="open">
            {{ model3d.cta }}
          </PixelButton>
          <p class="model__hint">{{ model3d.ctaHint }}</p>
          <p v-if="refusalMessage" class="model__refusal" role="status">
            {{ refusalMessage }}
          </p>
        </div>
      </div>

      <div v-else-if="atual" class="model__stage">
        <ModelStage
          :key="atual.slug"
          :model-path="atual.url"
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
            <span class="model__bar-fill" :style="{ transform: `scaleX(${progress})` }" />
          </div>
        </div>

        <div class="model__stage-actions">
          <p class="model__hint">{{ model3d.dragHint }}</p>
          <PixelButton variant="ghost" @click="release">{{ model3d.close }}</PixelButton>
        </div>
      </div>

      <!-- Sem nenhum modelo gerado a seção não some: ela vira o que já era no
           estado de recusa — texto, sem botão que não tem o que carregar. -->
      <p v-else class="model__refusal" role="status">{{ model3d.refusals['no-asset'] }}</p>
    </div>
  </SectionShell>
</template>

<style scoped>
.model {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.picker__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.picker__label {
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  line-height: 1.7;
  color: var(--unifil-gold);
}

/* Celular: uma fileira que rola na horizontal, com snap em cada botão e a
   rolagem presa nela (não arrasta a página junto). Desktop: quebra linha. */
.picker__list {
  list-style: none;
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: var(--surface-border) transparent;
  padding-bottom: var(--space-2);
  margin-inline: calc(-1 * var(--space-1));
  padding-inline: var(--space-1);
}

.picker__list > li {
  flex-shrink: 0;
  scroll-snap-align: start;
}

@media (min-width: 720px) {
  .picker__list {
    flex-wrap: wrap;
    overflow-x: visible;
    padding-bottom: 0;
  }
}

.picker__btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
  background: var(--bg-deep);
  border: 2px solid var(--surface-border);
  border-radius: var(--radius);
  color: var(--text-muted);
  cursor: pointer;
  font: inherit;
  touch-action: manipulation;
  transition: border-color var(--dur-fast) var(--ease-pixel);
}

/* Quem não tem rosto (formas especiais) recebe o recuo simétrico. */
.picker__btn:not(:has(.picker__face)) {
  padding-left: var(--space-3);
}

.picker__face {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 2px;
  background: color-mix(in srgb, var(--tipo) 22%, var(--bg-deep));
}

.picker__btn:hover {
  border-color: var(--tipo);
}

.picker__btn:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 2px;
}

/* O selecionado ganha a cor do tipo na borda E no ícone. A borda sozinha some
   para quem não distingue as cores da paleta — o `aria-pressed` cobre o leitor
   de tela, e o peso do nome cobre o olho. */
.picker__btn--on {
  border-color: var(--tipo);
  color: var(--text-primary);
}

.picker__btn svg {
  color: var(--tipo);
  flex-shrink: 0;
}

.picker__name {
  font-family: var(--font-pixel);
  font-size: 10px;
  line-height: 1.6;
  white-space: nowrap;
}

.model__poster-name {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  max-width: 240px;
  padding: var(--space-4);
  border: 3px solid var(--bg-deep);
  border-radius: var(--radius);
  box-shadow: var(--dex-bevel);
  background: color-mix(in srgb, var(--tipo-atual) 22%, var(--bg-deep));
  font-family: var(--font-pixel);
  font-size: var(--fs-h3);
  line-height: 1.6;
  text-align: center;
  color: var(--text-primary);
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
  /* `contain`: o recorte do rosto é transparente em volta, e `cover` cortaria o
     cabelo para preencher o quadrado. */
  object-fit: contain;
  padding: var(--space-4);
  /* Moldura Pokédex cheia: prata biselada, faixa dourada, fio escuro. Esta e o
   * visor do hero são as duas peças grandes da página — só elas levam o
   * dourado em faixa. */
  border: 3px solid var(--bg-deep);
  border-radius: var(--radius);
  box-shadow: var(--dex-bevel);
  /* Placa na cor do tipo do professor selecionado, como nos cards da Pokédex —
     é o que amarra as duas seções na mesma leitura. */
  background: color-mix(in srgb, var(--tipo-atual) 22%, var(--bg-deep));
}

.model__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.model__hint {
  font-family: var(--font-pixel);
  font-size: var(--fs-body-sm);
  line-height: 1.7;
  color: var(--text-muted);
}

.model__refusal {
  font-family: var(--font-pixel);
  font-size: var(--fs-body-sm);
  line-height: 1.7;
  color: var(--unifil-gold);
  padding: var(--space-2) var(--space-3);
  background: color-mix(in srgb, var(--unifil-orange) 14%, var(--bg-deep));
  border-radius: var(--radius);
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

/* `scaleX`, não `width`: anima no compositor, sem recalcular layout a cada
   evento de progresso do download. */
.model__bar-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--unifil-orange);
  transform-origin: left center;
  transition: transform var(--dur-base) var(--ease-pixel);
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
