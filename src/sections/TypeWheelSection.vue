<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { TYPE_CYCLE, legibleColor, onColor, strongAgainst, weakAgainst } from '@/data/types.js'
import { typeWheel } from '@/content/copy.js'
import SectionShell from '@/components/SectionShell.vue'
import TypeIcon from '@/components/TypeIcon.vue'
import { prefersReducedMotionNow } from '@/composables/useMotionPreference.js'

// A roda inteira é DERIVADA do TYPE_CYCLE: os setores saem da ordem do array e
// as setas saem de strongAgainst(). Nada de coordenada ou vantagem digitada à
// mão — mudar a ordem do array no app muda o desenho aqui, que é exatamente o
// contrato do sistema de tipos ("a ordem do array É a roda").

const N = TYPE_CYCLE.length
const STEP = 360 / N
const GAP = 2 // graus de respiro entre setores
const R_OUTER = 190
const R_INNER = 118
const R_ICON = 154 // meio do anel
const CENTER = 200

const selectedId = ref(TYPE_CYCLE[0].id)
const selected = computed(() => TYPE_CYCLE.find((t) => t.id === selectedId.value))

/** Centro angular do tipo `i`, com o primeiro no topo. */
const centerAngle = (i) => -90 + i * STEP

const polar = (angleDeg, radius) => {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

const sectors = computed(() =>
  TYPE_CYCLE.map((type, i) => {
    const start = centerAngle(i) - STEP / 2 + GAP / 2
    const end = centerAngle(i) + STEP / 2 - GAP / 2
    const o1 = polar(start, R_OUTER)
    const o2 = polar(end, R_OUTER)
    const i1 = polar(end, R_INNER)
    const i2 = polar(start, R_INNER)
    const icon = polar(centerAngle(i), R_ICON)

    return {
      ...type,
      iconPos: { x: icon.x, y: icon.y },
      iconColor: onColor(type.color),
      d: [
        'M ' + o1.x.toFixed(2) + ' ' + o1.y.toFixed(2),
        'A ' + R_OUTER + ' ' + R_OUTER + ' 0 0 1 ' + o2.x.toFixed(2) + ' ' + o2.y.toFixed(2),
        'L ' + i1.x.toFixed(2) + ' ' + i1.y.toFixed(2),
        'A ' + R_INNER + ' ' + R_INNER + ' 0 0 0 ' + i2.x.toFixed(2) + ' ' + i2.y.toFixed(2),
        'Z',
      ].join(' '),
    }
  }),
)

const strongList = computed(() => strongAgainst(selectedId.value))
const weakList = computed(() => weakAgainst(selectedId.value))

/** Setas do tipo selecionado até os dois que ele bate. */
const arrows = computed(() => {
  const from = TYPE_CYCLE.findIndex((t) => t.id === selectedId.value)
  return strongList.value.map((target) => {
    const to = TYPE_CYCLE.findIndex((t) => t.id === target.id)
    const a = polar(centerAngle(from), R_INNER - 8)
    const b = polar(centerAngle(to), R_INNER - 8)
    // Curva puxada para o centro: duas setas retas se sobreporiam.
    return {
      id: target.id,
      d:
        'M ' +
        a.x.toFixed(2) +
        ' ' +
        a.y.toFixed(2) +
        ' Q ' +
        CENTER +
        ' ' +
        CENTER +
        ' ' +
        b.x.toFixed(2) +
        ' ' +
        b.y.toFixed(2),
    }
  })
})

const isDimmed = (id) => id !== selectedId.value && !strongList.value.some((t) => t.id === id)

const iconTransform = (s) => 'translate(' + (s.iconPos.x - 14) + ', ' + (s.iconPos.y - 14) + ')'

// ── Rotação por scroll (GSAP), só onde ela não atrapalha ────────────────────
//
// O GSAP só é baixado se: a tela for grande o bastante para a roda ficar
// confortável, o usuário não tiver pedido menos movimento, e houver interação
// com a seção. No celular — o caso real do público — nada disso é baixado, e a
// roda fica parada e legível.

const wheelEl = ref(null)
const gsapCtx = shallowRef(null)

async function enableScrollSpin() {
  if (gsapCtx.value || !wheelEl.value) return
  if (prefersReducedMotionNow()) return
  if (!window.matchMedia('(min-width: 860px)').matches) return

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ])
  gsap.registerPlugin(ScrollTrigger)

  gsapCtx.value = gsap.context(() => {
    gsap.to(wheelEl.value, {
      rotation: STEP, // exatamente um passo: a roda "avança um tipo"
      ease: 'none',
      scrollTrigger: { trigger: wheelEl.value, start: 'top bottom', end: 'bottom top', scrub: 1 },
    })
  })
}

