<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { appDemo, pvp } from '@/content/copy.js'
import { useMotionPreference } from '@/composables/useMotionPreference.js'
import PixelIcon from '@/components/PixelIcon.vue'
import { CENAS, ELO_ANTES, ELO_DEPOIS, T } from './cenas.js'

// Uma partida ranqueada inteira, do lobby ao Elo, contada nas telas do app.
//
// Quem manda é o relógio daqui: `tc` é o tempo dentro da cena atual, e cada
// tela desenha o quadro daquele instante (ver roteiro.js). A partida roda
// sozinha quando a seção está à vista, para quando sai dela ou a aba fica
// oculta, e tem pausa (o movimento passa de 5s, e quem lê precisa poder parar).
// Com movimento reduzido ela começa parada, no quadro-chave de cada cena.
// As telas (e o banco de golpes que elas usam) são um chunk à parte, baixado
// quando o celular chega perto da tela, como o simulador da seção anterior.
const TELAS = {
  lobby: defineAsyncComponent(() => import('./TelaLobby.vue')),
  selecao: defineAsyncComponent(() => import('./TelaSelecao.vue')),
  arena: defineAsyncComponent(() => import('./TelaArena.vue')),
}
const PASSO_MS = 100

const { prefersReducedMotion } = useMotionPreference()

const tocando = ref(!prefersReducedMotion.value)
const idx = ref(0)
// Tocando, começa do zero; parada, no quadro que resume a primeira cena.
const tc = ref(tocando.value ? 0 : quadroChave(0))
const visivel = ref(false)
const perto = ref(false)
const aparelho = ref(null)

const cena = computed(() => CENAS[idx.value])
const passo = computed(() => pvp.steps[idx.value])
const tempoTela = computed(() => cena.value.ini + tc.value)
const progresso = computed(() => Math.min(1, tc.value / cena.value.dur))
const parada = computed(() => !tocando.value || prefersReducedMotion.value)

function quadroChave(i) {
  return CENAS[i].poster - CENAS[i].ini
}

function ir(i) {
  idx.value = i
  // Tocando, a cena recomeça do início; parada, mostra o quadro que a resume.
  tc.value = tocando.value ? 0 : quadroChave(i)
}

function alternar() {
  tocando.value = !tocando.value
}

// ── Relógio ────────────────────────────────────────────────────────────────
let relogio = null
let ultimo = 0

function tique() {
  const agora = performance.now()
  // Teto no passo: uma aba que volta do segundo plano não pula meia cena.
  const dt = Math.min(250, agora - ultimo)
  ultimo = agora
  let t = tc.value + dt
  let i = idx.value
  while (t >= CENAS[i].dur) {
    t -= CENAS[i].dur
    i = (i + 1) % CENAS.length
  }
  idx.value = i
  tc.value = t
}

const rodando = computed(() => tocando.value && visivel.value)

function sincronizar() {
  const deveRodar = rodando.value && !document.hidden
  if (deveRodar && !relogio) {
    ultimo = performance.now()
    relogio = setInterval(tique, PASSO_MS)
  } else if (!deveRodar && relogio) {
    clearInterval(relogio)
    relogio = null
  }
}

watch(rodando, sincronizar)

let observador = null
let vigia = null
onMounted(() => {
  document.addEventListener('visibilitychange', sincronizar)
  if (typeof IntersectionObserver === 'undefined') {
    visivel.value = true
    perto.value = true
    return
  }
  // Mede o celular, e não a seção inteira: num celular deitado a seção nunca
  // chega a aparecer pela metade, mas o celular sim.
  observador = new IntersectionObserver(([e]) => (visivel.value = e.isIntersecting), { threshold: 0.4 })
  observador.observe(aparelho.value)
  vigia = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return
      perto.value = true
      vigia.disconnect()
    },
    { rootMargin: '600px 0px' },
  )
  vigia.observe(aparelho.value)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', sincronizar)
  observador?.disconnect()
  vigia?.disconnect()
  clearInterval(relogio)
})

// ── Escada de tiers ────────────────────────────────────────────────────────
// O seu Elo sobe no instante em que o resultado o mostra na tela do app.
const subiu = computed(() => cena.value.id === 'elo' && tempoTela.value >= T.arena.novoElo)
const elo = computed(() => (subiu.value ? ELO_DEPOIS : ELO_ANTES))
const tierAtual = computed(() => pvp.tiers.findLastIndex((x) => elo.value >= x.min))
// Cada tier ocupa uma célula de 100 pontos; o marcador anda dentro dela.
const posicao = computed(() => {
  const i = tierAtual.value
  const dentro = Math.min(0.96, (elo.value - pvp.tiers[i].min) / 100)
  return (i + dentro) / pvp.tiers.length
})
</script>

