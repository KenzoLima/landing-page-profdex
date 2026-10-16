<script setup>
import { computed } from 'vue'
import { asset } from '@/config/asset.js'
import AppHeader from '../AppHeader.vue'
import PixelIcon from '@/components/PixelIcon.vue'
import { CHEGOU, LOBBY, OUTRO_DESAFIO, RIVAL, T, restam } from './roteiro.js'

// As cenas "Lobby" e "Desafio", numa tela só, como no app: a lista de
// jogadores online (o modal da BatalhaView) e, por cima dela, a pilha de
// desafios recebidos (ConvitePilha.vue), que no app aparece em qualquer tela.
// Tudo deriva de `t`, o tempo da cena: a mesma `t` sempre dá o mesmo quadro,
// e é isso que deixa pausar, pular de cena e mostrar o quadro parado.
const props = defineProps({
  t: { type: Number, required: true },
})

const tl = T.lobby
const depois = (ms) => props.t >= ms

const linhas = computed(() => {
  const base = LOBBY.map((j, i) => ({ ...j, desde: tl.linhas + i * tl.linhaPasso }))
  if (depois(tl.chegou)) base.splice(1, 0, { name: CHEGOU, ocupado: false, desde: tl.chegou, novo: true })
  return base.filter((j) => depois(j.desde))
})
// 13 online antes da Fernanda, 14 depois; "você" não entra na conta, como no app.
const online = computed(() => (depois(tl.chegou) ? 14 : 13))

// ── Pilha de desafios ──────────────────────────────────────────────────────
// Some de vez quando a saída termina (na pausa, sem a animação, ela voltaria).
const temDesafio = computed(() => depois(tl.desafio) && !depois(tl.sai + 300))
const doisDesafios = computed(() => depois(tl.outroDesafio))
// Desafio novo com a pilha aberta: a moldura dá um tranco curto (360ms).
const chegouNovo = computed(() => depois(tl.outroDesafio) && !depois(tl.outroDesafio + 400))
const segundos = computed(() => restam(props.t, tl.desafio))
const apertando = computed(() => depois(tl.aceitar) && !depois(tl.entrando + 200))
const entrando = computed(() => depois(tl.entrando))
const saindo = computed(() => depois(tl.sai))
</script>

<template>
  <div class="lobby">
    <AppHeader title="BATALHA" subtitle="Área de batalha" />

    <div class="lobby__main">
      <div class="opcao">
        <span class="opcao__icone"><span class="ponto" /></span>
        <span class="opcao__texto">
          <span class="opcao__rotulo">Jogadores online</span>
          <span class="opcao__sub">{{ online }} jogadores disponíveis</span>
        </span>
      </div>
    </div>

    <!-- O modal de jogadores online, que sobe da base da tela. -->
    <div class="modal" :class="{ 'modal--aberto': depois(tl.lista) }">
      <div class="painel">
        <div class="painel__topo">
          <span class="painel__titulo">JOGADORES ONLINE ({{ online }})</span>
          <span class="painel__fechar"><PixelIcon nome="fechar" :escala="1" /></span>
        </div>
        <span class="painel__busca">Buscar por nome…</span>
        <ul class="painel__lista">
          <li v-for="j in linhas" :key="j.name" class="jogador" :class="{ 'jogador--novo': j.novo }">
            <span class="jogador__nome">{{ j.name }}</span>
            <span v-if="j.ocupado" class="jogador__status">EM BATALHA</span>
            <span v-else class="jogador__desafiar">DESAFIAR</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- A pilha: uma carta por vez (a que expira primeiro) e as outras atrás. -->
    <section
      v-if="temDesafio"
      class="pilha"
      :class="{ 'pilha--chegou': chegouNovo, 'pilha--aceita': saindo }"
    >
      <span v-if="doisDesafios" class="pilha__fundo" />
      <div class="gba-frame carta">
        <div class="carta__topo">
          <img class="carta__espadas" :src="asset('/app/batalha.png')" width="40" height="28" alt="" draggable="false" />
          <span class="carta__titulo">{{ doisDesafios ? 'DESAFIOS (2)' : 'DESAFIO!' }}</span>
          <span v-if="doisDesafios" class="carta__mais">+1 <PixelIcon nome="seta-baixo" :escala="1" /></span>
          <span class="carta__icone"><PixelIcon nome="minimizar" :escala="2" /></span>
        </div>
        <div class="carta__corpo">
          <p class="carta__quem">
            <strong>{{ RIVAL }}</strong>
            <span>quer batalhar com você</span>
          </p>
          <div class="tempo" :class="{ 'tempo--urgente': segundos <= 10 }">
            <span class="tempo__trilho">
              <span class="tempo__barra" :style="{ transform: `scaleX(${segundos / 60})` }" />
            </span>
            <span class="tempo__seg">{{ segundos }}s</span>
          </div>
          <div class="carta__acoes">
            <span class="btn-pixel carta__aceitar" :class="{ toque: apertando }">
              {{ entrando ? 'ENTRANDO…' : 'ACEITAR' }}
            </span>
            <span class="btn-pixel btn-pixel--ghost">RECUSAR</span>
          </div>
        </div>
      </div>
      <span v-if="doisDesafios" class="sr-only">{{ OUTRO_DESAFIO }} também desafiou</span>
    </section>
  </div>
</template>

<style scoped>
.lobby {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--bg-deep);
}

.lobby__main {
  padding: 16px;
}

