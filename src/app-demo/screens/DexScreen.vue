<script setup>
import { computed, ref } from 'vue'
import { appDemo } from '@/content/copy.js'
import { CAPTURABLE, LEGENDARY, RARES } from '@/data/professors.js'
import { getType, legibleColor } from '@/data/types.js'
import { movesForTypes } from '../engine/moves.js'
import { DEFAULT_MAX_HP } from '../engine/battle-constants.js'
import { ivBonus } from '../engine/battleEngine.js'
import { DEX_TOTAL, IVS, TRAINER } from '../mock.js'
import MoveCard from '../MoveCard.vue'
import TypeIcon from '@/components/TypeIcon.vue'

// A coleção do app (ProfdexView + ProfCard) e a ficha (ProfessorView), com a
// Pokédex COMPLETA do treinador fictício: os 16 regulares e os 6 raros. O
// lendário fica em silhueta, e o card dele leva à aba Raid.
const emit = defineEmits(['navigate', 'ver-3d'])
const t = appDemo.dex

const num = (i) => `#${String(i + 1).padStart(3, '0')}`
const corTipo = (tp) => {
  const x = getType(tp)
  return x ? legibleColor(x.color) : 'var(--unifil-gold)'
}

// ── Ficha ────────────────────────────────────────────────────────────────
const aberto = ref(null)
const aba = ref('sobre')
const raroAberto = computed(() => RARES.some((r) => r.slug === aberto.value?.slug))

function abrir(prof) {
  aberto.value = prof
  aba.value = 'sobre'
}

/** PV 120 e ATQ/DEF/VEL 100 de base, mais o bônus do IV (até +5), como no app. */
const atributos = computed(() => {
  if (!aberto.value) return []
  const iv = IVS[aberto.value.slug]
  const fmt = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return [
    { label: 'PV', iv: iv.ivHp, value: fmt(DEFAULT_MAX_HP + ivBonus(iv.ivHp)), cor: '#9ae186' },
    { label: 'Ataque', iv: iv.ivRigor, value: fmt(100 + ivBonus(iv.ivRigor)), cor: '#ff6b6b' },
    { label: 'Defesa', iv: iv.ivDidatica, value: fmt(100 + ivBonus(iv.ivDidatica)), cor: '#7ec5e6' },
    { label: 'Velocidade', iv: iv.ivRaciocinio, value: fmt(100 + ivBonus(iv.ivRaciocinio)), cor: '#ffdf6d' },
  ]
})

const golpes = computed(() => (aberto.value ? movesForTypes(aberto.value.types) : []))

const numeroDaFicha = computed(() => {
  if (raroAberto.value) return '✦'
  return num(CAPTURABLE.findIndex((p) => p.slug === aberto.value?.slug))
})

/**
 * "VER EM 3D": pede à casca do celular (PhoneShell) para levar à seção 3D da
 * landing com o professor já escolhido. Quem leva é a casca porque, em tela
 * cheia, ela precisa sair desse modo antes de a página rolar.
 */
function verEm3d() {
  emit('ver-3d', aberto.value.slug)
}
</script>