<template>
  <div class="roteiro">
    <ol class="cenas" :aria-label="pvp.player.label">
      <li
        v-for="(s, i) in pvp.steps"
        :key="s.id"
        class="cena"
        :class="{ 'cena--atual': i === idx, 'cena--feita': i < idx }"
      >
        <button type="button" class="cena__btn" :aria-current="i === idx ? 'step' : undefined" @click="ir(i)">
          <span class="cena__no" aria-hidden="true" />
          <span class="cena__titulo">{{ s.title }}</span>
          <span class="cena__desc">
            <span class="cena__desc-texto">{{ s.desc }}</span>
          </span>
          <span class="cena__barra" aria-hidden="true">
            <span :style="{ transform: `scaleX(${i === idx ? progresso : i < idx ? 1 : 0})` }" />
          </span>
        </button>
      </li>
    </ol>

    <div class="controle">
      <!-- No celular a trilha vira só as barrinhas; a legenda diz a cena. -->
      <!-- As cinco legendas ocupam a mesma célula e só a atual aparece: a
           altura é a da mais longa, e o celular embaixo não pula. -->
      <p class="legenda" aria-hidden="true">
        <span
          v-for="(s, i) in pvp.steps"
          :key="s.id"
          class="legenda__item"
          :class="{ 'legenda__item--atual': i === idx }"
        >
          <span class="legenda__titulo">{{ s.title }}</span>
          {{ s.desc }}
        </span>
      </p>
      <button type="button" class="controle__btn" @click="alternar">
        <PixelIcon :nome="tocando ? 'pausar' : 'tocar'" :escala="2" />
        <span class="controle__rotulo">{{ tocando ? pvp.player.pause : pvp.player.play }}</span>
      </button>
    </div>

    <div ref="aparelho" class="aparelho">
      <div
        class="pvp-tela"
        :class="{ 'pvp-tela--parada': parada }"
        role="img"
        :aria-label="`${pvp.player.stage}: ${passo.title}`"
      >
        <p class="pvp-tela__selo">{{ appDemo.badge }}</p>
        <div class="pvp-tela__vista" inert>
          <Transition v-if="perto" name="troca" mode="out-in">
            <component :is="TELAS[cena.tela]" :key="cena.tela" :t="tempoTela" />
          </Transition>
        </div>
      </div>
    </div>

    <section class="escada" :aria-label="pvp.tiersLabel">
      <h3 class="escada__titulo">{{ pvp.tiersLabel }}</h3>
      <div class="escada__trilho">
        <div class="escada__marca" :style="{ '--pos': posicao }" aria-hidden="true">
          <span class="escada__pino" :class="{ 'escada__pino--subiu': subiu }">
            {{ pvp.you }} <b>{{ elo }}</b>
          </span>
        </div>
        <ol class="escada__tiers">
          <li
            v-for="(tier, i) in pvp.tiers"
            :key="tier.name"
            class="tier"
            :class="{ 'tier--atual': i === tierAtual }"
          >
            <PixelIcon :nome="tier.icon" :escala="2" />
            <span class="tier__nome">{{ tier.name }}</span>
            <span class="tier__min">{{ tier.min }}{{ i === pvp.tiers.length - 1 ? '+' : '' }}</span>
          </li>
        </ol>
      </div>
    </section>

    <ul class="fatos">
      <li v-for="f in pvp.facts" :key="f.text" class="fato">
        <PixelIcon :nome="f.icon" :escala="2" />
        {{ f.text }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* ── Composição ───────────────────────────────────────────────────────────
   Desktop: a trilha das cenas à esquerda, o celular à direita, a escada de
   tiers embaixo dos dois. Celular: as barrinhas das cenas, a legenda, o
   celular, a escada. */
.roteiro {
  display: grid;
  grid-template-areas:
    'cenas'
    'controle'
    'aparelho'
    'escada'
    'fatos';
  gap: var(--space-3);
}

.cenas { grid-area: cenas; }
.controle { grid-area: controle; }
.aparelho { grid-area: aparelho; }
.escada { grid-area: escada; }
.fatos { grid-area: fatos; }

@media (min-width: 880px) {
  .roteiro {
    /* As linhas vazias em cima e embaixo centram a trilha na altura do
       celular. */
    grid-template-areas:
      '. aparelho'
      'cenas aparelho'
      'controle aparelho'
      'fatos aparelho'
      '. aparelho'
      'escada escada';
    grid-template-columns: minmax(0, 1fr) 380px;
    grid-template-rows: 1fr auto auto auto 1fr auto;
    column-gap: var(--space-6);
    row-gap: var(--space-4);
  }
}

/* ── Trilha das cenas ─────────────────────────────────────────────────── */
.cenas {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-1);
  list-style: none;
}

.cena__btn {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 0;
  background: none;
  border: 0;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
}

