<script setup>
import { computed, onBeforeUnmount, reactive, ref, shallowRef } from 'vue'
import { appDemo } from '@/content/copy.js'
import { CAPTURABLE, RARES } from '@/data/professors.js'
import { getType, legibleColor } from '@/data/types.js'
import { asset } from '@/config/asset.js'
import { buildMoveset } from '../engine/moves.js'
import { useBattle } from '../engine/useBattle.js'
import { efeitosDe } from '../engine/battle-efeitos.js'
import { IVS } from '../mock.js'
import AppHeader from '../AppHeader.vue'
import MoveCard from '../MoveCard.vue'
import TypeIcon from '@/components/TypeIcon.vue'

// O TREINO do app (ArenaView), jogável: o motor é o mesmo do app
// (src/app-demo/engine/), rodando no navegador contra a IA dele. Não vale
// ranking — como no app.
const t = appDemo.battle

const fase = ref('escolha') // 'escolha' | 'luta'
const meu = shallowRef(null)
const rival = shallowRef(null)
const b = shallowRef(null)

// A coleção do treinador fictício é a Pokédex completa: regulares e raros.
const meus = [...CAPTURABLE, ...RARES]

function lutar(prof) {
  const outros = meus.filter((p) => p.slug !== prof.slug)
  const adversario = outros[Math.floor(Math.random() * outros.length)]
  meu.value = prof
  rival.value = adversario
  b.value = reactive(
    useBattle({
      player: { name: prof.name, types: prof.types, moves: buildMoveset(prof.types), ivs: IVS[prof.slug] },
      enemy: {
        name: adversario.name,
        types: adversario.types,
        moves: buildMoveset(adversario.types),
        ivs: IVS[adversario.slug] ?? {},
      },
    }),
  )
  fase.value = 'luta'
  b.value.start()
}

function sair() {
  fase.value = 'escolha'
  b.value = null
}

onBeforeUnmount(sair)

const pct = (hp, max) => Math.max(0, Math.min(1, hp / max))
const corHp = (p) => (p > 0.5 ? '#9ae186' : p > 0.2 ? '#ffdf6d' : '#ff6b6b')

/** O estado cru do motor → o formato que `efeitosDe` (o mesmo do app) lê. */
function lado(c) {
  return {
    statusKind: c.status?.kind,
    statusTurns: c.status?.turns,
    stages: c.stages,
    escudo: c.shields?.[0]?.mode,
  }
}

const hud = computed(() => {
  if (!b.value) return null
  void b.value.tick // depende do tique do motor
  const { player, enemy } = b.value.state
  const pp = pct(b.value.playerHp, player.maxHp)
  const pe = pct(b.value.enemyHp, enemy.maxHp)
  return {
    player: { hp: Math.max(0, b.value.playerHp), max: player.maxHp, pct: pp, cor: corHp(pp), efeitos: efeitosDe(lado(player)) },
    enemy: { hp: Math.max(0, b.value.enemyHp), max: enemy.maxHp, pct: pe, cor: corHp(pe), efeitos: efeitosDe(lado(enemy)) },
    moves: player.moves,
  }
})

const podeAgir = computed(() => b.value?.phase === 'player-turn')
const corTipo = (tp) => {
  const x = getType(tp)
  return x ? legibleColor(x.color) : 'var(--unifil-gold)'
}
</script>