onBeforeUnmount(() => {
  gsapCtx.value?.revert()
  gsapCtx.value = null
})
</script>

<template>
  <SectionShell :kicker="typeWheel.kicker" :title="typeWheel.title">
    <template #lede>{{ typeWheel.desc }}</template>

    <div class="wheel-layout">
      <!-- A SVG é decorativa: TODA a informação dela existe em HTML abaixo (os
           botões, o painel do tipo e a tabela para leitor de tela). Isso evita a
           ginástica de tornar setores de SVG focáveis, que quebra em navegador
           antigo e rende uma ordem de foco confusa. -->
      <div class="wheel" @pointerenter="enableScrollSpin">
        <svg
          ref="wheelEl"
          class="wheel__svg"
          viewBox="0 0 400 400"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <marker
              id="wheel-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10z" fill="#edaf68" />
            </marker>
          </defs>

          <path
            v-for="s in sectors"
            :key="s.id"
            :d="s.d"
            :fill="s.color"
            :class="['wheel__sector', { 'wheel__sector--dim': isDimmed(s.id) }]"
            @click="selectedId = s.id"
          />

          <g
            v-for="s in sectors"
            :key="'icon-' + s.id"
            :transform="iconTransform(s)"
            :style="{ color: s.iconColor }"
            :class="{ 'wheel__icon--dim': isDimmed(s.id) }"
          >
            <TypeIcon :type="s.id" :size="28" />
          </g>

          <path
            v-for="a in arrows"
            :key="'arrow-' + a.id"
            :d="a.d"
            class="wheel__arrow"
            fill="none"
            marker-end="url(#wheel-arrow)"
          />

          <circle :cx="CENTER" :cy="CENTER" r="70" class="wheel__hub" />
        </svg>
      </div>

      <div class="wheel-panel">
        <p class="wheel-panel__hint">{{ typeWheel.hint }}</p>

        <ul class="wheel-panel__chips">
          <li v-for="t in TYPE_CYCLE" :key="t.id">
            <button
              type="button"
              class="chip"
              :class="{ 'chip--on': t.id === selectedId }"
              :style="{
                '--chip': legibleColor(t.color),
                '--chip-fill': t.color,
                '--chip-on': onColor(t.color),
              }"
              :aria-pressed="t.id === selectedId"
              @click="selectedId = t.id"
              @focus="enableScrollSpin"
            >
              <TypeIcon :type="t.id" :size="14" />
              {{ t.label }}
            </button>
          </li>
        </ul>

        <div v-if="selected" class="wheel-panel__detail gba-frame gba-frame--deep">
          <h3 class="wheel-panel__name" :style="{ color: legibleColor(selected.color) }">
            {{ selected.label }}
          </h3>
          <p class="wheel-panel__desc">{{ selected.description }}</p>

          <dl class="wheel-panel__matchups">
            <div>
              <dt class="wheel-panel__term wheel-panel__term--strong">
                {{ typeWheel.legendStrong }} <span aria-hidden="true">2×</span>
              </dt>
              <dd>{{ strongList.map((t) => t.label).join(' · ') }}</dd>
            </div>
            <div>
              <dt class="wheel-panel__term wheel-panel__term--weak">
                {{ typeWheel.legendWeak }} <span aria-hidden="true">0,5×</span>
              </dt>
              <dd>{{ weakList.map((t) => t.label).join(' · ') }}</dd>
            </div>
          </dl>
        </div>

        <p class="wheel-panel__note">{{ typeWheel.note }}</p>
      </div>
    </div>

    <!-- Equivalente textual completo: quem usa leitor de tela recebe a roda
         inteira de uma vez, sem precisar clicar tipo por tipo. -->
    <table class="sr-only">
      <caption>
        Vantagens de cada tipo na roda do ProfDex
      </caption>
      <thead>
        <tr>
          <th scope="col">Tipo</th>
          <th scope="col">Forte contra (2×)</th>
          <th scope="col">Fraco contra (0,5×)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in TYPE_CYCLE" :key="t.id">
          <th scope="row">{{ t.label }}</th>
          <td>
            {{
              strongAgainst(t.id)
                .map((x) => x.label)
                .join(', ')
            }}
          </td>
          <td>
            {{
              weakAgainst(t.id)
                .map((x) => x.label)
                .join(', ')
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </SectionShell>
</template>

<style scoped>
.wheel-layout {
  display: grid;
  gap: var(--space-5);
  align-items: center;
}

@media (min-width: 860px) {
  .wheel-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-6);
  }
}

