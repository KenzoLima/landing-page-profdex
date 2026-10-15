<script setup>
import { computed, ref } from 'vue'
import { appDemo } from '@/content/copy.js'
import { CAPTURABLE } from '@/data/professors.js'
import { getType, legibleColor } from '@/data/types.js'
import { asset } from '@/config/asset.js'
import { BOSS, BOSS_MAX_HP, BUFFS, SCENES } from '../raid-script.js'
import AppHeader from '../AppHeader.vue'
import CenaRoteiro from '../CenaRoteiro.vue'
import TypeIcon from '@/components/TypeIcon.vue'

// A raid contra o lendário como apresentação: as cenas na ordem em que podem
// acontecer, uma fala por toque, com a encenação do RoteiroOverlay do app (o
// personagem entra, a roda gira e recua, o chefe se transforma). Os textos
// estão em src/app-demo/raid-script.js.
const t = appDemo.raid

const cena = ref(0)
const fala = ref(0)
const atual = computed(() => SCENES[cena.value])
const palco = computed(() => atual.value.palco)
const ultimaFala = computed(() => fala.value >= atual.value.falas.length - 1)
const ultimaCena = computed(() => cena.value >= SCENES.length - 1)

function avancar() {
  if (!ultimaFala.value) fala.value++
  else if (!ultimaCena.value) irPara(cena.value + 1)
}

function voltar() {
  if (fala.value > 0) fala.value--
  else if (cena.value > 0) irPara(cena.value - 1, true)
}

function irPara(i, noFim = false) {
  cena.value = i
  fala.value = noFim ? SCENES[i].falas.length - 1 : 0
}

// ── O time fictício da raid: três capturados, o primeiro encara o chefe ───
const TIME = ['gustavo', 'renata', 'tiago-ravache'].map((s) => CAPTURABLE.find((p) => p.slug === s))

// ── HUD do chefe ─────────────────────────────────────────────────────────
const hud = computed(() => palco.value.hud ?? null)
const hpPct = computed(() => (hud.value ? Math.max(0, hud.value.hp / BOSS_MAX_HP) : 1))
const corHp = computed(() => (hpPct.value > 0.5 ? '#9ae186' : hpPct.value > 0.2 ? '#ffdf6d' : '#ff6b6b'))
const tipoChefe = computed(() => getType(hud.value?.types?.[0]))
const cor = (id) => {
  const tp = getType(id)
  return tp ? legibleColor(tp.color) : 'var(--unifil-gold)'
}

/** Cor do peso na roda de buffs, a mesma dos nós (RodaDaSorte). */
const corDoPeso = (peso) =>
  peso === 1 ? 'var(--raro, #f5c451)' : peso === 2 ? 'var(--ds-blue-glow)' : 'var(--ds-green-glow)'
</script>

