<script setup>
import { computed } from 'vue'
import { getType } from '@/data/types.js'
import { professors as professorsCopy } from '@/content/copy.js'
import TypeBadge from '@/components/TypeBadge.vue'
import TypeIcon from '@/components/TypeIcon.vue'

// Duas faces do mesmo card: desbloqueado (retrato + nome + tipos) ou silhueta
// (só o tipo, sem nome). A silhueta é a leitura clássica de uma Pokédex
// incompleta: existe alguém ali, você ainda não capturou.
const props = defineProps({
  professor: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  // Variantes, como no app: rara (✦, dourada, revelada) e lendária (⚡,
  // borda arco-íris, sempre em silhueta até a raid).
  rarity: { type: String, default: '' }, // '' | 'rare' | 'legendary'
  index: { type: Number, default: 0 },
})

const primaryType = computed(() => getType(props.professor.types[0]))

// A silhueta ganha um leve tom do tipo — dá informação sem revelar o retrato.
const lockedStyle = computed(() => ({
  '--locked-tint': primaryType.value?.color ?? 'var(--surface-border)',
}))

// O card desbloqueado usa a mesma cor, e pela mesma razão: o palco atrás do
// sprite é a primeira coisa que diz de que tipo é aquele professor, antes de o
// olho chegar na badge. Sem este tom por baixo, os cards seriam a mesma peça
// com rostos diferentes.
const unlockedStyle = computed(() => ({
  '--type-tint': primaryType.value?.color ?? 'var(--surface-border)',
}))

const dexNumber = computed(() => String(props.index + 1).padStart(3, '0'))

// O atraso da cascata sai da posição na grade, que é o número da entrada — a
// Pokédex se preenche na ordem em que está numerada.
const revealDelay = computed(() => ({ '--reveal-i': props.index }))

const unknownLabel = professorsCopy.unknownLabel

/** O lendário leva ao simulador já na aba Raid, onde a luta é contada. */
function abrirRaid() {
  window.dispatchEvent(new CustomEvent('profdex:abrir-app', { detail: 'raid' }))
}
</script>

<template>
  <li
    v-if="!locked"
    class="card gba-frame gba-frame--plain"
    :class="rarity === 'rare' && 'card--rare-on'"
    :style="{ ...unlockedStyle, ...revealDelay }"
  >
    <p class="card__num">{{ rarity === 'rare' ? professorsCopy.rareLabel : `Nº ${dexNumber}` }}</p>
    <!-- O boneco de corpo inteiro: é a arte com que o aluno convive dentro do
         jogo. O arquivo tem 320×320 e aparece a ~170 px, então é REDUÇÃO — sem
         `pixelated`, que só serve para ampliar pixel art. -->
    <img draggable="false"
      class="card__art"
      :src="professor.sprite"
      :alt="`Boneco do professor ${professor.name}`"
      width="320"
      height="320"
      loading="lazy"
      decoding="async"
    />
    <div class="card__body">
      <h3 class="card__name">{{ professor.name }}</h3>
      <ul class="card__types">
        <li v-for="t in professor.types" :key="t"><TypeBadge :type-id="t" size="sm" /></li>
        <li v-if="!professor.types.length" class="card__type-unknown">{{ professorsCopy.unknownType }}</li>
      </ul>
    </div>
  </li>

  <li
    v-else
    class="card card--locked gba-frame gba-frame--plain"
    :class="rarity && `card--${rarity}`"
    :style="{ ...lockedStyle, ...revealDelay }"
  >
    <p class="card__num">{{ rarity === 'legendary' ? '⚡ Lendário' : rarity === 'rare' ? '✦ RARO' : `Nº ${dexNumber}` }}</p>
    <div class="card__silhouette" aria-hidden="true">
      <span v-if="rarity === 'legendary'" class="card__glyph">⚡</span>
      <TypeIcon v-else-if="primaryType" :type="primaryType.id" :size="56" />
    </div>
    <div class="card__body">
      <!-- O que falta numa entrada incompleta de Pokédex é o NOME, não o tipo:
           o tipo já está na badge logo abaixo e na cor da silhueta. Por isso o
           visível aqui é "???" — repetir o nome do tipo como título deixava o
           card dizendo a mesma coisa três vezes. O texto para leitor de tela
           continua completo. -->
      <p v-if="rarity === 'legendary'" class="card__legend-hint">{{ professorsCopy.legendaryHint }}</p>
      <h3 class="card__name card__name--locked">
        <span v-if="rarity === 'legendary'" class="sr-only">Lendário ainda não capturado</span>
        <span v-else class="sr-only"
          >{{ rarity === 'rare' ? 'Raro' : 'Professor' }} ainda não desbloqueado, do tipo
          {{ primaryType?.label }}</span
        >
        <span aria-hidden="true">{{ unknownLabel }}</span>
      </h3>
      <ul v-if="rarity !== 'legendary'" class="card__types">
        <li v-for="t in professor.types" :key="t"><TypeBadge :type-id="t" size="sm" /></li>
      </ul>
      <!-- O card inteiro é o alvo (o ::after do link cobre o card), mas quem
           recebe o foco e o nome acessível é o link. -->
      <a
        v-if="rarity === 'legendary'"
        class="card__raid"
        href="#simulador"
        :aria-label="professorsCopy.legendaryCtaLabel"
        @click="abrirRaid"
      >
        {{ professorsCopy.legendaryCta }}
      </a>
    </div>
  </li>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
  position: relative;
}