/* O botão "Jogadores online" da BatalhaView: borda verde e a bolinha acesa. */
.opcao {
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: 14px;
  min-height: 76px;
  padding: 12px 16px;
  border: 2px solid var(--ds-green);
  border-radius: 16px;
  background: var(--surface);
}

.opcao__icone {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 2px solid var(--surface-border);
  border-radius: 50%;
  background: var(--surface);
}

.ponto {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ds-green);
  box-shadow: 0 0 6px var(--ds-green);
}

.opcao__texto {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.opcao__rotulo {
  font-family: var(--font-pixel);
  font-size: 10px;
  line-height: 1.5;
}

.opcao__sub {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* ── Modal (bottom sheet) ─────────────────────────────────────────────── */
.modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: rgb(0 0 0 / 0%);
  transition: background-color var(--dur-base) steps(3, end);
}

.modal--aberto {
  background: rgb(0 0 0 / 65%);
}

.painel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 74%;
  padding: 16px 16px 18px;
  border: 2px solid var(--surface-border);
  border-bottom: 0;
  border-radius: 16px 16px 0 0;
  background: var(--surface);
  transform: translateY(100%);
  transition: transform var(--dur-base) var(--ease-pixel);
}

.modal--aberto .painel {
  transform: none;
}

.painel__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.painel__titulo {
  font-family: var(--font-pixel);
  font-size: 9px;
  line-height: 1.5;
  color: var(--unifil-gold);
  font-variant-numeric: tabular-nums;
}

.painel__fechar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  color: var(--text-primary);
}

.painel__busca {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 14px;
}

.painel__lista {
  display: grid;
  gap: 8px;
  list-style: none;
}

.jogador {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background: var(--surface);
  animation: entra var(--dur-base) steps(3, end) both;
}

/* Quem acabou de ficar online chega acendendo a borda, que é como o olho
   percebe que a lista mudou sozinha. */
.jogador--novo {
  animation:
    entra var(--dur-base) steps(3, end) both,
    acende 1.2s steps(2, end) 2;
}

.jogador__nome {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jogador__status {
  flex-shrink: 0;
  font-family: var(--font-pixel);
  font-size: 7px;
  color: var(--unifil-gold);
}

.jogador__desafiar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--unifil-gold);
  border-radius: 8px;
  background: var(--surface-border);
  font-family: var(--font-pixel);
  font-size: 8px;
  color: var(--text-primary);
}

/* ── Pilha de desafios (ConvitePilha.vue) ─────────────────────────────── */
.pilha {
  position: absolute;
  top: 34px;
  right: 10px;
  left: 10px;
  z-index: 3;
  animation: desce var(--dur-base) var(--ease-pixel) both;
}

/* A carta de trás: mesma moldura, mais escura, deslocada e um pouco menor. */
.pilha__fundo {
  position: absolute;
  inset: 0;
  border: 4px solid var(--unifil-orange);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 6px 12px rgb(0 0 0 / 40%);
  transform: translateY(9px) scaleX(0.95);
  filter: brightness(0.75);
  animation: desce var(--dur-base) var(--ease-pixel) both;
}

.carta {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 14px;
  box-shadow:
    inset 0 0 0 2px var(--unifil-gold),
    inset 0 0 0 4px var(--surface),
    0 10px 24px rgb(0 0 0 / 50%);
}

.pilha--chegou .carta {
  animation: tranco 360ms steps(6, end);
}

.carta__topo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.carta__espadas {
  width: auto;
  height: 28px;
  image-rendering: pixelated;
}

.carta__titulo {
  flex: 1;
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--unifil-gold);
}

.carta__mais {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 10px;
  border: 2px solid var(--surface-border);
  border-radius: 4px;
  background: var(--bg-deep);
  font-family: var(--font-pixel);
  font-size: 8px;
  color: var(--unifil-gold);
}

.carta__icone {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--text-muted);
}

.carta__corpo {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.carta__quem {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--text-muted);
}

.carta__quem strong {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--text-primary);
}

/* A barra esvazia em saltos de 1s, como a de HP; vermelha nos últimos 10s. */
.tempo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tempo__trilho {
  flex: 1;
  height: 8px;
  overflow: hidden;
  border: 2px solid var(--bg-deep);
  background: var(--surface-border);
}

.tempo__barra {
  display: block;
  height: 100%;
  background: var(--unifil-gold);
  transform-origin: left;
  transition: transform 1s steps(4, end);
}

.tempo__seg {
  min-width: 4ch;
  font-family: var(--font-pixel);
  font-size: 8px;
  color: var(--text-muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.tempo--urgente .tempo__barra {
  background: var(--error);
}

.carta__acoes {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 8px;
}

.carta__acoes .btn-pixel {
  min-height: 44px;
  padding: 0 8px;
  font-size: 9px;
}

/* Aceitou: a carta acende e sobe, e a pilha inteira sai junto (no app, o
   início da batalha limpa a pilha e leva à seleção de time). */
.pilha--aceita {
  animation: sai var(--dur-base) steps(3, end) forwards;
}

.pilha--aceita .carta {
  animation: acendeESobe var(--dur-base) var(--ease-pixel) forwards;
}

@keyframes desce {
  from {
    transform: translateY(-120%);
    opacity: 0;
  }
}

@keyframes tranco {
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
}

@keyframes acendeESobe {
  to {
    transform: translateY(-10px) scale(1.04);
    filter: brightness(1.6);
  }
}

@keyframes sai {
  to { opacity: 0; }
}

@keyframes entra {
  from {
    transform: translateY(6px);
    opacity: 0;
  }
}

@keyframes acende {
  50% { border-color: var(--ds-green); }
}
</style>
