<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { appDemo } from '@/content/copy.js'
import { asset } from '@/config/asset.js'
import DexScreen from './screens/DexScreen.vue'
import BattleScreen from './screens/BattleScreen.vue'
import RankingScreen from './screens/RankingScreen.vue'
import RaidScreen from './screens/RaidScreen.vue'

// O celular simulado: a barra de baixo do app (BottomNav), com as telas
// trocando por estado, sem roteador nem URL. É uma vitrine; recarregar volta ao
// início. Não há "Capturar": a câmera não tem o que fazer fora do evento.
const props = defineProps({
  // Aba pedida de fora (ex.: o link "Jogar no simulador" da seção Batalha).
  requestedTab: { type: String, default: '' },
})

// `cor` é o trio do BottomNav do app: borda, brilho de cima, sombra de baixo.
const COR = {
  laranja: { borda: '#cba034', brilho: '#ffdf6d', sombra: '#896712' },
  azul: { borda: '#3c7fa1', brilho: '#7ec5e6', sombra: '#1e4d66' },
  verde: { borda: '#549942', brilho: '#9ae186', sombra: '#2e6221' },
}

const TABS = [
  { id: 'dex', icon: asset('/app/profdex.png'), screen: DexScreen, cor: COR.laranja },
  { id: 'battle', icon: asset('/app/batalha.png'), screen: BattleScreen, cor: COR.verde },
  { id: 'ranking', icon: asset('/app/ranking.png'), screen: RankingScreen, cor: COR.azul },
  { id: 'raid', icon: asset('/professors/sergio-tanaka-pixel-face.png'), screen: RaidScreen, cor: COR.laranja },
]

const active = ref('dex')
const current = computed(() => TABS.find((t) => t.id === active.value))
const screenEl = ref(null)
const tabEls = ref([])

watch(
  () => props.requestedTab,
  (id) => {
    if (id && TABS.some((t) => t.id === id)) active.value = id
  },
)

// Cada aba começa do topo, como no app.
watch(active, async () => {
  await nextTick()
  screenEl.value?.scrollTo({ top: 0 })
})

/** Setas, Home e End movem entre as abas, como pede o padrão de tablist. */
function onKey(event, index) {
  const last = TABS.length - 1
  const next = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }[event.key]
  if (next === undefined) return
  event.preventDefault()
  active.value = TABS[next].id
  tabEls.value[next]?.focus()
}

function goTo(id) {
  active.value = id
}

// ── Tela cheia ─────────────────────────────────────────────────────────────
//
// No celular do visitante o simulador dentro da página fica apertado (a barra
// do site e a moldura comem espaço). A tela cheia leva o celular para o <body>
// (Teleport, sem perder a aba em que ele está) e o estica na tela inteira; onde
// o navegador permite, também pede a Fullscreen API, que esconde a barra de
// endereço. No iPhone (sem a API para elementos) fica só a versão em CSS.
const cheia = ref(false)
const botaoAbrir = ref(null)
const botaoFechar = ref(null)

/**
 * O app foi desenhado para a largura de um celular (~430px). Num celular, a
 * tela cheia já é do tamanho certo. Numa tela maior (tablet, celular grande
 * deitado em pé num suporte, janela larga), esticar só a largura deixava uma
 * coluna estreita com metade da tela vazia; aqui o app inteiro é AMPLIADO na
 * proporção que preenche a tela, com `zoom`, sem mudar o desenho.
 */
const LARGURA_BASE = 430
const ALTURA_BASE = 900
const tela = ref({ w: 0, h: 0 })
const escala = computed(() =>
  Math.max(1, Math.min(tela.value.w / LARGURA_BASE, tela.value.h / ALTURA_BASE, 2)),
)
const estiloTela = computed(() => {
  if (!cheia.value || escala.value <= 1) return undefined
  return {
    zoom: escala.value,
    width: `${tela.value.w / escala.value}px`,
    height: `${tela.value.h / escala.value}px`,
  }
})

function medirTela() {
  tela.value = { w: window.innerWidth, h: window.innerHeight }
}

async function abrirTelaCheia() {
  // A Fullscreen API é pedida PRIMEIRO, ainda dentro do gesto do toque: depois
  // de um `await` alguns navegadores já não contam como gesto e recusam. Pede-se
  // a página inteira (e não o celular) porque o celular vai mudar de lugar no
  // DOM com o Teleport, e mover o elemento em tela cheia a encerraria.
  document.documentElement
    .requestFullscreen?.({ navigationUI: 'hide' })
    ?.catch(() => {
      // Recusado (iframe, permissão, iPhone): a tela cheia em CSS já vale.
    })
  medirTela()
  cheia.value = true
  document.documentElement.classList.add('sem-rolagem')
  await nextTick()
  botaoFechar.value?.focus()
}