/* O card não é clicável — então o hover não promete clique, ele RESPONDE: o
   boneco dá um pulo de dois pixels, como um sprite parado que percebeu você.
   Um quadro só (`steps(1)`), que é o que um sprite de 8 bits faz. */
.card:hover .card__art {
  translate: 0 -2px;
}

.card__art {
  transition: translate var(--dur-fast) steps(1, end);
}

.card__num {
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--unifil-gold);
  font-variant-numeric: tabular-nums;
}

.card__art {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  /* `contain`, nunca `cover`: o boneco é corpo inteiro sobre transparência, e
   * `cover` cortaria os pés para preencher o quadrado. */
  object-fit: contain;
  /* Um respiro em volta para o boneco não encostar na borda do card — agora
   * um passo maior, porque os anéis do bisel comem 3px por lado. */
  padding: var(--space-3);
  /* Moldura Pokédex fina: prata biselada + fio dourado. Ver retro-tech.css
   * para por que o dourado aqui é fio de 1px e não faixa. */
  border: 2px solid var(--bg-deep);
  border-radius: var(--radius);
  box-shadow: var(--dex-bevel-sm);
  /* O palco atrás do boneco é a cor do TIPO. Ele aparece de verdade (o sprite é
   * transparente), então é a primeira coisa que diz de que tipo é o professor —
   * antes de o olho chegar na badge. É o mesmo tratamento do card travado, e é o
   * que separa 14 cards numa grade em vez de 14 retângulos iguais. */
  background: color-mix(in srgb, var(--type-tint) 22%, var(--bg-deep));
}

.card__silhouette {
  display: grid;
  place-items: center;
  gap: var(--space-2);
  aspect-ratio: 1;
  /* A travada mantém o tracejado e ganha só a prata escura — sem dourado. Na
   * Pokédex o metal só acende quando a entrada existe; uma silhueta emoldurada
   * em ouro contaria a história errada. */
  border: 2px dashed var(--surface-border);
  border-radius: var(--radius);
  box-shadow: var(--dex-bevel-locked);
  /* 12% da cor do tipo: o suficiente para diferenciar as silhuetas entre si,
   * longe do necessário para revelar quem é. */
  background: color-mix(in srgb, var(--locked-tint) 12%, var(--bg-deep));
  color: color-mix(in srgb, var(--locked-tint) 55%, var(--surface-border));
}

/* A silhueta respira em três degraus, bem devagar: é a entrada que ainda não
   foi capturada piscando no visor. O ciclo é longo (3,2s) e a variação é de
   opacidade, então catorze cards piscando juntos não viram ruído — e a fase é
   defasada pelo mesmo índice da cascata, para eles não pulsarem em bloco. */