<template>
  <div class="dex">
    <!-- ── Ficha do professor ──────────────────────────────────────────── -->
    <section v-if="aberto" class="ficha" :aria-label="`${t.sheetLabel} ${aberto.name}`">
      <button type="button" class="ficha__back" @click="aberto = null">‹ {{ t.back }}</button>
      <div class="ficha__id">
        <img draggable="false"
          :src="aberto.spriteFace"
          alt=""
          width="64"
          height="64"
          :class="{ 'ficha__face--rare': raroAberto }"
        />
        <div>
          <p class="ficha__num" :class="{ 'ficha__num--rare': raroAberto }">{{ numeroDaFicha }}</p>
          <h4 class="ficha__name">{{ aberto.name }}</h4>
          <p class="ficha__types">
            <span v-for="tp in aberto.types" :key="tp" class="ficha__type" :style="{ '--cor': corTipo(tp) }">
              <TypeIcon :type="tp" :size="10" /> {{ getType(tp)?.label }}
            </span>
          </p>
        </div>
      </div>

      <div class="ficha__tabs" role="tablist" :aria-label="t.sheetTabsLabel">
        <button
          v-for="k in ['sobre', 'golpes']"
          :key="k"
          type="button"
          role="tab"
          :aria-selected="aba === k"
          class="ficha__tab"
          :class="{ 'ficha__tab--on': aba === k }"
          @click="aba = k"
        >
          {{ t.tabs[k] }}
        </button>
      </div>

      <div v-if="aba === 'sobre'" class="ficha__panel">
        <p class="ficha__label">{{ t.statsTitle }}</p>
        <dl class="stats">
          <div v-for="s in atributos" :key="s.label" class="stats__row">
            <dt>{{ s.label }}</dt>
            <dd class="stats__bar" aria-hidden="true">
              <span :style="{ transform: `scaleX(${s.iv / 15})`, background: s.cor }" />
            </dd>
            <dd class="stats__val">{{ s.value }}</dd>
          </div>
        </dl>
        <img draggable="false" class="ficha__sprite" :src="aberto.sprite" :alt="`Boneco de ${aberto.name}`" width="320" height="320" />
        <button type="button" class="btn-pixel btn-pixel--block" @click="verEm3d">{{ t.view3d }}</button>
      </div>

      <div v-else class="ficha__panel">
        <p class="ficha__label">{{ t.movesTitle }}</p>
        <div class="moves">
          <MoveCard v-for="m in golpes" :key="m.id" :move="m" />
        </div>
      </div>
    </section>

    <!-- ── Coleção ───────────────────────────────────────────────────────── -->
    <template v-else>
      <header class="dex-head">
        <div class="dex-head__row">
          <h3 class="dex-head__title">PROF<span>DEX</span></h3>
          <span class="dex-head__pill">
            <span class="dex-head__initial" aria-hidden="true">{{ TRAINER.charAt(0) }}</span>
            <span>
              <small>{{ t.trainer }}</small>
              <b>{{ TRAINER }}</b>
            </span>
          </span>
        </div>
        <p class="dex-head__count">
          {{ CAPTURABLE.length + RARES.length }}<span>/{{ DEX_TOTAL }}</span> {{ t.captured }}
        </p>
        <span class="dex-head__track" aria-hidden="true"><span /></span>
      </header>

      <ul class="grid">
        <li v-for="(prof, i) in CAPTURABLE" :key="prof.slug">
          <button type="button" class="pcard" @click="abrir(prof)">
            <span class="pcard__num">{{ num(i) }}</span>
            <span class="pcard__avatar">
              <img draggable="false" :src="prof.spriteFace" alt="" width="64" height="64" loading="lazy" />
              <span class="pcard__check" aria-hidden="true">✓</span>
            </span>
            <span class="pcard__name">{{ prof.name }}</span>
            <span class="pcard__state">{{ t.captureState }}</span>
          </button>
        </li>

        <!-- O lendário fecha a grade, como no app. -->
        <li>
          <div class="legend">
            <span class="legend__frame" aria-hidden="true"><span>⚡</span></span>
            <span class="legend__name">???</span>
            <button type="button" class="legend__btn" @click="emit('navigate', 'raid')">{{ t.legendaryCta }}</button>
            <span class="sr-only">{{ t.legendaryHint }}</span>
          </div>
        </li>
      </ul>

      <section class="rares" :aria-label="t.rares">
        <p class="rares__head">
          <span>✦ {{ t.rares }}</span>
          <span class="rares__count">{{ RARES.length }}<span>/{{ RARES.length }}</span></span>
        </p>
        <ul class="grid">
          <li v-for="r in RARES" :key="r.slug">
            <button type="button" class="pcard pcard--rare" @click="abrir(r)">
              <span class="pcard__num">✦</span>
              <span class="pcard__avatar">
                <img draggable="false" :src="r.spriteFace" alt="" width="64" height="64" loading="lazy" />
                <span class="pcard__check" aria-hidden="true">✓</span>
              </span>
              <span class="pcard__name">{{ r.name }}</span>
              <span class="pcard__state">{{ t.captureState }}</span>
            </button>
          </li>
        </ul>
      </section>

      <p class="dex__hint">{{ t.legendaryHint }}</p>
    </template>
  </div>