<template>
  <!-- ── Escolha do combatente ────────────────────────────────────────────── -->
  <div v-if="fase === 'escolha'" class="pick">
    <AppHeader :title="t.title" :subtitle="t.subtitle" />
    <p class="pick__lede">{{ t.pickLede }}</p>
    <ul class="pick__grid">
      <li v-for="p in meus" :key="p.slug">
        <button type="button" class="pick__btn" @click="lutar(p)">
          <img draggable="false" :src="p.spriteFace" alt="" width="56" height="56" loading="lazy" />
          <span class="pick__name">{{ p.name }}</span>
          <span class="pick__types">
            <TypeIcon v-for="tp in p.types" :key="tp" :type="tp" :size="12" :style="{ color: corTipo(tp) }" />
          </span>
        </button>
      </li>
    </ul>
  </div>

  <!-- ── Arena ─────────────────────────────────────────────────────────────── -->
  <div v-else-if="b && hud" class="arena" :style="{ '--fundo': `url(${asset('/app/ginasio.webp')})` }">
    <p class="arena__seal">{{ t.seal }}</p>

    <div class="stage" :class="{ 'stage--hit': b.playerHit }">
      <!-- HUD do adversário (em cima) -->
      <div class="hpbar hpbar--enemy">
        <p class="hpbar__name">
          <TypeIcon v-for="tp in rival.types" :key="tp" :type="tp" :size="12" :style="{ color: corTipo(tp) }" />
          Prof. {{ rival.name }}
        </p>
        <div class="hpbar__row">
          <span class="hpbar__label">HP</span>
          <span class="hpbar__track"><span :style="{ transform: `scaleX(${hud.enemy.pct})`, background: hud.enemy.cor }" /></span>
          <span class="hpbar__num">{{ hud.enemy.hp }}/{{ hud.enemy.max }}</span>
        </div>
        <ul v-if="hud.enemy.efeitos.length" class="chips">
          <li v-for="e in hud.enemy.efeitos" :key="e.id" :class="`chip chip--${e.tom}`">{{ e.rotulo }}</li>
        </ul>
      </div>

      <figure class="fighter fighter--enemy" :class="{ 'fighter--hit': b.enemyHit, 'fighter--down': b.enemyFainted }">
        <img draggable="false" :src="rival.sprite" :alt="`Prof. ${rival.name}, o adversário`" width="320" height="320" />
        <span v-for="f in b.enemyFeedback" :key="f.id" class="pop" :class="`pop--${f.kind}`" :style="{ '--dx': `${f.offset}px` }">
          {{ f.amount ? (f.kind === 'cura' ? '+' : '−') + f.amount : '' }}<small v-if="f.label">{{ f.label }}</small>
        </span>
      </figure>

      <figure class="fighter fighter--player" :class="{ 'fighter--hit': b.playerHit, 'fighter--down': b.playerFainted }">
        <img draggable="false" :src="meu.spriteBack" :alt="`Prof. ${meu.name}, o seu, de costas`" width="320" height="320" />
        <span v-for="f in b.playerFeedback" :key="f.id" class="pop" :class="`pop--${f.kind}`" :style="{ '--dx': `${f.offset}px` }">
          {{ f.amount ? (f.kind === 'cura' ? '+' : '−') + f.amount : '' }}<small v-if="f.label">{{ f.label }}</small>
        </span>
      </figure>

      <!-- HUD do seu (embaixo) -->
      <div class="hpbar hpbar--player">
        <p class="hpbar__name">
          <TypeIcon v-for="tp in meu.types" :key="tp" :type="tp" :size="12" :style="{ color: corTipo(tp) }" />
          Prof. {{ meu.name }}
        </p>
        <div class="hpbar__row">
          <span class="hpbar__label">HP</span>
          <span class="hpbar__track"><span :style="{ transform: `scaleX(${hud.player.pct})`, background: hud.player.cor }" /></span>
          <span class="hpbar__num">{{ hud.player.hp }}/{{ hud.player.max }}</span>
        </div>
        <ul v-if="hud.player.efeitos.length" class="chips">
          <li v-for="e in hud.player.efeitos" :key="e.id" :class="`chip chip--${e.tom}`">{{ e.rotulo }}</li>
        </ul>
      </div>
    </div>

    <div class="panel">
      <p class="panel__msg" aria-live="polite">{{ b.message }}</p>

      <div v-if="b.isOver" class="end" :class="`end--${b.phase}`">
        <p class="end__title">{{ t.end[b.phase] }}</p>
        <p class="end__note">{{ t.endNote }}</p>
        <button type="button" class="btn-pixel btn-pixel--block" @click="lutar(meu)">{{ t.again }}</button>
        <button type="button" class="btn-pixel btn-pixel--ghost btn-pixel--block" @click="sair">{{ t.change }}</button>
      </div>

      <template v-else>
        <div class="panel__moves">
          <MoveCard
            v-for="m in hud.moves"
            :key="m.id"
            :move="m"
            :target-types="rival.types"
            as="button"
            :disabled="!podeAgir"
            @pick="b.useMove"
          />
        </div>
        <button type="button" class="panel__flee" :disabled="!podeAgir" @click="b.flee">{{ t.flee }}</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ── Escolha ───────────────────────────────────────────────────────────── */
.pick__lede {
  padding: 14px 14px 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
}

.pick__grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 12px;
}

.pick__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 8px 4px;
  background: var(--surface);
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  color: var(--text-primary);
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
}

.pick__btn:hover {
  border-color: var(--unifil-gold);
}

.pick__btn:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 2px;
}

.pick__btn img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: var(--bg-deep);
}

.pick__name {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.pick__types {
  display: flex;
  gap: 2px;
}

/* ── Arena ─────────────────────────────────────────────────────────────── */
.arena {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.arena__seal {
  position: absolute;
  top: 30px;
  right: 10px;
  z-index: 2;
  font-family: var(--font-pixel);
  font-size: 6px;
  color: var(--unifil-gold);
  text-shadow: 1px 1px 0 #000;
}

.stage {
  position: relative;
  /* Acompanha a altura da tela do app (cqh): o painel de golpes embaixo ocupa
     ~300px; o resto é arena, de ~320px na moldura até 460px em tela cheia. */
  height: 320px;
  height: clamp(210px, calc(100cqh - 300px), 460px);
  flex-shrink: 0;
  background:
    linear-gradient(to bottom, rgb(0 0 0 / 62%), rgb(0 0 0 / 22%) 30%, rgb(0 0 0 / 12%) 60%, rgb(0 0 0 / 55%)),
    var(--fundo) center bottom / cover no-repeat;
  overflow: hidden;
}

.stage--hit::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgb(255 107 107 / 25%);
  pointer-events: none;
}

.hpbar {
  position: absolute;
  z-index: 2;
  max-width: 62%;
  min-width: 170px;
  padding: 6px 8px;
  background: rgb(18 20 24 / 88%);
  border: 2px solid var(--surface-border);
  border-radius: 8px;
}

.hpbar--enemy {
  top: 44px;
  left: 10px;
}

.hpbar--player {
  left: 10px;
  bottom: 10px;
}

.hpbar__name {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-pixel);
  font-size: 8px;
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hpbar__row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
}

