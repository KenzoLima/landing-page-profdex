<script setup>
import { computed } from 'vue'
import { getType, legibleColor, typeMultiplier } from '@/data/types.js'
import TypeIcon from '@/components/TypeIcon.vue'

// Um golpe no formato do MoveButton do app: nome, categoria, tipo, POW/ACC e a
// dica de efetividade contra o alvo atual.
const props = defineProps({
  move: { type: Object, required: true },
  // Tipos do alvo — com eles aparece a dica "↑ SUPER" / "↓ FRACO".
  targetTypes: { type: Array, default: () => [] },
  // `button` na batalha; `div` (só leitura) na ficha do professor.
  as: { type: String, default: 'div' },
  disabled: { type: Boolean, default: false },
})

defineEmits(['pick'])

const CATEGORIA = {
  ataque: { glyph: '⚔', label: 'Ataque' },
  defesa: { glyph: '◆', label: 'Defesa' },
  buff: { glyph: '▲', label: 'Buff' },
  debuff: { glyph: '▼', label: 'Debuff' },
  status: { glyph: '◉', label: 'Status' },
  cura: { glyph: '✚', label: 'Cura' },
}

const tipo = computed(() => getType(props.move.type))
const cor = computed(() => (tipo.value ? legibleColor(tipo.value.color) : 'var(--unifil-gold)'))
const cat = computed(() => CATEGORIA[props.move.category] ?? { glyph: '·', label: props.move.category })

const dica = computed(() => {
  if (!props.move.power || !props.targetTypes.length) return ''
  // Sem as setas do app (↑ ↓): a Press Start 2P não tem esses glifos e os
  // desenha como vírgula. O multiplicador escrito diz o mesmo.
  const m = typeMultiplier(props.move.type, props.targetTypes)
  if (m >= 4) return 'SUPER x4'
  if (m >= 2) return 'SUPER x2'
  if (m <= 0.25) return 'FRACO x1/4'
  if (m <= 0.5) return 'FRACO x1/2'
  return ''
})
</script>

<template>
  <component
    :is="as"
    class="move"
    :class="{ 'move--btn': as === 'button' }"
    :type="as === 'button' ? 'button' : undefined"
    :disabled="as === 'button' ? disabled : undefined"
    :style="{ '--cor': cor }"
    :title="move.description"
    @click="as === 'button' && !disabled && $emit('pick', move)"
  >
    <span class="move__head">
      <span class="move__name">{{ move.name }}</span>
      <span class="move__cat" :title="cat.label" aria-hidden="true">{{ cat.glyph }}</span>
      <span class="sr-only">{{ cat.label }}</span>
    </span>
    <span class="move__meta">
      <span class="move__type">
        <TypeIcon v-if="tipo" :type="tipo.id" :size="10" />
        {{ tipo?.label }}
      </span>
      <span v-if="move.power" class="move__num">POW {{ move.power }}</span>
      <span class="move__num">ACC {{ Math.round(move.accuracy * 100) }}%</span>
    </span>
    <span v-if="dica" class="move__hint">{{ dica }}</span>
  </component>
</template>

<style scoped>
.move {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-height: 74px;
  padding: 8px;
  background: var(--surface);
  border: 2px solid color-mix(in srgb, var(--cor) 55%, var(--surface-border));
  border-radius: 6px;
  color: var(--text-primary);
  text-align: left;
  font: inherit;
}

.move--btn {
  cursor: pointer;
  touch-action: manipulation;
  transition:
    border-color var(--dur-fast) var(--ease-pixel),
    translate var(--dur-fast) steps(1, end);
}

.move--btn:hover:not(:disabled) {
  border-color: var(--cor);
  translate: 0 -1px;
}

.move--btn:focus-visible {
  outline: 2px solid var(--unifil-gold);
  outline-offset: 2px;
}

.move--btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.move__head {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.move__name {
  font-family: var(--font-pixel);
  font-size: 7px;
  line-height: 1.6;
  hyphens: auto;
  overflow-wrap: break-word;
  min-width: 0;
}

.move__cat {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1;
  color: var(--cor);
}

.move__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  font-size: 10px;
  line-height: 1.3;
  color: var(--text-muted);
}

.move__type {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--cor);
}

.move__num {
  font-variant-numeric: tabular-nums;
}

/* Tela do app baixa (celular pequeno, moldura dentro da página): o card fica
   mais compacto para os quatro golpes caberem sem rolar. */
@container tela (max-height: 560px) {
  .move {
    min-height: 60px;
    padding: 6px 8px;
    gap: 3px;
  }
}

.move__hint {
  font-family: var(--font-pixel);
  font-size: 6px;
  line-height: 1.6;
  color: var(--unifil-gold);
}
</style>
