<script setup>
import { howItWorks, quiz } from '@/content/copy.js'
import SectionShell from '@/components/SectionShell.vue'
import { useReveal } from '@/composables/useReveal.js'

const { el } = useReveal()

const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <SectionShell :kicker="howItWorks.kicker" :title="howItWorks.title" tone="frame">
    <ol class="steps">
      <li v-for="(step, i) in howItWorks.steps" :key="step.title" class="step">
        <span class="step-num" aria-hidden="true">{{ pad(i + 1) }}</span>
        <div class="step__body">
          <h3 class="step__title">{{ step.title }}</h3>
          <p class="step__desc">{{ step.desc }}</p>
        </div>
      </li>
    </ol>

    <!-- O quiz de bancada mora aqui e não numa seção própria: ele é o passo 2
         visto de perto, não uma funcionalidade separada. -->
    <aside ref="el" class="quiz gba-frame gba-frame--deep">
      <p class="section-kicker">{{ quiz.kicker }}</p>
      <h3 class="quiz__title">{{ quiz.title }}</h3>
      <p class="quiz__desc">{{ quiz.desc }}</p>

      <dl class="quiz__facts">
        <div v-for="fact in quiz.facts" :key="fact.label" class="quiz__fact">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>

      <p class="quiz__note">{{ quiz.note }}</p>
    </aside>
  </SectionShell>
</template>

<style scoped>
.steps {
  list-style: none;
  display: flex;
  flex-direction: column;
}

.step {
  display: flex;
  gap: var(--space-3);
  padding-block: var(--space-4);
  /* `2px dashed` é o separador da linguagem — mesmo da home do app. */
  border-bottom: 2px dashed var(--surface-border);
}

.step:first-child {
  padding-top: 0;
}

.step:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.step__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.step__title {
  font-family: var(--font-pixel);
  font-size: var(--fs-h3);
  line-height: 1.6;
}

.step__desc {
  color: var(--text-muted);
  font-size: var(--fs-body-sm);
  max-width: var(--maxw-prose);
}

.quiz {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.quiz__title {
  font-family: var(--font-pixel);
  font-size: var(--fs-h3);
  line-height: 1.6;
}

.quiz__desc {
  color: var(--text-muted);
  font-size: var(--fs-body-sm);
  max-width: var(--maxw-prose);
}

.quiz__facts {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

@media (min-width: 720px) {
  .quiz__facts {
    grid-template-columns: repeat(2, 1fr);
  }
}

.quiz__fact {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-left: var(--space-3);
  border-left: 3px solid var(--unifil-orange);
}

.quiz__fact dt {
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--unifil-gold);
  line-height: 1.6;
}

.quiz__fact dd {
  font-size: var(--fs-body-sm);
  color: var(--text-primary);
}

.quiz__note {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
  font-style: italic;
}
</style>