.hpbar__label {
  font-family: var(--font-pixel);
  font-size: 6px;
  color: var(--unifil-gold);
}

.hpbar__track {
  height: 8px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  overflow: hidden;
}

.hpbar__track span {
  display: block;
  height: 100%;
  transform-origin: left center;
  transition:
    transform 0.5s var(--ease-pixel),
    background-color 0.5s;
}

.hpbar__num {
  font-family: var(--font-pixel);
  font-size: 7px;
  font-variant-numeric: tabular-nums;
}

.chips {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}

.chip {
  padding: 1px 5px;
  border: 1px solid currentColor;
  border-radius: 99px;
  background: #000;
  /* Fonte do sistema: a pixel não tem ▲ ▼ e os desenha como ponto. */
  font-size: 9px;
  font-weight: 700;
  line-height: 1.4;
}

.chip--bom {
  color: #82d16b;
}

.chip--ruim {
  color: #ff6b6b;
}

.fighter {
  position: absolute;
  margin: 0;
}

.fighter img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom center;
}

/* Posições do ArenaPalco.vue do app: o rival em cima à esquerda, menor (ao
   fundo); você embaixo à direita, maior e de costas (em primeiro plano). */
.fighter--enemy {
  top: 108px;
  left: 6%;
  width: 38%;
  height: 34%;
}

.fighter--enemy img {
  filter: drop-shadow(0 0 1px #ff6b6b) drop-shadow(0 0 2px #ff6b6b);
}

.fighter--player {
  right: 3%;
  bottom: 0;
  width: 46%;
  height: 56%;
}

.fighter--player img {
  filter: drop-shadow(0 0 1px #7ec5e6) drop-shadow(0 0 2px #7ec5e6);
}

.fighter--hit img {
  animation: treme 0.4s steps(4, end);
  filter: brightness(1.6) saturate(0.4);
}

.fighter--down img {
  filter: grayscale(1) brightness(0.6);
  opacity: 0.75;
  transform: translateY(8%) rotate(12deg);
  transition:
    transform 0.6s var(--ease-pixel),
    opacity 0.6s;
}

@keyframes treme {
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-3px); }
}

.pop {
  position: absolute;
  top: 10%;
  left: 50%;
  translate: calc(-50% + var(--dx, 0px)) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-pixel);
  font-size: 18px;
  color: #ff6b6b;
  text-shadow:
    2px 2px 0 #000,
    -1px -1px 0 #000;
  pointer-events: none;
  animation: sobe 0.9s ease-out forwards;
}

.pop small {
  font-size: 7px;
  color: var(--text-primary);
}

.pop--cura {
  color: #82d16b;
}

.pop--critico {
  color: #ffd166;
}

@keyframes sobe {
  to {
    transform: translateY(-54px);
    opacity: 0;
  }
}

/* ── Painel de baixo ──────────────────────────────────────────────────── */
.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--bg-deep);
  border-top: 3px solid var(--unifil-orange);
}

.panel__msg {
  min-height: 44px;
  padding: 8px 10px;
  border: 2px solid var(--unifil-gold);
  border-radius: 6px;
  background: var(--surface);
  font-family: var(--font-pixel);
  font-size: 8px;
  line-height: 1.7;
}

.panel__moves {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.panel__flee {
  align-self: flex-start;
  min-height: 36px;
  padding: 0 12px;
  border: 2px solid #ff6b6b;
  border-radius: 6px;
  font-family: var(--font-pixel);
  font-size: 7px;
  color: #ff9b9b;
}

.panel__flee:disabled {
  opacity: 0.5;
}

.panel__flee:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 2px;
}

.end {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
}

.end--victory {
  background: radial-gradient(circle, rgb(255 209 102 / 18%), transparent 70%);
}

.end--defeat,
.end--fled {
  background: radial-gradient(circle, rgb(255 107 107 / 15%), transparent 70%);
}

.end__title {
  font-family: var(--font-pixel);
  font-size: 12px;
  line-height: 1.6;
}

.end--victory .end__title {
  color: #ffd166;
}

.end--defeat .end__title,
.end--fled .end__title {
  color: #ff9b9b;
}

.end__note {
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .fighter--hit img,
  .pop {
    animation: none;
  }

  .hpbar__track span,
  .fighter--down img {
    transition: none;
  }
}
</style>
