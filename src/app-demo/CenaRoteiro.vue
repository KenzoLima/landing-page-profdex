<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import RodaDaSorte from './RodaDaSorte.vue'

// A encenação de um momento da raid, como o RoteiroOverlay + AtorDoRoteiro do
// app: o personagem entra andando, a roda (se houver) gira só depois disso,
// para, recua, e então o chefe se transforma (cresce em saltos, troca de arte no
// pico e cai maior). Montar de novo (com outra :key) recomeça a cena.
const props = defineProps({
  // `{ sprites: string[], spriteDepois?: string }`
  ator: { type: Object, required: true },
  // `{ kind, opcoes, resultado, pesos? }`, o mesmo contrato da RodaDaSorte.
  roda: { type: Object, default: null },
})

/** Tempos do app (AtorDoRoteiro.vue e RoteiroOverlay.vue). */
const ANDAR_MS = 880
const ATRASO_MS = 110
const PAUSA_MS = 620
const CRESCER_MS = 820
const CAIR_MS = 520

const fase = ref('entrando') // entrando | roda | crescendo | caindo | pronto
const atorChegou = ref(false)
const rodaRecuada = ref(false)
const arte = ref(0)
let timers = []

const reduzido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
const agendar = (fn, ms) => timers.push(setTimeout(fn, ms))

const sprites = computed(() => props.ator.sprites ?? [])
/** Três ou mais sem roda (o NDE): duas fileiras escalonadas em vez de uma. */
const grupo = computed(() => sprites.value.length > 2 && !props.roda)
const spriteAtual = (i) => (arte.value === 1 && props.ator.spriteDepois ? props.ator.spriteDepois : sprites.value[i])

function transformar() {
  if (!props.ator.spriteDepois) {
    fase.value = 'pronto'
    return
  }
  if (reduzido()) {
    arte.value = 1
    fase.value = 'pronto'
    return
  }
  fase.value = 'crescendo'
  agendar(() => {
    arte.value = 1
    fase.value = 'caindo'
    agendar(() => (fase.value = 'pronto'), CAIR_MS)
  }, CRESCER_MS)
}

function aoPararARoda() {
  agendar(() => {
    rodaRecuada.value = true
    transformar()
  }, reduzido() ? 0 : PAUSA_MS)
}

onMounted(() => {
  const ms = reduzido() ? 0 : ANDAR_MS + ATRASO_MS * (sprites.value.length - 1)
  agendar(() => {
    atorChegou.value = true
    if (props.roda) fase.value = 'roda'
    else transformar()
  }, ms)
})

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="cena-rot">
    <RodaDaSorte
      v-if="roda"
      v-bind="roda"
      :iniciar="atorChegou"
      class="cena-rot__roda"
      :class="{ 'cena-rot__roda--recuada': rodaRecuada }"
      @fim="aoPararARoda"
    />

    <div
      class="ator"
      :class="[`ator--${fase}`, { 'ator--transformado': arte === 1, 'ator--grupo': grupo }]"
      :style="{ '--quantos': sprites.length }"
    >
      <img draggable="false"
        v-for="(src, i) in sprites"
        :key="i"
        class="ator__sprite"
        :src="spriteAtual(i)"
        :style="{ '--i': i }"
        alt=""
        width="320"
        height="320"
      />
      <span class="ator__clarao" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
/* Roda e personagem LADO A LADO: empilhados (como no overlay do app, que tem
   a tela inteira) eles não cabem no celular junto com a caixa de fala. A roda
   fica à esquerda, o personagem à direita, os dois apoiados no chão. */
.cena-rot {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: space-around;
  gap: 6px;
  min-height: 0;
}

/* A roda do app tem raio de até 104px; dentro do celular simulado ela fica um
   pouco menor para a cena inteira caber sem rolar. */
/* O raio acompanha a tela do app (cqh/cqw, ver PhoneShell): ~66px na moldura
   da página, até 96px em tela cheia, sem passar de um quarto da largura. */
.cena-rot__roda :deep(.roda__disco) {
  --raio: min(clamp(64px, 11cqh, 96px), 22cqw);
}

.cena-rot__roda {
  flex-shrink: 0;
  align-self: center;
  max-width: 50%;
}

.cena-rot__roda {
  transition:
    transform 600ms var(--ease-out),
    opacity 600ms var(--ease-out);
}

/* O app recua a roda para 42%, mas lá o fundo é quase preto; sobre a foto do
   ginásio 42% some, então aqui ela recua menos. */
.cena-rot__roda--recuada {
  transform: scale(0.72);
  opacity: 0.75;
}

