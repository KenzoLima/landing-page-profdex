<script setup>
import { computed } from 'vue'
import { getType, legibleColor } from '@/data/types.js'
import TypeIcon from '@/components/TypeIcon.vue'
import { COLECAO, MEU, RIVAL, T, TIME, TIME_RIVAL, restam } from './roteiro.js'

// A cena "Times às cegas" (PvpPickView.vue do app), em duas fases:
//   1. cada um monta o time sem ver o do outro: os slots enchem, confirma;
//   2. com os dois confirmados, os dois times aparecem (professores e tipos,
//      nunca golpes) e cada um escolhe, também às cegas, quem entra primeiro.
const props = defineProps({
  t: { type: Number, required: true },
})

const ts = T.selecao
const depois = (ms) => props.t >= ms

const noTime = computed(() => TIME.filter((_, i) => depois(ts.escolhe[i])))
const tocando = (ms) => depois(ms) && !depois(ms + 320)
const confirmado = computed(() => depois(ts.confirma))
const preview = computed(() => depois(ts.preview))
const primeiro = computed(() => depois(ts.primeiro))
const segundos = computed(() => restam(props.t, preview.value ? ts.preview : 0))

const status = computed(() => {
  if (primeiro.value) return depois(ts.comecando) ? 'COMEÇANDO…' : 'AGUARDANDO O RIVAL…'
  if (preview.value) return ''
  if (confirmado.value) return 'COMEÇANDO…'
  return ''
})

const corTipo = (tp) => {
  const x = getType(tp)
  return x ? legibleColor(x.color) : 'var(--unifil-gold)'
}
</script>

<template>
  <div class="pick">
    <header class="pick__topo">
      <div>
        <span class="pick__eyebrow">BATALHA CONTRA</span>
        <span class="pick__titulo">{{ RIVAL }}</span>
      </div>
      <div class="pick__acoes">
        <span class="pick__timer">{{ segundos }}s</span>
        <span class="pick__sair">Sair da seleção</span>
      </div>
    </header>

    <!-- ── Fase 1: os slots e a coleção ──────────────────────────────────── -->
    <template v-if="!preview">
      <div class="slots">
        <span
          v-for="(p, i) in TIME"
          :key="p.slug"
          class="slot"
          :class="{ 'slot--cheio': noTime[i], 'slot--proximo': noTime.length === i }"
        >
          <img v-if="noTime[i]" class="slot__rosto" :src="p.spriteFace" alt="" width="44" height="44" draggable="false" />
          <span v-else class="slot__vazio">{{ i + 1 }}</span>
        </span>
        <span
          class="slots__confirmar"
          :class="{
            'slots__confirmar--pronto': noTime.length === 3 && !confirmado,
            'slots__confirmar--off': noTime.length === 0 || confirmado,
            toque: tocando(ts.confirma),
          }"
        >
          {{ confirmado ? 'CONFIRMADO' : `CONFIRMAR (${noTime.length}/3)` }}
        </span>
      </div>

      <div class="pick__main">
        <p class="pick__dica">Monte seu time com até 3 professores. O rival não vê sua escolha até os dois confirmarem.</p>
        <!-- A coleção continua abaixo da dobra, como numa lista que rola. -->
        <div class="grade-wrap">
          <ul class="grade">
            <li v-for="p in COLECAO" :key="p.slug">
              <span class="card" :class="{ toque: ts.escolhe.some((ms, i) => TIME[i] === p && tocando(ms)) }">
                <img class="card__rosto" :src="p.spriteFace" alt="" width="56" height="56" draggable="false" loading="lazy" />
                <span class="card__nome">{{ p.name }}</span>
                <span class="card__tipos">
                  <TypeIcon v-for="tp in p.types" :key="tp" :type="tp" :size="12" :style="{ color: corTipo(tp) }" />
                </span>
              </span>
            </li>
          </ul>
        </div>
        <p v-if="status" class="pick__espera">{{ status }}</p>
        <p v-else-if="depois(ts.rivalPronto)" class="pick__rival">{{ RIVAL }} já escolheu!</p>
      </div>
    </template>

    <!-- ── Fase 2: os dois times e quem entra primeiro ───────────────────── -->
    <div v-else class="pick__main">
      <div class="chamada" :class="{ 'chamada--feita': primeiro }">
        <span class="chamada__titulo">{{ primeiro ? 'PRIMEIRO ESCOLHIDO' : 'SELECIONE O PRIMEIRO' }}</span>
        <span class="chamada__sub">
          {{
            primeiro
              ? 'Pronto. Agora é esperar o rival.'
              : 'Toque no professor do seu time que começa a batalha. O rival escolhe ao mesmo tempo, sem ver o seu.'
          }}
        </span>
      </div>

      <section>
        <span class="time__titulo">SEU TIME</span>
        <ul class="time">
          <li v-for="p in TIME" :key="p.slug">
            <span
              class="lider"
              :class="{
                'lider--escolhivel': !primeiro,
                'lider--escolhido': primeiro && p === MEU,
                'lider--apagado': primeiro && p !== MEU,
                toque: p === MEU && tocando(ts.primeiro),
              }"
            >
              <img class="lider__rosto" :src="p.spriteFace" alt="" width="44" height="44" draggable="false" />
              <span class="lider__nome">{{ p.name }}</span>
              <span class="lider__cta">{{ primeiro && p === MEU ? '1º ✓' : 'ENTRA 1º' }}</span>
            </span>
          </li>
        </ul>
      </section>

      <section class="time--rival">
        <span class="time__titulo">TIME DE {{ RIVAL.toUpperCase() }}</span>
        <ul class="time">
          <li v-for="(p, i) in TIME_RIVAL" :key="p.slug" :style="{ '--i': i }">
            <span class="lider lider--rival">
              <img class="lider__rosto" :src="p.spriteFace" alt="" width="44" height="44" draggable="false" />
              <span class="lider__nome">{{ p.name }}</span>
              <span class="card__tipos">
                <TypeIcon v-for="tp in p.types" :key="tp" :type="tp" :size="12" :style="{ color: corTipo(tp) }" />
              </span>
            </span>
          </li>
        </ul>
      </section>

      <p v-if="status" class="pick__espera">{{ status }}</p>
    </div>
  </div>