.cena__btn:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 4px;
}

/* No celular, só a barra aparece: título e linha ficam para o leitor de tela
   e para a legenda logo abaixo. */
.cena__no,
.cena__titulo,
.cena__desc {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.cena__barra {
  display: block;
  width: 100%;
  height: 4px;
  background: var(--surface-border);
}

.cena__barra span {
  display: block;
  height: 100%;
  background: var(--unifil-gold);
  transform-origin: left center;
  transition: transform 100ms linear;
}

@media (min-width: 880px) {
  .cenas {
    grid-template-columns: none;
    gap: 0;
    align-self: start;
  }

  .cena {
    position: relative;
  }

  /* O fio que liga as cenas: dourado no trecho já percorrido. */
  .cena:not(:last-child)::before {
    content: '';
    position: absolute;
    top: 30px;
    bottom: -6px;
    left: 7px;
    width: 2px;
    background: var(--surface-border);
  }

  .cena--feita::before {
    background: var(--unifil-gold);
  }

  .cena__btn {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    grid-template-areas:
      'no titulo'
      '. desc'
      '. barra';
    column-gap: var(--space-3);
    align-items: center;
    padding: var(--space-2) 0;
  }

  .cena__no,
  .cena__titulo,
  .cena__desc {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip-path: none;
    white-space: normal;
  }

  .cena__no {
    grid-area: no;
    width: 16px;
    height: 16px;
    border: 2px solid var(--surface-border);
    background: var(--bg-deep);
  }

  .cena--feita .cena__no {
    border-color: var(--unifil-gold);
  }

  .cena--atual .cena__no {
    border-color: var(--unifil-gold);
    background: var(--unifil-gold);
  }

  .cena__titulo {
    grid-area: titulo;
    font-family: var(--font-pixel);
    font-size: var(--fs-h3);
    line-height: 1.6;
    color: var(--text-muted);
    transition: color var(--dur-fast) steps(2, end);
  }

  .cena__btn:hover .cena__titulo,
  .cena--atual .cena__titulo {
    color: var(--unifil-gold);
  }

  /* Só a cena atual mostra a sua linha: a trilha lê como índice, e o texto
     da vez abre embaixo do título (a grade anima a altura sem medir nada). */
  .cena__desc {
    grid-area: desc;
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--dur-base) var(--ease-out);
  }

  .cena--atual .cena__desc {
    grid-template-rows: 1fr;
  }

  .cena__desc-texto {
    min-height: 0;
    overflow: hidden;
    font-size: var(--fs-body-sm);
    line-height: 1.7;
    color: var(--text-primary);
  }

  .cena--atual .cena__desc-texto {
    padding-top: var(--space-2);
  }

  .cena__barra {
    grid-area: barra;
    height: 3px;
    margin-top: var(--space-2);
    opacity: 0;
  }

  .cena--atual .cena__barra {
    opacity: 1;
  }
}

/* ── Legenda e pausa ──────────────────────────────────────────────────── */
.controle {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.legenda {
  display: grid;
  font-size: var(--fs-body-sm);
  line-height: 1.7;
}

.legenda__item {
  grid-area: 1 / 1;
  visibility: hidden;
}

.legenda__item--atual {
  visibility: visible;
}

.legenda__titulo {
  display: block;
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  color: var(--unifil-gold);
}

.controle__btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-width: 44px;
  min-height: 44px;
  padding: 0 var(--space-2);
  border: 2px solid var(--surface-border);
  border-radius: var(--radius);
  background: var(--surface);
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--unifil-gold);
  cursor: pointer;
  touch-action: manipulation;
}

/* No celular o botão é só o ícone (o nome continua para o leitor de tela):
   a legenda precisa da largura. */
.controle__rotulo {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.controle__btn:hover {
  border-color: var(--unifil-gold);
}

.controle__btn:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 2px;
}

@media (min-width: 880px) {
  .legenda {
    display: none;
  }

  .controle__btn {
    padding: 0 var(--space-3);
  }

  .controle__rotulo {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip-path: none;
  }
}

/* ── O celular ────────────────────────────────────────────────────────── */
.aparelho {
  justify-self: center;
  width: min(100%, 380px);
  padding: 10px;
  border: 2px solid var(--surface-border);
  border-radius: 36px;
  background: #0b0c0f;
  box-shadow:
    inset 0 0 0 2px #23252b,
    0 24px 48px rgb(0 0 0 / 45%);
}

/* Dentro do celular vale a tipografia do app: corpo na fonte do sistema e a
   pixel só onde o app usa. */
.pvp-tela {
  position: relative;
  height: clamp(500px, 148vw, 560px);
  overflow: hidden;
  border-radius: 26px;
  background: var(--bg-deep);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.45;
  letter-spacing: 0;
}

