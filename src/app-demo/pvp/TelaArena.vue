<script setup>
import { computed } from 'vue'
import { getType, legibleColor } from '@/data/types.js'
import { asset } from '@/config/asset.js'
import MoveCard from '../MoveCard.vue'
import TypeIcon from '@/components/TypeIcon.vue'
import {
  DANO,
  DELE,
  ELO_DELTA,
  ELO_DEPOIS,
  GOLPE_DELE,
  GOLPE_USADO,
  GOLPES,
  HP_FINAL,
  HP_MAX,
  MEU,
  RIVAL,
  T,
  TIME,
  TIME_RIVAL,
  restam,
} from './roteiro.js'

// As cenas "Turnos de 60s" e "Elo" (PvpArenaView.vue do app), numa tela só:
// o primeiro turno, com os dois escolhendo ao mesmo tempo, e o resultado, que
// no app cobre a própria arena quando a partida acaba.
const props = defineProps({
  t: { type: Number, required: true },
})

const ta = T.arena
const depois = (ms) => props.t >= ms
const janela = (de, ate) => depois(de) && !depois(ate)

const acabou = computed(() => depois(ta.fim))

// No fim, quem está em campo do lado de lá é o último do time dele.
const rivalEmCampo = computed(() => (acabou.value ? TIME_RIVAL[2] : DELE))

const hpRival = computed(() => {
  if (acabou.value) return 0
  return depois(ta.acerto) ? HP_MAX - DANO.meu : HP_MAX
})
const hpMeu = computed(() => {
  if (acabou.value) return HP_FINAL
  return depois(ta.acertoDele) ? HP_MAX - DANO.dele : HP_MAX
})

const mensagem = computed(() => {
  if (acabou.value) return `${rivalEmCampo.value.name} foi derrotado!`
  if (depois(ta.proximo)) return 'Escolha seu golpe!'
  if (depois(ta.acertoDele)) return 'Foi super eficaz!'
  if (depois(ta.golpeDele)) return `${DELE.name} usou ${GOLPE_DELE.name}!`
  if (depois(ta.acerto)) return 'Foi super eficaz!'
  if (depois(ta.meuGolpe)) return `${MEU.name} usou ${GOLPE_USADO.name}!`
  if (depois(ta.resolvendo)) return 'Resolvendo a rodada…'
  if (depois(ta.usa)) return `Aguardando ${RIVAL}…`
  if (depois(ta.escolha)) return 'Escolha seu golpe!'
  return `${DELE.name} entrou na arena!`
})

const emJogo = computed(() => depois(ta.escolha) && !acabou.value)
const segundos = computed(() => restam(props.t, depois(ta.proximo) ? ta.proximo : ta.escolha))
const podeAgir = computed(() => janela(ta.escolha, ta.usa) || janela(ta.proximo, ta.fim))

const pct = (hp) => Math.max(0, Math.min(1, hp / HP_MAX))
const corHp = (p) => (p > 0.5 ? '#9ae186' : p > 0.2 ? '#ffdf6d' : '#ff6b6b')
const corTipo = (tp) => {
  const x = getType(tp)
  return x ? legibleColor(x.color) : 'var(--unifil-gold)'
}

// Os bancos (BancoDeReservas.vue): o rival à esquerda, você à direita, a
// mesma diagonal do palco.
const bancoRival = computed(() =>
  TIME_RIVAL.map((p, i) => ({
    p,
    hp: acabou.value ? 0 : i === 0 ? hpRival.value : HP_MAX,
  })),
)
const bancoMeu = computed(() =>
  TIME.map((p, i) => ({
    p,
    hp: i === 0 ? hpMeu.value : acabou.value && i === 1 ? 0 : HP_MAX,
    ativo: i === 0,
  })),
)

// Os avisos flutuantes do canto (as "dicas" do app), um por golpe.
const dicas = computed(() =>
  [
    { id: 1, de: ta.meuGolpe, texto: `${MEU.name} usou ${GOLPE_USADO.name}!` },
    { id: 2, de: ta.golpeDele, texto: `${DELE.name} usou ${GOLPE_DELE.name}!` },
  ].filter((d) => janela(d.de, d.de + 4000) && !acabou.value),
)

// O Elo do resultado sobe contando, de um em um.
const delta = computed(() => Math.min(ELO_DELTA, Math.max(0, Math.floor((props.t - ta.elo) / 32))))
</script>