</template>

<style scoped>
.pick {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg-deep);
}

/* O cabeçalho da seleção: o mesmo degradê das telas do app. */
.pick__topo {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 34px 16px 14px;
  background: linear-gradient(160deg, var(--surface-border), var(--unifil-orange));
}

.pick__eyebrow {
  display: block;
  margin-bottom: 4px;
  font-family: var(--font-pixel);
  font-size: 7px;
  color: var(--unifil-gold);
}

.pick__titulo {
  display: block;
  font-family: var(--font-pixel);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
  text-shadow: 2px 2px 0 rgb(0 0 0 / 30%);
}

.pick__acoes {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.pick__timer {
  padding: 6px 10px;
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 8px;
  background: rgb(0 0 0 / 30%);
  font-family: var(--font-pixel);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.pick__sair {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 8px;
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 8px;
  background: rgb(0 0 0 / 25%);
  font-size: 11px;
  color: rgb(255 255 255 / 90%);
  white-space: nowrap;
}

/* ── Slots ────────────────────────────────────────────────────────────── */
.slots {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 2px solid var(--surface-border);
  background: rgb(0 0 0 / 35%);
}

.slot {
  position: relative;
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 2px dashed var(--surface-border);
  border-radius: 10px;
  background: rgb(255 255 255 / 4%);
}

.slot--proximo {
  border-color: var(--unifil-gold);
}

.slot--cheio {
  border-style: solid;
  border-color: var(--unifil-gold);
  background: rgb(237 175 104 / 12%);
}

.slot__rosto {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
  object-position: top;
  animation: encaixa 240ms steps(3, end);
}

.slot__vazio {
  font-family: var(--font-pixel);
  font-size: 12px;
  color: var(--text-muted);
}

.slots__confirmar {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-left: auto;
  padding: 0 10px;
  border: 2px solid var(--unifil-gold);
  border-radius: 10px;
  background: var(--unifil-gold);
  font-family: var(--font-pixel);
  font-size: 8px;
  color: #1a1a1a;
  white-space: nowrap;
}

.slots__confirmar--pronto {
  animation: pulso 1.2s ease-in-out infinite;
}

.slots__confirmar--off {
  border-color: var(--surface-border);
  background: transparent;
  color: var(--text-muted);
}

/* ── Coleção ──────────────────────────────────────────────────────────── */
.pick__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 14px 16px;
  overflow: hidden;
}

.pick__dica {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-muted);
}