<template>
  <div class="raid">
    <AppHeader :title="t.title" :subtitle="t.subtitle" />

    <ol class="steps" :aria-label="t.stepsLabel">
      <li v-for="(s, i) in SCENES" :key="s.id">
        <button
          type="button"
          class="steps__dot"
          :class="{ 'steps__dot--on': i === cena, 'steps__dot--done': i < cena }"
          :aria-current="i === cena ? 'step' : undefined"
          :aria-label="`${i + 1}. ${s.title}`"
          @click="irPara(i)"
        />
      </li>
    </ol>

    <section class="cena" :aria-label="atual.title">
      <p class="cena__title">{{ atual.title }}</p>

      <!-- ── Palco ─────────────────────────────────────────────────────── -->
      <div
        class="palco"
        :class="{ 'palco--grupo': palco.ator?.sprites?.length > 2 }"
        :style="{ '--fundo': `url(${asset('/app/ginasio.webp')})` }"
      >
        <button v-if="!ultimaCena" type="button" class="palco__pular" @click="irPara(cena + 1)">
          {{ t.skip }}
        </button>

        <!-- HP do chefe, para situar a cena -->
        <div v-if="hud" class="boss-hud">
          <p class="boss-hud__name">
            <TypeIcon v-if="tipoChefe" :type="tipoChefe.id" :size="12" :style="{ color: cor(tipoChefe.id) }" />
            {{ BOSS.name }}
            <span class="boss-hud__stage">E{{ hud.estagio }}</span>
          </p>
          <span class="boss-hud__track"><span :style="{ transform: `scaleX(${hpPct})`, background: corHp }" /></span>
          <p class="boss-hud__meta">
            <span>{{ hud.hp }}/{{ BOSS_MAX_HP }}</span>
            <span v-if="hud.effect" class="boss-hud__effect">{{ hud.effect }}</span>
          </p>
        </div>

        <!-- Status: o lendário em silhueta, como no card da Pokédex -->
        <div v-if="palco.kind === 'status'" class="status">
          <span class="status__bolt" aria-hidden="true">⚡</span>
          <img draggable="false" class="status__silhueta" :src="BOSS.sprite" alt="" width="320" height="320" />
          <p class="status__label">{{ t.window }}</p>
        </div>

        <!-- Time -->
        <ul v-else-if="palco.kind === 'time'" class="time">
          <li v-for="(p, i) in TIME" :key="p.slug" :class="{ 'time--lead': i === 0 }">
            <img draggable="false" :src="p.spriteFace" alt="" width="64" height="64" />
            <span>{{ p.name }}</span>
            <small v-if="i === 0">{{ t.lead }}</small>
          </li>
        </ul>

        <!-- Encenação do app: ator, roda, transformação -->
        <CenaRoteiro
          v-else-if="palco.kind === 'roteiro'"
          :key="atual.id"
          :ator="palco.ator"
          :roda="palco.roda"
        />

        <!-- Vitória -->
        <div v-else-if="palco.kind === 'vitoria'" class="vitoria">
          <img draggable="false" :src="BOSS.stages[2].sprite" :alt="`${BOSS.name} capturado`" width="320" height="320" />
          <p class="vitoria__titulo">{{ t.win }}</p>
        </div>
      </div>

      <!-- ── Caixa de fala (a do RoteiroOverlay) ──────────────────────── -->
      <button type="button" class="fala" @click="avancar">
        <span class="fala__texto" aria-live="polite">{{ atual.falas[fala] }}</span>
        <span class="fala__dica">
          {{ ultimaFala && ultimaCena ? t.end : ultimaFala ? t.nextScene : t.tap }}
        </span>
      </button>

      <!-- Legenda da roda do Ricardo: os números dos nós e o peso de cada um -->
      <ol v-if="palco.roda?.kind === 'buff'" class="buffs" :aria-label="t.buffsLabel">
        <li
          v-for="(b, i) in BUFFS"
          :key="b.name"
          :class="{ 'buffs--on': b.name === palco.buff }"
          :style="{ '--peso': corDoPeso(b.weight) }"
        >
          <span class="buffs__num">{{ i + 1 }}</span>
          <span class="buffs__name">{{ b.name }}</span>
          <span class="buffs__desc">{{ b.desc }}</span>
        </li>
      </ol>
      <p v-if="palco.roda?.kind === 'buff'" class="nota">{{ t.buffNote }}</p>
      <p v-else-if="palco.roda" class="nota">{{ t.wheelNote }}</p>

      <div class="ctrl">
        <button type="button" class="btn-pixel btn-pixel--ghost" :disabled="cena === 0 && fala === 0" @click="voltar">
          ‹ {{ t.back }}
        </button>
        <button v-if="ultimaCena" type="button" class="btn-pixel" @click="irPara(0)">{{ t.restart }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.raid {
  padding-bottom: 16px;
}

/* Pontos das cenas: alvo de 30px, quadradinho de 10px no meio. */
.steps {
  list-style: none;
  display: flex;
  justify-content: center;
  gap: 2px;
  padding: 12px 12px 0;
}

.steps__dot {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
}

.steps__dot::before {
  content: '';
  width: 10px;
  height: 10px;
  border: 2px solid var(--surface-border);
  background: var(--bg-deep);
}

.steps__dot--done::before {
  background: var(--unifil-orange);
  border-color: var(--unifil-orange);
}

.steps__dot--on::before {
  background: var(--unifil-gold);
  border-color: var(--unifil-gold);
}

.steps__dot:focus-visible {
  outline: 2px solid var(--unifil-gold);
}

.cena {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 12px 0;
}

.cena__title {
  font-family: var(--font-pixel);
  font-size: 9px;
  line-height: 1.6;
  color: var(--unifil-gold);
  text-align: center;
}

/* ── Palco: o fundo escuro do RoteiroOverlay ─────────────────────────── */
/* O NDE são quatro personagens lado a lado: o palco cresce para eles caberem
   grandes, em duas fileiras (ver CenaRoteiro, `ator--grupo`). */
.palco.palco--grupo {
  height: 320px;
  height: clamp(250px, calc(100cqh - 300px), 540px);
}

/* O palco é o ginásio da UniFil, o mesmo fundo da arena do app, com um véu
   escuro em degradê: mais denso em cima (HUD e roda) e embaixo (pés dos
   personagens), mais aberto no meio, onde a foto aparece. */
.palco {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  /* A altura acompanha a tela do app (cqh, ver PhoneShell): o que sobra depois
     do cabeçalho, dos pontos e da caixa de fala (~305px). Na moldura da página
     isso dá ~300px; em tela cheia num celular alto, até 470px. */
  height: 300px;
  height: clamp(230px, calc(100cqh - 305px), 470px);
  padding: 10px;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  background:
    linear-gradient(
      to bottom,
      rgb(8 9 11 / 72%) 0%,
      rgb(8 9 11 / 38%) 40%,
      rgb(8 9 11 / 30%) 70%,
      rgb(8 9 11 / 70%) 100%
    ),
    var(--fundo) center 70% / cover no-repeat,
    var(--bg-deep);
  overflow: hidden;
}

.palco__pular {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid #2b2b2b;
  border-radius: 100px;
  font-family: var(--font-pixel);
  font-size: 7px;
  color: var(--text-muted);
  background: rgb(0 0 0 / 50%);
}

.palco__pular:focus-visible {
  outline: 2px solid var(--unifil-gold);
}

.boss-hud {
  position: relative;
  z-index: 2;
  margin-right: 74px;
  padding: 6px 8px;
  background: rgb(18 20 24 / 88%);
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  align-self: stretch;
  order: -1;
}

.boss-hud__name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-pixel);
  font-size: 8px;
  line-height: 1.6;
}