</template>

<style scoped>
.dex {
  padding-bottom: 20px;
}

/* ── Cabeçalho do ProfdexView: degradê, "lábio" arredondado e a pílula ─── */
.dex-head {
  position: relative;
  padding: 40px 18px 28px;
  background: linear-gradient(160deg, #2b2b2b 0%, var(--unifil-orange) 100%);
}

.dex-head::after {
  content: '';
  position: absolute;
  inset: auto 0 -1px;
  height: 20px;
  background: var(--bg-deep);
  border-radius: 20px 20px 0 0;
}

.dex-head__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.dex-head__title {
  font-family: var(--font-pixel);
  font-size: 20px;
  line-height: 1.2;
  color: var(--text-primary);
}

.dex-head__title span {
  color: var(--unifil-gold);
}

.dex-head__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  background: rgb(0 0 0 / 25%);
}

.dex-head__initial {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--unifil-gold);
  color: var(--bg-deep);
  font-family: var(--font-pixel);
  font-size: 11px;
}

.dex-head__pill small {
  display: block;
  font-family: var(--font-pixel);
  font-size: 6px;
  color: var(--unifil-gold);
}

.dex-head__pill b {
  font-size: 13px;
}

.dex-head__count {
  margin-top: 14px;
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--text-primary);
}

.dex-head__count span {
  opacity: 0.5;
}

.dex-head__track {
  display: block;
  height: 6px;
  margin-top: 6px;
  border-radius: 3px;
  background: rgb(0 0 0 / 30%);
  overflow: hidden;
}

.dex-head__track span {
  display: block;
  height: 100%;
  background: var(--unifil-gold);
}

/* ── Grade e ProfCard ─────────────────────────────────────────────────── */
.grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
  padding: 8px 14px 0;
}

.pcard {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 150px;
  padding: 14px 10px;
  background: var(--surface);
  border: 2px solid #82d16b;
  border-radius: 16px;
  color: var(--text-primary);
  font: inherit;
  text-align: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: translate var(--dur-fast) steps(2, end);
}

.pcard:hover {
  translate: 0 -2px;
}

.pcard:active {
  scale: 0.97;
}

.pcard:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 2px;
}

.pcard--rare {
  border-color: var(--raro, #f5c451);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--raro, #f5c451) 35%, transparent);
}

.pcard__num {
  position: absolute;
  top: 8px;
  left: 10px;
  font-family: var(--font-pixel);
  font-size: 7px;
  color: var(--unifil-gold);
}

.pcard--rare .pcard__num {
  font-family: inherit;
  font-size: 11px;
  color: var(--raro, #f5c451);
}

.pcard__avatar {
  position: relative;
  margin-top: 8px;
  width: 64px;
  height: 64px;
}

.pcard__avatar img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid var(--unifil-gold);
  object-fit: cover;
  object-position: top;
  background: var(--bg-deep);
}

.pcard__check {
  position: absolute;
  right: -4px;
  bottom: -2px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #234a18;
  color: #82d16b;
  font-size: 12px;
  font-weight: 700;
}

.pcard__name {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
}

.pcard__state {
  font-family: var(--font-pixel);
  font-size: 7px;
  color: #82d16b;
}

/* ── Lendário: borda gradiente animada, ⚡ pulsando ──────────────────── */
.legend {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 150px;
  padding: 14px 8px;
  border-radius: 16px;
  background: var(--surface);
}

.legend__frame {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-top: 8px;
  border: 2px solid transparent;
  border-radius: 50%;
  background:
    linear-gradient(var(--bg-deep), var(--bg-deep)) padding-box,
    linear-gradient(120deg, #ffd166, #ef476f, #7b61ff, #06d6a0, #ffd166) border-box;
  background-size: 100%, 300%;
  animation: lendario-borda 4s linear infinite;
}

.legend__frame span {
  font-size: 22px;
  color: #ffd166;
  animation: pulsa 1.6s ease-in-out infinite;
}

.legend__name {
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--text-muted);
}

.legend__btn {
  min-height: 32px;
  padding: 0 8px;
  background: var(--unifil-gold);
  color: var(--bg-deep);
  border-radius: 4px;
  font-family: var(--font-pixel);
  font-size: 7px;
  touch-action: manipulation;
}

.legend__btn:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 2px;
}