<template>
  <div class="pvp" :class="{ 'pvp--vitoria': acabou }">
    <div class="palco" :style="{ '--fundo': `url(${asset('/app/ginasio.webp')})` }">
      <div class="hp hp--rival">
        <p class="hp__nome">
          <TypeIcon v-for="tp in rivalEmCampo.types" :key="tp" :type="tp" :size="12" :style="{ color: corTipo(tp) }" />
          Prof. {{ rivalEmCampo.name }}
        </p>
        <div class="hp__linha">
          <span class="hp__rotulo">HP</span>
          <span class="hp__trilho"><span :style="{ transform: `scaleX(${pct(hpRival)})`, background: corHp(pct(hpRival)) }" /></span>
          <span class="hp__num">{{ hpRival }}/{{ HP_MAX }}</span>
        </div>
      </div>

      <span class="log">LOG</span>

      <ul class="dicas">
        <li v-for="d in dicas" :key="d.id" class="dica">
          <span class="dica__turno">T1</span>
          <span class="dica__texto">{{ d.texto }}</span>
        </li>
      </ul>

      <figure
        class="lutador lutador--rival"
        :class="{ 'lutador--hit': janela(ta.acerto, ta.acerto + 400), 'lutador--caido': acabou }"
      >
        <img :src="rivalEmCampo.sprite" alt="" width="320" height="320" draggable="false" />
        <span v-if="janela(ta.acerto, ta.acerto + 900)" class="pop">−{{ DANO.meu }}<small>SUPER EFICAZ!</small></span>
      </figure>

      <figure class="lutador lutador--meu" :class="{ 'lutador--hit': janela(ta.acertoDele, ta.acertoDele + 400) }">
        <img :src="MEU.spriteBack" alt="" width="320" height="320" draggable="false" />
        <span v-if="janela(ta.acertoDele, ta.acertoDele + 900)" class="pop">−{{ DANO.dele }}<small>SUPER EFICAZ!</small></span>
      </figure>

      <div class="hp hp--meu">
        <p class="hp__nome">
          <TypeIcon v-for="tp in MEU.types" :key="tp" :type="tp" :size="12" :style="{ color: corTipo(tp) }" />
          Prof. {{ MEU.name }}
        </p>
        <div class="hp__linha">
          <span class="hp__rotulo">HP</span>
          <span class="hp__trilho"><span :style="{ transform: `scaleX(${pct(hpMeu)})`, background: corHp(pct(hpMeu)) }" /></span>
          <span class="hp__num">{{ hpMeu }}/{{ HP_MAX }}</span>
        </div>
      </div>
    </div>

    <div class="faixa">
      <div class="faixa__times">
        <div class="banco">
          <span class="banco__rotulo">RIVAL</span>
          <ul class="banco__lista">
            <li v-for="m in bancoRival" :key="m.p.slug" class="banco__item" :class="{ 'banco__item--caido': m.hp <= 0 }">
              <img class="banco__rosto" :src="m.p.spriteFace" alt="" width="26" height="26" draggable="false" />
              <span class="banco__hp"><span :class="{ baixo: pct(m.hp) <= 0.3 }" :style="{ transform: `scaleX(${pct(m.hp)})` }" /></span>
            </li>
          </ul>
        </div>
        <div class="banco">
          <span class="banco__rotulo">Você</span>
          <ul class="banco__lista">
            <li
              v-for="m in bancoMeu"
              :key="m.p.slug"
              class="banco__item"
              :class="{ 'banco__item--caido': m.hp <= 0, 'banco__item--ativo': m.ativo }"
            >
              <img class="banco__rosto" :src="m.p.spriteFace" alt="" width="26" height="26" draggable="false" />
              <span class="banco__hp"><span :class="{ baixo: pct(m.hp) <= 0.3 }" :style="{ transform: `scaleX(${pct(m.hp)})` }" /></span>
            </li>
          </ul>
        </div>
      </div>

      <div class="faixa__msg">
        <span class="faixa__texto">{{ mensagem }}</span>
        <span v-if="emJogo" class="faixa__timer" :class="{ 'faixa__timer--baixo': segundos <= 10 }">{{ segundos }}s</span>
      </div>

      <div class="faixa__golpes">
        <MoveCard
          v-for="g in GOLPES"
          :key="g.id"
          :move="g"
          :target-types="DELE.types"
          :class="{ 'golpe--off': !podeAgir, toque: g === GOLPE_USADO && janela(ta.usa, ta.usa + 320) }"
        />
      </div>
      <span class="faixa__trocar" :class="{ 'faixa__trocar--off': !podeAgir }">⇄ Trocar (2)</span>
    </div>

    <!-- O resultado, por cima da arena. -->
    <div v-if="depois(ta.resultado)" class="resultado">
      <div class="resultado__card">
        <p class="resultado__titulo">Você venceu!</p>
        <p class="resultado__motivo">Por nocaute</p>
        <p class="resultado__elo" :class="{ 'resultado__elo--on': depois(ta.elo) }">ELO +{{ delta }}</p>
        <p class="resultado__novo" :class="{ 'resultado__novo--on': depois(ta.novoElo) }">Novo Elo: {{ ELO_DEPOIS }} · Prata</p>
        <span class="resultado__btn" :class="{ 'resultado__btn--on': depois(ta.botao) }">VOLTAR AO LOBBY</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pvp {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg-deep);
}