.wheel {
  max-width: 460px;
  width: 100%;
  margin-inline: auto;
}

.wheel__svg {
  width: 100%;
  height: auto;
  display: block;
  /* A rotação por scroll precisa girar em torno do eixo da roda, não do canto
     do SVG. */
  transform-origin: 50% 50%;
}

.wheel__sector {
  cursor: pointer;
  transition: opacity var(--dur-base) var(--ease-out);
}

/* A 0,28 os seis setores não destacados viravam manchas escuras e a roda
   deixava de parecer uma roda de nove cores — que é o que ela precisa
   comunicar antes de qualquer interação. 0,55 destaca sem apagar. */
.wheel__sector--dim,
.wheel__icon--dim {
  opacity: 0.55;
}

.wheel__icon--dim {
  transition: opacity var(--dur-base) var(--ease-out);
}

.wheel__arrow {
  stroke: var(--unifil-gold);
  stroke-width: 3;
  stroke-linecap: square;
}

.wheel__hub {
  fill: var(--bg-deep);
  stroke: var(--surface-border);
  stroke-width: 2;
}

.wheel-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.wheel-panel__hint {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
}

.wheel-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  /* 40px de altura mínima: alvo de toque confortável no celular. */
  min-height: 40px;
  padding: 6px 10px;
  border: 2px solid var(--chip);
  border-radius: var(--radius);
  background: transparent;
  color: var(--chip);
  font-family: var(--font-pixel);
  font-size: 9px;
  line-height: 1.4;
  transition: background var(--dur-fast) ease;
}

.chip:hover {
  background: color-mix(in srgb, var(--chip) 18%, transparent);
}

.chip--on {
  /* Selecionado é preenchido: aí vale a cor canônica, com o texto
     resolvido por luminância. */
  background: var(--chip-fill);
  border-color: var(--chip-fill);
  color: var(--chip-on);
}

.wheel-panel__detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.wheel-panel__name {
  font-family: var(--font-pixel);
  font-size: var(--fs-h3);
  line-height: 1.6;
}

.wheel-panel__desc {
  color: var(--text-muted);
  font-size: var(--fs-body-sm);
}

.wheel-panel__matchups {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

@media (min-width: 520px) {
  .wheel-panel__matchups {
    grid-template-columns: repeat(2, 1fr);
  }
}

.wheel-panel__term {
  font-family: var(--font-pixel);
  font-size: 9px;
  line-height: 1.6;
  margin-bottom: var(--space-1);
}

.wheel-panel__term--strong {
  color: var(--success-text);
}

.wheel-panel__term--weak {
  color: var(--error);
}

.wheel-panel__matchups dd {
  font-size: var(--fs-body-sm);
  color: var(--text-primary);
}

.wheel-panel__note {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
  border-left: 3px solid var(--unifil-orange);
  padding-left: var(--space-3);
}

@media (prefers-reduced-motion: reduce) {
  .wheel__sector,
  .wheel__icon--dim,
  .chip {
    transition: none;
  }
}
</style>
