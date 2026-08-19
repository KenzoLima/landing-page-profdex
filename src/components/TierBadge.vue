<script setup>
const props = defineProps({
  tier: { type: Object, required: true },
})

// "1500+" quando não há teto — o Mestre é aberto para cima.
const range = props.tier.max === null ? `${props.tier.min}+` : `${props.tier.min}–${props.tier.max}`
</script>

<template>
  <li class="tier">
    <span class="tier__icon" aria-hidden="true">{{ tier.icon }}</span>
    <span class="tier__name">{{ tier.name }}</span>
    <span class="tier__range">{{ range }}</span>
  </li>
</template>

<style scoped>
.tier {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-2);
  background: var(--bg-deep);
  border: 2px solid var(--surface-border);
  border-radius: var(--radius);
  text-align: center;
}

.tier__icon {
  font-size: 20px;
  line-height: 1;
}

.tier__name {
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--unifil-gold);
}

.tier__range {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