.grade-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.grade {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  list-style: none;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border: 2px solid var(--surface-border);
  border-radius: 16px;
  background: var(--surface);
}

.card__rosto {
  width: 56px;
  height: 56px;
  border: 2px solid var(--unifil-gold);
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: var(--surface);
}

.card__nome {
  font-family: var(--font-pixel);
  font-size: 8px;
  line-height: 1.5;
  text-align: center;
}

.card__tipos {
  display: flex;
  gap: 3px;
}

.pick__espera {
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--unifil-gold);
  text-align: center;
  animation: entra var(--dur-base) steps(3, end) both;
}

.pick__rival {
  font-size: 13px;
  color: var(--success-text);
  text-align: center;
  animation: entra var(--dur-base) steps(3, end) both;
}

/* ── Fase 2 ───────────────────────────────────────────────────────────── */
.chamada {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 3px solid var(--unifil-gold);
  border-radius: 16px;
  background: rgb(237 175 104 / 10%);
  text-align: center;
  animation: entra var(--dur-base) steps(3, end) both;
}

.chamada__titulo {
  font-family: var(--font-pixel);
  font-size: 12px;
  line-height: 1.4;
  color: var(--unifil-gold);
  text-shadow: 2px 2px 0 rgb(0 0 0 / 40%);
}

.chamada__sub {
  font-size: 12px;
  line-height: 1.4;
}

.chamada--feita {
  border-color: var(--success-text);
  background: var(--success-bg);
}

.chamada--feita .chamada__titulo {
  color: var(--success-text);
}

.time__titulo {
  display: block;
  margin-bottom: 8px;
  font-family: var(--font-pixel);
  font-size: 8px;
  color: var(--unifil-gold);
}

.time--rival .time__titulo {
  color: var(--text-muted);
}

.time {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  list-style: none;
}

.lider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  height: 100%;
  padding: 8px 4px;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  background: rgb(255 255 255 / 4%);
}

.lider__rosto {
  width: 44px;
  height: 44px;
  border: 2px solid var(--unifil-gold);
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: var(--surface);
}

.lider__nome {
  font-family: var(--font-pixel);
  font-size: 7px;
  line-height: 1.5;
  text-align: center;
}

.lider__cta {
  margin-top: auto;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--unifil-gold);
  font-family: var(--font-pixel);
  font-size: 7px;
  color: #1a1a1a;
}

/* Ainda por escolher: a borda dourada pulsando diz "isto é para tocar". */
.lider--escolhivel {
  border-color: var(--unifil-gold);
  animation: pulso 1.2s ease-in-out infinite;
}

.lider--escolhido {
  border-color: var(--success-text);
  background: var(--success-bg);
}

.lider--escolhido .lider__cta {
  background: var(--success-text);
}

.lider--apagado {
  opacity: 0.4;
}

/* O time do rival é informação, não alvo de toque; entra um de cada vez. */
.lider--rival {
  opacity: 0.75;
  animation: revela var(--dur-base) steps(3, end) both;
  animation-delay: calc(var(--i, 0) * 150ms + 150ms);
}

@keyframes pulso {
  50% { box-shadow: 0 0 0 4px rgb(237 175 104 / 25%); }
}

@keyframes encaixa {
  from { transform: scale(1.25); }
}

@keyframes entra {
  from {
    transform: translateY(6px);
    opacity: 0;
  }
}

@keyframes revela {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
}
</style>
