<script setup>
import { computed, ref } from 'vue'
import { appDemo, pvp } from '@/content/copy.js'
import { rankingDe } from '../mock.js'
import AppHeader from '../AppHeader.vue'

// O Ranking do app (RankingView + LeaderboardPodium + LeaderboardRow) com
// jogadores FICTÍCIOS: apelidos genéricos, nenhum nome de aluno.
const t = appDemo.ranking
const aba = ref('elo')
const lista = computed(() => rankingDe(aba.value))
const podio = computed(() => {
  const [a, b, c] = lista.value
  // A ordem visual do pódio é 2 · 1 · 3.
  return [
    { j: b, lugar: 2 },
    { j: a, lugar: 1 },
    { j: c, lugar: 3 },
  ]
})
const resto = computed(() => lista.value.slice(3))
const eu = computed(() => lista.value.find((j) => j.id === 'voce'))

const ICONE_TIER = Object.fromEntries(pvp.tiers.map((x) => [x.name, x.icon]))
const inicial = (nome) => nome.replace(/[^a-z]/gi, '').charAt(0).toUpperCase()
const fmt = new Intl.NumberFormat('pt-BR')
</script>

<template>
  <div class="rank">
    <AppHeader title="RANKING" :subtitle="t.subtitle" />

    <div class="abas" role="tablist" :aria-label="t.tabsLabel">
      <button
        v-for="k in ['elo', 'capturas', 'dex']"
        :key="k"
        type="button"
        role="tab"
        :aria-selected="aba === k"
        class="abas__btn"
        :class="{ 'abas__btn--on': aba === k }"
        @click="aba = k"
      >
        {{ t.tabs[k] }}
      </button>
    </div>

    <!-- Pódio: os degraus crescem a cada troca de aba (a :key refaz a animação). -->
    <ol :key="aba" class="podio" :aria-label="t.podiumLabel">
      <li v-for="{ j, lugar } in podio" :key="lugar" class="degrau" :class="`degrau--${lugar}`">
        <span class="degrau__avatar" aria-hidden="true">{{ inicial(j.name) }}</span>
        <span class="degrau__name">{{ j.name }}</span>
        <span class="degrau__pts">{{ fmt.format(j.value) }} <small>{{ j.unit }}</small></span>
        <span v-if="j.tier" class="degrau__tier">{{ ICONE_TIER[j.tier] }} {{ j.tier }}</span>
        <span class="degrau__bloco" aria-hidden="true">{{ lugar }}</span>
        <span class="sr-only">{{ lugar }}º lugar</span>
      </li>
    </ol>

    <ol class="linhas" :start="4">
      <li v-for="j in resto" :key="j.id" class="linha" :class="{ 'linha--voce': j.id === 'voce' }">
        <span class="linha__pos">{{ j.position }}</span>
        <span class="linha__who">
          <span class="linha__name">{{ j.id === 'voce' ? `${t.you} · ` : '' }}{{ j.name }}</span>
          <span class="linha__detail">
            <template v-if="j.tier">{{ ICONE_TIER[j.tier] }} {{ j.tier }} · </template>{{ j.detail }}
          </span>
        </span>
        <span class="linha__pts">{{ fmt.format(j.value) }} <small>{{ j.unit }}</small></span>
      </li>
    </ol>

    <p v-if="eu" class="me">
      <span class="me__pos">#{{ eu.position }}</span>
      <span class="me__name"><b>{{ t.you }} ·</b> {{ eu.name }}</span>
      <span class="me__pts">{{ fmt.format(eu.value) }} <small>{{ eu.unit }}</small></span>
    </p>
  </div>
</template>

<style scoped>
.rank {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.abas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin: 12px;
  padding: 4px;
  background: var(--bg-deep);
  border: 2px solid var(--surface-border);
}

.abas__btn {
  min-height: 40px;
  font-family: var(--font-pixel);
  font-size: 8px;
  color: var(--text-muted);
}

.abas__btn--on {
  background: var(--unifil-orange);
  color: var(--text-primary);
  box-shadow:
    inset -2px -2px 0 #2b2b2b,
    inset 2px 2px 0 var(--unifil-gold);
}

.abas__btn:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 1px;
}

/* ── Pódio ────────────────────────────────────────────────────────────── */
.podio {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 6px;
  margin: 4px 12px 0;
  border-bottom: 4px solid var(--unifil-orange);
}

.degrau {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
  text-align: center;
}

.degrau__avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid var(--cor);
  background: var(--surface);
  font-family: var(--font-pixel);
  font-size: 16px;
  color: var(--cor);
}

.degrau--1 .degrau__avatar {
  width: 58px;
  height: 58px;
}

.degrau__name {
  max-width: 100%;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.degrau__pts {
  font-family: var(--font-pixel);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
}

.degrau__pts small,
.linha__pts small,
.me__pts small {
  font-size: 6px;
  color: var(--unifil-gold);
}

.degrau__tier {
  font-size: 9px;
  color: var(--text-muted);
}

.degrau__bloco {
  display: grid;
  place-items: center;
  width: 100%;
  height: var(--alto);
  margin-top: 4px;
  background: color-mix(in srgb, var(--cor) 30%, var(--surface));
  box-shadow:
    inset -3px -3px 0 rgb(0 0 0 / 35%),
    inset 3px 3px 0 color-mix(in srgb, var(--cor) 70%, white);
  font-family: var(--font-pixel);
  font-size: 14px;
  color: var(--text-primary);
  transform-origin: bottom;
  animation: cresce 0.6s steps(6, end) both;
}

.degrau--1 { --cor: #ffdf6d; --alto: 68px; }
.degrau--2 { --cor: #c9d3db; --alto: 44px; }
.degrau--3 { --cor: #edaf68; --alto: 30px; }
.degrau--1 .degrau__bloco { animation-delay: 90ms; }
.degrau--3 .degrau__bloco { animation-delay: 180ms; }

@keyframes cresce {
  from {
    transform: scaleY(0);
  }
}

/* ── Linhas ───────────────────────────────────────────────────────────── */
.linhas {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.linha {
  display: grid;
  grid-template-columns: 2.25rem 1fr auto;
  align-items: center;
  gap: 6px;
  min-height: 52px;
  padding: 6px 10px;
  background: var(--surface);
  border: 2px solid var(--surface-border);
  border-radius: 8px;
}

.linha--voce {
  background: color-mix(in srgb, var(--unifil-orange) 18%, var(--surface));
  border-color: var(--unifil-gold);
}

.linha__pos {
  font-family: var(--font-pixel);
  font-size: 10px;
  color: var(--text-muted);
}

.linha__who {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.linha__name {
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linha__detail {
  font-size: 10px;
  color: var(--text-muted);
}

.linha__pts {
  font-family: var(--font-pixel);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* "Você" fixo no rodapé da tela, como no app. */
.me {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding: 10px 12px;
  background: var(--surface);
  border: 4px solid var(--unifil-orange);
  box-shadow: inset 0 0 0 2px var(--unifil-gold);
  font-size: 12px;
}

.me__pos {
  font-family: var(--font-pixel);
  font-size: 10px;
}

.me__name b {
  color: var(--unifil-gold);
}

.me__pts {
  font-family: var(--font-pixel);
  font-size: 9px;
}

@media (prefers-reduced-motion: reduce) {
  .degrau__bloco {
    animation: none;
  }
}
</style>