/* A vinheta dourada que pulsa na vitória (`pvp-arena--victory` do app). */
.pvp--vitoria::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 4;
  background: radial-gradient(circle at center, transparent 42%, rgb(255 209 102 / 20%) 100%);
  box-shadow: inset 0 0 80px rgb(255 209 102 / 22%);
  pointer-events: none;
  animation: pulsa 2.4s ease-in-out infinite;
}

/* ── Palco (ArenaPalco.vue) ───────────────────────────────────────────── */
.palco {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(to bottom, rgb(0 0 0 / 62%), rgb(0 0 0 / 22%) 30%, rgb(0 0 0 / 12%) 60%, rgb(0 0 0 / 55%)),
    var(--fundo) center bottom / cover no-repeat;
}

.hp {
  position: absolute;
  z-index: 2;
  min-width: 150px;
  max-width: 62%;
  padding: 5px 7px;
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  background: rgb(18 20 24 / 88%);
}

.hp--rival {
  top: 32px;
  left: 10px;
}

.hp--meu {
  bottom: 8px;
  left: 10px;
}

.hp__nome {
  display: flex;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  font-family: var(--font-pixel);
  font-size: 7px;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hp__linha {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
}

.hp__rotulo {
  font-family: var(--font-pixel);
  font-size: 6px;
  color: var(--unifil-gold);
}

.hp__trilho {
  height: 8px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  background: var(--surface);
}

.hp__trilho span {
  display: block;
  height: 100%;
  transform-origin: left center;
  transition:
    transform 0.5s var(--ease-pixel),
    background-color 0.5s;
}

.hp__num {
  font-family: var(--font-pixel);
  font-size: 6px;
  font-variant-numeric: tabular-nums;
}

.log {
  position: absolute;
  top: 32px;
  right: 10px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 52px;
  height: 26px;
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 6px;
  background: rgb(18 20 24 / 35%);
  font-family: var(--font-pixel);
  font-size: 7px;
}

/* As dicas do app trazem uma faixa dourada à esquerda: é o desenho de lá. */
.dicas {
  position: absolute;
  top: 64px;
  right: 8px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 132px;
  list-style: none;
}

.dica {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid var(--surface-border);
  border-left: 2px solid var(--unifil-gold);
  border-radius: 7px;
  background: rgb(18 20 24 / 94%);
  box-shadow: 0 4px 16px rgb(0 0 0 / 45%);
  font-size: 9px;
  line-height: 1.3;
  animation:
    dicaEntra 180ms ease-out both,
    dicaSai 280ms ease-in 3.72s both;
}

.dica__turno {
  padding-top: 2px;
  font-family: var(--font-pixel);
  font-size: 5px;
  color: var(--text-muted);
}

.lutador {
  position: absolute;
  margin: 0;
}

.lutador img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom center;
}

/* Posições do ArenaPalco: o rival ao fundo, em cima à esquerda; você na
   frente, embaixo à direita e de costas. */
.lutador--rival {
  top: 74px;
  left: 6%;
  width: 34%;
  height: 34%;
}