@media (min-width: 880px) {
  .pvp-tela {
    height: 580px;
  }
}

.pvp-tela__selo {
  position: absolute;
  top: 8px;
  left: 50%;
  z-index: 6;
  padding: 3px 8px;
  border: 1px solid color-mix(in srgb, var(--unifil-gold) 50%, transparent);
  border-radius: 99px;
  background: rgb(0 0 0 / 70%);
  font-family: var(--font-pixel);
  font-size: 7px;
  line-height: 1.6;
  letter-spacing: 0.5px;
  color: var(--unifil-gold);
  white-space: nowrap;
  translate: -50% 0;
}

/* `container: tela`: o mesmo nome da tela do simulador, para os cards de golpe
   (MoveCard) ficarem na versão compacta, como num celular de verdade. */
.pvp-tela__vista {
  container: tela / size;
  height: 100%;
}

.troca-enter-active,
.troca-leave-active {
  transition: opacity 240ms steps(3, end);
}

.troca-enter-from,
.troca-leave-to {
  opacity: 0;
}

/* ── Escada de tiers ──────────────────────────────────────────────────── */
.escada {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 2px solid var(--surface-border);
}

.escada__titulo {
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  line-height: 1.6;
  color: var(--unifil-gold);
}

.escada__trilho {
  position: relative;
  padding-top: 34px;
}

/* O marcador anda por uma faixa da largura da escada: `translateX` em % da
   própria faixa é a posição na escada, sem medir nada em JS. */
.escada__marca {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: translateX(calc(var(--pos) * 100%));
  transition: transform var(--dur-slow) var(--ease-pixel);
  pointer-events: none;
}

.escada__pino {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 2px solid var(--unifil-gold);
  border-radius: var(--radius);
  background: var(--bg-deep);
  font-family: var(--font-pixel);
  font-size: 8px;
  line-height: 1.4;
  color: var(--unifil-gold);
  white-space: nowrap;
  translate: -50% 0;
}

.escada__pino b {
  font-weight: inherit;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

/* A ponta do marcador, apontando para a escada. */
.escada__pino::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  background: var(--unifil-gold);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.escada__pino--subiu {
  animation: promove 900ms steps(2, end) 2;
}

.escada__tiers {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 2px;
  list-style: none;
}

.tier {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) 2px;
  border-top: 4px solid var(--surface-border);
  background: var(--surface);
  text-align: center;
  transition: border-color var(--dur-base) steps(3, end);
}

.tier--atual {
  border-top-color: var(--unifil-gold);
}

.tier__nome {
  font-family: var(--font-pixel);
  font-size: 6px;
  line-height: 1.6;
}

.tier__min {
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

@media (min-width: 560px) {
  .tier {
    padding: var(--space-3) var(--space-2);
  }

  .tier__nome {
    font-size: 9px;
  }

  .tier__min {
    font-size: 13px;
  }
}

/* ── Fatos ────────────────────────────────────────────────────────────── */
.fatos {
  display: flex;
  flex-wrap: wrap;
  align-content: start;
  gap: var(--space-2) var(--space-4);
  list-style: none;
}

.fato {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-body-sm);
  line-height: 1.6;
  color: var(--text-muted);
}

@keyframes promove {
  50% { filter: brightness(1.6); }
}

@media (prefers-reduced-motion: reduce) {
  .cena__desc,
  .cena__barra span,
  .escada__marca,
  .tier {
    transition: none;
  }

  .escada__pino--subiu {
    animation: none;
  }
}
</style>

<!-- Regras que valem para as três telas: o toque simulado e a parada. Sem
     `scoped` porque as telas são outros componentes; tudo fica preso a
     `.pvp-tela`. -->
<style>
/* O toque: o elemento afunda como um botão do app e um anel abre no lugar do
   dedo. É o que diz, sem cursor, "agora a pessoa tocou aqui". */
.pvp-tela .toque {
  position: relative;
  transform: translateY(1px) scale(0.98);
  filter: brightness(0.92);
}

.pvp-tela .toque::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  margin: -15px 0 0 -15px;
  border: 2px solid rgb(255 255 255 / 85%);
  border-radius: 50%;
  pointer-events: none;
  animation: pvpToque 320ms steps(4, end) forwards;
}

@keyframes pvpToque {
  from {
    transform: scale(0.4);
  }
  to {
    transform: scale(1.7);
    opacity: 0;
  }
}

/* Parada (pausa ou movimento reduzido): nada se mexe, e cada elemento fica no
   seu estado final. Isso também para os pulsos infinitos, que a pausa precisa
   parar de verdade. */
.pvp-tela--parada *,
.pvp-tela--parada *::before,
.pvp-tela--parada *::after {
  animation: none !important;
  transition: none !important;
}

.pvp-tela--parada .toque::after {
  display: none;
}
</style>