async function fecharTelaCheia() {
  if (!cheia.value) return
  cheia.value = false
  document.documentElement.classList.remove('sem-rolagem')
  if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => {})
  await nextTick()
  botaoAbrir.value?.focus({ preventScroll: true })
}

/**
 * "VER EM 3D" da ficha: a seção 3D fica FORA do celular, na página. Em tela
 * cheia é preciso sair dela primeiro (e esperar o navegador devolver a página
 * ao tamanho normal), senão a rolagem acontece por trás do app e o visitante
 * não vê nada mudar.
 */
async function verEm3d(slug) {
  if (cheia.value) {
    await fecharTelaCheia()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise((r) => setTimeout(r, 120))
  }
  window.dispatchEvent(new CustomEvent('profdex:ver-3d', { detail: slug }))
}

/** Saiu da Fullscreen API pelo próprio navegador (Esc, gesto de voltar). */
function aoMudarFullscreen() {
  if (!document.fullscreenElement && cheia.value) fecharTelaCheia()
}

function aoTeclar(event) {
  if (event.key === 'Escape' && cheia.value) fecharTelaCheia()
}

/** A tela muda de tamanho ao entrar na Fullscreen API, ao girar o aparelho e
 *  quando a barra de endereço do celular some ou volta. */
function aoRedimensionar() {
  if (cheia.value) medirTela()
}

document.addEventListener('fullscreenchange', aoMudarFullscreen)
document.addEventListener('keydown', aoTeclar)
window.addEventListener('resize', aoRedimensionar)

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', aoMudarFullscreen)
  document.removeEventListener('keydown', aoTeclar)
  window.removeEventListener('resize', aoRedimensionar)
  document.documentElement.classList.remove('sem-rolagem')
})
</script>

<template>
  <button ref="botaoAbrir" type="button" class="fullscreen-open btn-pixel btn-pixel--block" @click="abrirTelaCheia">
    {{ appDemo.fullscreen.open }}
  </button>

  <Teleport to="body" :disabled="!cheia">
  <div
    class="phone"
    :class="{ 'phone--cheia': cheia }"
    :role="cheia ? 'dialog' : undefined"
    :aria-modal="cheia ? 'true' : undefined"
    :aria-label="cheia ? appDemo.fullscreen.label : undefined"
  >
    <div class="phone__screen" :style="estiloTela">
      <p class="phone__badge">{{ appDemo.badge }}</p>
      <button
        v-if="cheia"
        ref="botaoFechar"
        type="button"
        class="phone__close"
        :aria-label="appDemo.fullscreen.close"
        @click="fecharTelaCheia"
      >
        ✕
      </button>

      <div
        :id="`painel-${active}`"
        ref="screenEl"
        class="phone__view"
        role="tabpanel"
        :aria-labelledby="`aba-${active}`"
        tabindex="0"
      >
        <KeepAlive>
          <component :is="current.screen" :key="active" @navigate="goTo" @ver-3d="verEm3d" />
        </KeepAlive>
      </div>

      <nav class="tabbar" :aria-label="appDemo.navLabel">
        <div class="tabbar__list" role="tablist">
          <button
            v-for="(tab, i) in TABS"
            :id="`aba-${tab.id}`"
            :key="tab.id"
            :ref="(el) => (tabEls[i] = el)"
            type="button"
            role="tab"
            class="tabbar__item"
            :class="{ 'tabbar__item--on': active === tab.id, 'tabbar__item--face': tab.id === 'raid' }"
            :style="{ '--borda': tab.cor.borda, '--brilho': tab.cor.brilho, '--sombra': tab.cor.sombra }"
            :aria-selected="active === tab.id"
            :aria-controls="`painel-${tab.id}`"
            :tabindex="active === tab.id ? 0 : -1"
            @click="active = tab.id"
            @keydown="onKey($event, i)"
          >
            <img draggable="false" :src="tab.icon" alt="" width="34" height="34" decoding="async" />
            <span>{{ appDemo.tabs[tab.id] }}</span>
          </button>
        </div>
      </nav>
    </div>
  </div>
  </Teleport>
</template>

<style scoped>
/* A moldura é um aparelho genérico, sem marca: bisel escuro, cantos grandes e
   a tela do app dentro. No celular do visitante ela some quase toda — a página
   já é um celular, não precisa de outro desenhado em volta. */
.phone {
  width: min(100%, 400px);
  margin-inline: auto;
  padding: 10px;
  background: #0b0c0f;
  border: 2px solid var(--surface-border);
  border-radius: 36px;
  box-shadow:
    inset 0 0 0 2px #23252b,
    0 24px 48px rgb(0 0 0 / 45%);
}