.boss-hud__stage {
  margin-left: auto;
  padding: 0 4px;
  border: 1px solid #ffd166;
  border-radius: 4px;
  font-size: 6px;
  color: #ffd166;
}

.boss-hud__track {
  display: block;
  height: 8px;
  margin-top: 4px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  overflow: hidden;
}

.boss-hud__track span {
  display: block;
  height: 100%;
  transform-origin: left center;
  transition: transform 0.8s var(--ease-pixel);
}

.boss-hud__meta {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-top: 3px;
  font-family: var(--font-pixel);
  font-size: 6px;
  line-height: 1.6;
}

.boss-hud__effect {
  color: #82d16b;
}

.status {
  display: grid;
  place-items: center;
  gap: 10px;
  flex: 1;
  padding-top: 24px;
  text-align: center;
}

.status__silhueta {
  width: 160px;
  height: 160px;
  object-fit: contain;
  filter: brightness(0);
  opacity: 0.9;
}

.status__bolt {
  font-size: 26px;
  color: #ffd166;
  animation: pisca 1.6s steps(2, end) infinite;
}

.status__label {
  padding: 6px 10px;
  border-radius: 99px;
  background: rgb(255 255 255 / 6%);
  font-family: var(--font-pixel);
  font-size: 7px;
  line-height: 1.6;
  color: #ffd166;
}

.time {
  list-style: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.time li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border: 2px solid var(--surface-border);
  border-radius: 10px;
  background: var(--surface);
  font-size: 10px;
  font-weight: 700;
}

.time img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: var(--bg-deep);
}

.time .time--lead {
  border-color: var(--unifil-gold);
  translate: 0 -6px;
}

.time small {
  font-family: var(--font-pixel);
  font-size: 5px;
  color: var(--unifil-gold);
}

.vitoria {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 10px;
}

.vitoria img {
  width: 170px;
  height: 170px;
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(0 0 14px #ffd166);
}

.vitoria__titulo {
  font-family: var(--font-pixel);
  font-size: 10px;
  line-height: 1.6;
  color: #ffd166;
}

/* ── Legenda da roda de buffs ─────────────────────────────────────────── */
.buffs {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.buffs li {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 0 8px;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background: var(--surface);
}

.buffs__num {
  grid-row: span 2;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--peso);
  color: var(--peso);
  font-family: var(--font-pixel);
  font-size: 7px;
}

.buffs__name {
  font-size: 11px;
  font-weight: 700;
}

.buffs__desc {
  font-size: 10px;
  color: var(--text-muted);
}

.buffs--on {
  border-color: var(--peso) !important;
  background: color-mix(in srgb, var(--peso) 14%, var(--surface)) !important;
}

.nota {
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-muted);
}

/* ── Caixa de fala: valores do RoteiroOverlay do app ──────────────────── */
.fala {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 76px;
  padding: 14px 12px;
  border: 2px solid var(--unifil-gold);
  border-radius: 8px;
  background: #1a1a1a;
  box-shadow: 4px 4px 0 rgb(0 0 0 / 45%);
  color: var(--text-primary);
  text-align: left;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  animation: falaEntra 300ms var(--ease-out);
}

.fala:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 2px;
}

.fala__texto {
  font-family: var(--font-pixel);
  font-size: 9px;
  line-height: 1.7;
}

.fala__dica {
  margin-top: auto;
  align-self: flex-end;
  font-family: var(--font-pixel);
  font-size: 6px;
  color: var(--unifil-gold);
  animation: pisca 1.4s steps(2, end) infinite;
}

.ctrl {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.ctrl .btn-pixel {
  min-height: 44px;
  padding-inline: 12px;
  font-size: 8px;
}

.ctrl .btn-pixel:disabled {
  opacity: 0.4;
}

@keyframes pisca {
  50% {
    opacity: 0.35;
  }
}

@keyframes falaEntra {
  from {
    transform: translateY(10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .status__bolt,
  .fala,
  .fala__dica {
    animation: none;
  }
}
</style>