@keyframes lendario-borda {
  to {
    background-position: 0 0, 300% 0;
  }
}

@keyframes pulsa {
  50% {
    opacity: 0.55;
    transform: scale(1.15);
  }
}

/* ── Seção de raros ───────────────────────────────────────────────────── */
.rares {
  margin: 28px 0 0;
  padding-top: 20px;
  border-top: 1px solid var(--surface-border);
}

.rares__head {
  display: flex;
  justify-content: space-between;
  padding: 0 14px;
  font-family: var(--font-pixel);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--raro, #f5c451);
}

.rares__count span {
  color: var(--text-muted);
}

.dex__hint {
  padding: 18px 14px 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-muted);
}

/* ── Ficha ────────────────────────────────────────────────────────────── */
.ficha {
  padding: 42px 14px 16px;
}

.ficha__back {
  min-height: 36px;
  padding: 0 4px;
  font-family: var(--font-pixel);
  font-size: 8px;
  color: var(--unifil-gold);
}

.ficha__back:focus-visible {
  outline: 2px solid var(--unifil-gold);
}

.ficha__id {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.ficha__id img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid var(--unifil-gold);
  object-fit: cover;
  object-position: top;
  background: var(--surface);
}

.ficha__id img.ficha__face--rare {
  border-color: var(--raro, #f5c451);
}

.ficha__num {
  font-family: var(--font-pixel);
  font-size: 7px;
  color: var(--text-muted);
}

.ficha__num--rare {
  font-family: inherit;
  font-size: 12px;
  color: var(--raro, #f5c451);
}

.ficha__name {
  font-family: var(--font-pixel);
  font-size: 13px;
  line-height: 1.5;
}

.ficha__types {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.ficha__type {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border: 1px solid var(--cor);
  border-radius: 99px;
  font-size: 10px;
  color: var(--cor);
}

.ficha__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 14px;
  border-bottom: 2px solid var(--surface-border);
}

.ficha__tab {
  min-height: 40px;
  font-family: var(--font-pixel);
  font-size: 7px;
  color: var(--text-muted);
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.ficha__tab--on {
  color: var(--unifil-gold);
  border-bottom-color: var(--unifil-gold);
}

.ficha__tab:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: -2px;
}

.ficha__panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 14px;
}

.ficha__label {
  font-family: var(--font-pixel);
  font-size: 7px;
  color: var(--unifil-gold);
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats__row {
  display: grid;
  grid-template-columns: 72px 1fr 44px;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.stats__row dt {
  color: var(--text-muted);
}

.stats__bar {
  height: 8px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  overflow: hidden;
}

.stats__bar span {
  display: block;
  height: 100%;
  transform-origin: left center;
}

.stats__val {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ficha__sprite {
  width: min(100%, 220px);
  margin-inline: auto;
}

.moves {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .legend__frame,
  .legend__frame span {
    animation: none;
  }

  .pcard {
    transition: none;
  }
}
</style>