.lutador--rival img {
  filter: drop-shadow(0 0 1px #ff6b6b) drop-shadow(0 0 2px #ff6b6b);
}

.lutador--meu {
  right: 3%;
  bottom: 0;
  width: 46%;
  height: 60%;
}

.lutador--meu img {
  filter: drop-shadow(0 0 1px #7ec5e6) drop-shadow(0 0 2px #7ec5e6);
}

.lutador--hit img {
  filter: brightness(1.6) saturate(0.4);
  animation: treme 0.4s steps(4, end);
}

.lutador--caido img {
  filter: grayscale(1) brightness(0.6);
  opacity: 0.75;
  transform: translateY(8%) rotate(12deg);
}

.pop {
  position: absolute;
  top: 6%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-pixel);
  font-size: 16px;
  color: #ffd166;
  text-shadow:
    2px 2px 0 #000,
    -1px -1px 0 #000;
  white-space: nowrap;
  pointer-events: none;
  translate: -50% 0;
  animation: sobe 0.9s ease-out forwards;
}

.pop small {
  font-size: 6px;
  color: var(--text-primary);
}

/* ── Faixa de comandos ────────────────────────────────────────────────── */
.faixa {
  position: relative;
  z-index: 2;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 7px;
  padding: 8px 12px 10px;
  border-top: 2px solid var(--surface-border);
  background: var(--surface);
}

.faixa__times {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.banco {
  display: flex;
  align-items: center;
  gap: 6px;
}

.banco__rotulo {
  font-family: var(--font-pixel);
  font-size: 6px;
  color: var(--text-muted);
}

.banco__lista {
  display: flex;
  gap: 5px;
  list-style: none;
}

.banco__item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 30px;
  padding: 2px;
  border: 2px solid var(--surface-border);
  border-radius: 6px;
  background: rgb(0 0 0 / 45%);
}

.banco__item--ativo {
  border-color: var(--unifil-gold);
}

.banco__item--caido {
  opacity: 0.4;
  filter: grayscale(1);
}

.banco__rosto {
  display: block;
  width: 100%;
  height: 22px;
  object-fit: cover;
  object-position: top;
  image-rendering: pixelated;
}

.banco__hp {
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: rgb(255 255 255 / 20%);
}

.banco__hp span {
  display: block;
  height: 100%;
  background: var(--ds-green);
  transform-origin: left center;
  transition: transform 0.3s ease;
}

.banco__hp .baixo {
  background: var(--error);
}

.faixa__msg {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  padding: 6px 10px;
  border: 2px solid var(--unifil-gold);
  border-radius: 8px;
  background: var(--surface);
  font-family: var(--font-pixel);
  font-size: 8px;
  line-height: 1.6;
}

.faixa__texto {
  min-width: 0;
}

.faixa__timer {
  flex-shrink: 0;
  padding: 5px 7px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background: var(--surface);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
}

.faixa__timer--baixo {
  color: var(--unifil-gold);
  animation: pisca 1s steps(2) infinite;
}

.faixa__golpes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

/* Na resolução os golpes ficam VISÍVEIS e desabilitados, como no app: dizem
   "sua vez daqui a pouco" sem a tela pular. */
.faixa__golpes .golpe--off {
  opacity: 0.55;
}

.faixa__trocar {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-primary);
}

.faixa__trocar--off {
  opacity: 0.5;
}

/* ── Resultado ────────────────────────────────────────────────────────── */
.resultado {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(0 0 0 / 72%);
  animation: aparece var(--dur-base) steps(3, end) both;
}

.resultado__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 26px 24px;
  border: 2px solid #ffd166;
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 0 34px rgb(255 209 102 / 22%);
  text-align: center;
  animation: cresce var(--dur-base) var(--ease-pixel) both;
}

.resultado__titulo {
  font-family: var(--font-pixel);
  font-size: 18px;
  line-height: 1.3;
  color: var(--unifil-gold);
}

.resultado__motivo {
  font-size: 13px;
  color: var(--text-muted);
}

.resultado__elo {
  font-family: var(--font-pixel);
  font-size: 11px;
  color: var(--ds-green-glow);
  font-variant-numeric: tabular-nums;
  opacity: 0;
}

.resultado__novo {
  margin-top: -4px;
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0;
}

.resultado__btn {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 6px;
  padding: 0 18px;
  border: 1px solid var(--unifil-gold);
  border-radius: 8px;
  background: var(--surface-border);
  font-family: var(--font-pixel);
  font-size: 9px;
  opacity: 0;
}

.resultado__elo--on,
.resultado__novo--on,
.resultado__btn--on {
  opacity: 1;
  transition: opacity var(--dur-base) steps(3, end);
}

@keyframes pulsa {
  50% { opacity: 0.62; }
}

@keyframes treme {
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-3px); }
}

@keyframes sobe {
  to {
    transform: translateY(-46px);
    opacity: 0;
  }
}

@keyframes pisca {
  50% { opacity: 0.4; }
}

@keyframes dicaEntra {
  from {
    transform: translateX(10px);
    opacity: 0;
  }
}

@keyframes dicaSai {
  to { opacity: 0; }
}

@keyframes aparece {
  from { opacity: 0; }
}

@keyframes cresce {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
}
</style>
