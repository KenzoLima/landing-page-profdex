<script setup>
import { professors } from '@/content/copy.js'
import { CAPTURABLE, LEGENDARY, RARES } from '@/data/professors.js'
import SectionShell from '@/components/SectionShell.vue'
import ProfessorCard from '@/components/ProfessorCard.vue'
import { useReveal } from '@/composables/useReveal.js'

// A grade entra card a card, na ordem da Pokédex: é a leitura de uma coleção
// sendo preenchida, e é o argumento inteiro da seção.
const { el } = useReveal({ threshold: 0.1 })
const { el: raresEl } = useReveal({ threshold: 0.1 })

// Os regulares e os raros aparecem revelados; só o lendário fica em silhueta
// ("⚡ ???"), porque ele é o segredo da raid.
</script>

<template>
  <SectionShell :kicker="professors.kicker" :title="professors.title">
    <template #lede>{{ professors.desc }}</template>

    <ul ref="el" class="grid reveal-stagger">
      <ProfessorCard
        v-for="(prof, i) in CAPTURABLE"
        :key="prof.slug"
        :professor="prof"
        :index="i"
      />
    </ul>

    <h3 class="grid__title">{{ professors.raresTitle }}</h3>
    <p class="grid__hint">{{ professors.raresHint }}</p>
    <ul ref="raresEl" class="grid reveal-stagger">
      <ProfessorCard
        v-for="(prof, i) in RARES"
        :key="prof.slug"
        :professor="prof"
        :index="i"
        rarity="rare"
      />
      <ProfessorCard :professor="LEGENDARY" :index="RARES.length" locked rarity="legendary" />
    </ul>
  </SectionShell>
</template>

<style scoped>
.grid {
  display: grid;
  gap: var(--space-3);
  list-style: none;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.grid__title {
  margin-top: var(--space-4);
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  line-height: 1.7;
  color: var(--raro, #f5c451);
}

.grid__hint {
  margin-top: calc(-1 * var(--space-2));
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
  max-width: var(--maxw-prose);
}
</style>
