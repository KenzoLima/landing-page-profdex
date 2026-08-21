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
  index: { type: Number, default: 0 },
})

const primaryType = computed(() => getType(props.professor.types[0]))

// A silhueta ganha um leve tom do tipo — dá informação sem revelar o retrato.
const lockedStyle = computed(() => ({
  '--locked-tint': primaryType.value?.color ?? 'var(--surface-border)',
}))

// O card desbloqueado usa a mesma cor, e pela mesma razão: o palco atrás do
// sprite é a primeira coisa que diz de que tipo é aquele professor, antes de o
// olho chegar na badge. Os sprites vêm do cartoon e todos têm o mesmo fundo azul
// claro — sem este tom por baixo, os três cards seriam a mesma peça com rostos
// diferentes.
const unlockedStyle = computed(() => ({
  '--type-tint': primaryType.value?.color ?? 'var(--surface-border)',
}))

const dexNumber = computed(() => String(props.index + 1).padStart(3, '0'))

const unknownLabel = professorsCopy.unknownLabel
</script>

<template>
  <li v-if="!locked" class="card gba-frame gba-frame--plain" :style="unlockedStyle">
    <p class="card__num">Nº {{ dexNumber }}</p>
    <!-- O boneco, e não o cartoon: é a arte com que o aluno vai conviver dentro
         do jogo, e a que faz um card de Pokédex parecer um card de Pokédex.
         64×64 subindo para ~170 px na tela — daí o `pixelated`, sem o qual o
         navegador borra a grade inteira. -->
    <img
      class="card__art pixelated"
      :src="professor.sprite"
      :alt="`Boneco do professor ${professor.name}`"
      width="64"
      height="64"
      loading="lazy"
      decoding="async"
    />
    <div class="card__body">
      <h3 class="card__name">{{ professor.name }}</h3>
      <ul class="card__types">
        <li v-for="t in professor.types" :key="t"><TypeBadge :type-id="t" size="sm" /></li>
      </ul>
      <p v-if="professor.isPlayerAvatar" class="card__note">
        Também é o boneco que você controla no treino.
      </p>
    </div>
  </li>

  <li v-else class="card card--locked gba-frame gba-frame--plain" :style="lockedStyle">
    <p class="card__num">Nº {{ dexNumber }}</p>
    <div class="card__silhouette" aria-hidden="true">
      <TypeIcon v-if="primaryType" :type="primaryType.id" :size="56" />
    </div>
    <div class="card__body">
      <!-- O que falta numa entrada incompleta de Pokédex é o NOME, não o tipo:
           o tipo já está na badge logo abaixo e na cor da silhueta. Por isso o
           visível aqui é "???" — repetir o nome do tipo como título deixava o
           card dizendo a mesma coisa três vezes. O texto para leitor de tela
           continua completo. -->
      <h3 class="card__name card__name--locked">
        <span class="sr-only"
          >Professor ainda não desbloqueado, do tipo {{ primaryType?.label }}</span
        >
        <span aria-hidden="true">{{ unknownLabel }}</span>
      </h3>
      <ul class="card__types">
        <li v-for="t in professor.types" :key="t"><TypeBadge :type-id="t" size="sm" /></li>
      </ul>
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
  /* Um respiro em volta para o boneco não encostar na borda do card. */
  padding: var(--space-2);
  border: 2px solid var(--surface-border);
  border-radius: var(--radius);
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
  border: 2px dashed var(--surface-border);
  border-radius: var(--radius);
  /* 12% da cor do tipo: o suficiente para diferenciar as silhuetas entre si,
   * longe do necessário para revelar quem é. */
  background: color-mix(in srgb, var(--locked-tint) 12%, var(--bg-deep));
  color: color-mix(in srgb, var(--locked-tint) 55%, var(--surface-border));
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
}

.card__note {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}
</style>