/* Disco e resultado ganham fundo próprio: sobre a foto, o desenho do app
   (pensado para o fundo escuro do overlay) perdia contraste. */
.cena-rot__roda :deep(.roda__disco) {
  box-shadow:
    var(--dex-bevel),
    0 0 0 6px rgb(8 9 11 / 55%);
}

/* Tela do app baixa: roda menor e nós de 28px (com 34px, nove nós num raio
   de 58px se encostariam). */
@container tela (max-height: 560px) {
  .cena-rot__roda {
    gap: 8px;
  }

  .cena-rot__roda :deep(.roda__disco) {
    --raio: 58px;
  }

  .cena-rot__roda :deep(.roda__no) {
    width: 28px;
    height: 28px;
    margin: -14px 0 0 -14px;
  }

  .ator {
    height: 150px;
  }
}

.cena-rot__roda :deep(.roda__resultado) {
  padding: 3px 10px;
  border-radius: 99px;
  background: rgb(8 9 11 / 80%);
  /* Do tamanho do disco: um nome de buff comprido ("Gabarito Vazado") não pode
     alargar a coluna da roda e espremer o personagem ao lado. */
  max-width: calc(var(--raio, 72px) * 2.1);
  font-size: 9px;
}

.ator {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  flex: 1;
  min-width: 0;
  height: 180px;
  height: clamp(160px, 28cqh, 260px);
}

.ator__sprite {
  height: 100%;
  width: auto;
  max-width: calc((100% - 6px) / var(--quantos, 1));
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(0 3px 0 rgb(0 0 0 / 50%));
  transform-origin: bottom center;
}

.ator--entrando .ator__sprite {
  animation: entraAndando 880ms steps(1, end) both;
  animation-delay: calc(var(--i) * 110ms);
}

.ator--crescendo .ator__sprite {
  animation: cresceEmSaltos 820ms steps(1, end) forwards;
}

.ator--caindo .ator__sprite {
  animation: caiMaior 520ms var(--ease-out) forwards;
}

/* Quem se transformou fica maior; quem só entrou fica no tamanho normal. */
.ator--pronto .ator__sprite {
  animation: none;
}

.ator--pronto.ator--transformado .ator__sprite {
  transform: scale(1.3);
}

/* O NDE em duas fileiras: numa linha só, quatro bonecos dividem a largura e
   ficam com ~75px cada. Em duas, cada um tem metade da largura; a fileira de
   trás fica um pouco menor e a da frente sobe sobre ela, como um grupo posado. */
.ator--grupo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: end;
  justify-items: center;
  height: auto;
  align-self: stretch;
}

.ator--grupo .ator__sprite {
  width: 100%;
  max-width: none;
  height: auto;
  aspect-ratio: 1;
}

.ator--grupo .ator__sprite:nth-child(-n + 2) {
  scale: 0.86;
  translate: 0 8%;
}

.ator--grupo .ator__sprite:nth-child(n + 3) {
  position: relative;
  z-index: 1;
  margin-top: -24%;
}

.ator__clarao {
  position: absolute;
  inset: -12% -6%;
  background: radial-gradient(circle, rgb(255 107 107 / 85%) 0%, transparent 70%);
  opacity: 0;
  pointer-events: none;
}

.ator--crescendo .ator__clarao,
.ator--caindo .ator__clarao {
  animation: claraoPulsa 820ms steps(1, end);
}

@keyframes entraAndando {
  0% { opacity: 0; transform: translate(140px, 0); }
  12% { opacity: 1; transform: translate(120px, -4px); }
  25% { transform: translate(100px, 0); }
  37% { transform: translate(80px, -4px); }
  50% { transform: translate(60px, 0); }
  62% { transform: translate(40px, -4px); }
  75% { transform: translate(20px, 0); }
  87% { transform: translate(0, -4px); }
  100% { opacity: 1; transform: translate(0, 0); }
}

@keyframes cresceEmSaltos {
  0% { transform: scale(1); }
  33% { transform: scale(1.12) translateY(-3px); }
  66% { transform: scale(1.26) translateY(-7px); }
  100% { transform: scale(1.42) translateY(-10px); }
}

@keyframes caiMaior {
  0% { transform: scale(1.42) translateY(-10px); }
  55% { transform: scale(1.3) translateY(0); }
  72% { transform: scale(1.34) translateY(-3px); }
  100% { transform: scale(1.3) translateY(0); }
}

@keyframes claraoPulsa {
  0% { opacity: 0; }
  33% { opacity: 0.5; }
  66% { opacity: 0.85; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ator__sprite,
  .ator__clarao {
    animation: none !important;
  }

  .cena-rot__roda {
    transition: none;
  }
}
</style>