/* Dentro do celular vale a tipografia do APP, não a da landing: corpo na fonte
   do sistema e a pixel só onde o app usa (títulos, rótulos, números). Sem
   isto, nomes e descrições herdariam a Press Start 2P da página. */
.phone__screen {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.45;
  letter-spacing: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  height: min(78svh, 760px);
  min-height: 520px;
  overflow: hidden;
  border-radius: 26px;
  background: var(--bg-deep);
}

.phone__badge {
  position: absolute;
  top: 8px;
  left: 50%;
  translate: -50% 0;
  z-index: 3;
  padding: 3px 8px;
  border-radius: 99px;
  background: rgb(0 0 0 / 70%);
  border: 1px solid color-mix(in srgb, var(--unifil-gold) 50%, transparent);
  font-family: var(--font-pixel);
  font-size: 7px;
  line-height: 1.6;
  letter-spacing: 0.5px;
  color: var(--unifil-gold);
  white-space: nowrap;
  pointer-events: none;
}

/* `container-type: size`: as telas medem a ALTURA disponível (cqh) para
   dimensionar palco e arena. Assim o mesmo layout aproveita a tela cheia de um
   celular alto e continua cabendo na moldura dentro da página. */
.phone__view {
  container: tela / size;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--surface-border) transparent;
}

.phone__view:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: -2px;
}

/* ── Barra inferior: os valores do BottomNav.vue do app ─────────────────── */
.tabbar {
  flex-shrink: 0;
  background: #1a1a1a;
  border-top: 3px solid #2b2b2b;
  padding: 10px;
}

.tabbar__list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.tabbar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 64px;
  padding: 8px 4px;
  border: 2px solid #2b2b2b;
  border-radius: 8px;
  color: var(--text-muted);
  font-family: var(--font-pixel);
  font-size: 7px;
  line-height: 1.4;
  white-space: nowrap;
  touch-action: manipulation;
  transition:
    border-color var(--dur-fast) var(--ease-pixel),
    translate var(--dur-fast) steps(1, end);
}

.tabbar__item img {
  width: auto;
  height: 34px;
  object-fit: contain;
  image-rendering: pixelated;
  opacity: 0.6;
}

/* A Raid usa o rosto do lendário, que é arte reduzida e não ícone pixel. */
.tabbar__item--face img {
  width: 34px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  image-rendering: auto;
  background: var(--bg-deep);
}

.tabbar__item:hover {
  color: var(--text-primary);
}

.tabbar__item:active {
  translate: 0 2px;
  filter: brightness(0.92);
}

.tabbar__item--on {
  color: var(--text-primary);
  border-color: var(--borda);
  box-shadow:
    inset 0 3px 0 var(--brilho),
    inset 0 -4px 0 var(--sombra);
}

.tabbar__item--on img {
  opacity: 1;
}

.tabbar__item:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 1px;
}

/* No celular a moldura vira um contorno fino: cada pixel de largura vai para o
   app. A altura deixa uma faixa da página à vista em cima, para o dedo ainda
   conseguir rolar a página por fora do simulador. */
@media (max-width: 480px) {
  .phone {
    padding: 3px;
    border-radius: 22px;
    box-shadow: inset 0 0 0 1px #23252b;
  }

  .phone__screen {
    border-radius: 18px;
    height: calc(100svh - var(--nav-h) - 48px);
    min-height: 480px;
    max-height: 760px;
  }
}

/* ── Botão de abrir a tela cheia: só onde ela faz diferença ──────────────── */
.fullscreen-open {
  display: none;
  margin: 0 auto var(--space-3);
  max-width: 400px;
}

@media (max-width: 900px), (pointer: coarse) {
  .fullscreen-open {
    display: flex;
  }
}

/* ── Tela cheia ─────────────────────────────────────────────────────────── */
.phone--cheia {
  position: fixed;
  inset: 0;
  z-index: 100;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: var(--bg-deep);
}

.phone--cheia .phone__screen {
  width: min(100%, 520px);
  height: 100dvh;
  min-height: 0;
  max-height: none;
  margin-inline: auto;
  border-radius: 0;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.phone--cheia .phone__badge {
  top: calc(8px + env(safe-area-inset-top, 0px));
}

.phone__close {
  position: absolute;
  top: calc(4px + env(safe-area-inset-top, 0px));
  left: 6px;
  z-index: 4;
  display: grid;
  place-items: center;
  /* 32px para caber na faixa da pílula, acima do título das telas; o ::before
     amplia a área de toque para 44px. */
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgb(0 0 0 / 70%);
  border: 1px solid color-mix(in srgb, var(--unifil-gold) 50%, transparent);
  color: var(--text-primary);
  font-size: 14px;
  touch-action: manipulation;
}

.phone__close::before {
  content: '';
  position: absolute;
  inset: -6px;
}

.phone__close:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 2px;
}
</style>