.card__silhouette :deep(svg) {
  animation: silhouette-idle 3.2s steps(3, end) infinite alternate;
  animation-delay: calc(var(--reveal-i, 0) * -240ms);
}

@keyframes silhouette-idle {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 1;
  }
}

.card--locked:hover .card__silhouette {
  /* Passar o mouse não revela nada: só a prata pega mais luz. NADA de dourado
     aqui — o retro-tech.css registra a razão (na Pokédex o metal só acende
     quando a entrada existe), e um hover não é uma captura. */
  box-shadow:
    inset 1px 1px 0 var(--silver-hi),
    inset -1px -1px 0 var(--silver-lo);
}

.card__silhouette {
  transition: box-shadow var(--dur-fast) steps(2, end);
}

@media (prefers-reduced-motion: reduce) {
  .card__art {
    transition: none;
  }

  .card:hover .card__art {
    translate: none;
  }

  .card__silhouette {
    transition: none;
  }

  .card__silhouette :deep(svg) {
    animation: none;
    opacity: 1;
  }
}

.card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0 var(--space-1) var(--space-1);
}

.card__name {
  font-family: var(--font-pixel);
  font-size: 11px;
  color: var(--text-primary);
  line-height: 1.5;
}

.card__name--locked {
  color: var(--text-muted);
}

.card__types {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  list-style: none;
  min-width: 0;
}

.card__types > li {
  max-width: 100%;
}

.card__type-unknown {
  padding: 2px 6px;
  border: 1px dashed var(--surface-border);
  border-radius: var(--radius);
  font-family: var(--font-pixel);
  font-size: 9px;
  line-height: 1.7;
  color: var(--text-muted);
}

/* Raro revelado: o mesmo card, com o selo e a moldura da arte em dourado,
   como o card raro da Profdex do app. */
.card--rare-on .card__num {
  color: var(--raro, #f5c451);
}

.card--rare-on .card__art {
  border-color: var(--raro, #f5c451);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--raro, #f5c451) 35%, transparent);
}

.card__legend-hint {
  font-family: var(--font-pixel);
  font-size: 8px;
  line-height: 1.6;
  color: #ffd166;
}

/* O botão "VER RAID" do card lendário do app. */
.card__raid {
  align-self: center;
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  margin-top: var(--space-1);
  padding: 0 var(--space-3);
  border-radius: var(--radius);
  background: var(--unifil-gold);
  font-family: var(--font-pixel);
  font-size: 9px;
  color: #1a1a1a;
  text-decoration: none;
  touch-action: manipulation;
}

.card__raid::after {
  content: '';
  position: absolute;
  inset: 0;
}

.card__raid:hover {
  text-decoration: none;
  background: #ffd166;
}

.card__raid:focus-visible {
  outline: none;
}

.card--legendary:has(.card__raid:focus-visible) {
  outline: 3px solid var(--unifil-gold);
  outline-offset: 3px;
}

.card--legendary:has(.card__raid) {
  cursor: pointer;
}

/* Raro em silhueta (variante mantida para quem ainda não revelou). */
.card--rare .card__num {
  color: var(--raro, #f5c451);
}

.card--rare .card__silhouette {
  border-color: color-mix(in srgb, var(--raro, #f5c451) 70%, transparent);
}

/* Lendário: borda arco-íris que gira devagar, com as cores do app. */
.card--legendary .card__silhouette {
  border: 2px solid transparent;
  background:
    linear-gradient(var(--bg-deep), var(--bg-deep)) padding-box,
    conic-gradient(from var(--legend-angle, 0deg), #ffd166, #ef476f, #7b61ff, #06d6a0, #ffd166) border-box;
  animation: legend-spin 6s linear infinite;
}

.card--legendary .card__num {
  color: #ffd166;
}

.card__glyph {
  font-size: 48px;
  line-height: 1;
  color: #ffd166;
}

@property --legend-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@keyframes legend-spin {
  to {
    --legend-angle: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card--legendary .card__silhouette {
    animation: none;
  }
}
</style>
