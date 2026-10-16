<script setup>
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { appDemo } from '@/content/copy.js'
import SectionShell from '@/components/SectionShell.vue'

// "Experimente o app": o celular simulado (src/app-demo/). Ele é um chunk à
// parte, montado só quando a seção chega perto da tela — quem nunca rola até
// aqui não paga o motor de batalha nem as telas.
const PhoneShell = defineAsyncComponent(() => import('@/app-demo/PhoneShell.vue'))

const host = ref(null)
const montar = ref(false)
const abaPedida = ref('')
let observer = null

/** Outras seções pedem uma aba (ex.: "Jogar no simulador" na seção Batalha). */
function onAbrir(event) {
  montar.value = true
  abaPedida.value = ''
  requestAnimationFrame(() => (abaPedida.value = event.detail))
}

onMounted(() => {
  window.addEventListener('profdex:abrir-app', onAbrir)
  if (typeof IntersectionObserver === 'undefined' || !host.value) {
    montar.value = true
    return
  }
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      montar.value = true
      observer.disconnect()
    },
    { rootMargin: '600px 0px' },
  )
  observer.observe(host.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('profdex:abrir-app', onAbrir)
  observer?.disconnect()
})
</script>

<template>
  <SectionShell id="simulador" :kicker="appDemo.kicker" :title="appDemo.title">
    <template #lede>{{ appDemo.desc }}</template>

    <div ref="host" class="demo">
      <div class="demo__phone">
        <PhoneShell v-if="montar" :requested-tab="abaPedida" />
        <div v-else class="demo__placeholder" aria-hidden="true" />
      </div>

      <ul class="demo__guide">
        <li v-for="item in appDemo.guide" :key="item.tab">
          <p class="demo__guide-title">{{ item.title }}</p>
          <p class="demo__guide-desc">{{ item.desc }}</p>
        </li>
        <li v-if="appDemo.note" class="demo__guide-note">{{ appDemo.note }}</li>
      </ul>
    </div>
  </SectionShell>
</template>

<style scoped>
.demo {
  display: grid;
  gap: var(--space-5);
  align-items: start;
}

@media (min-width: 900px) {
  .demo {
    grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
  }
}

.demo__placeholder {
  width: min(100%, 400px);
  height: min(78svh, 780px);
  min-height: 540px;
  margin-inline: auto;
  border-radius: 36px;
  background: #0b0c0f;
  border: 2px solid var(--surface-border);
}

.demo__guide {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.demo__guide li {
  padding-top: var(--space-2);
  border-top: 1px solid var(--surface-border);
}

.demo__guide-title {
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  line-height: 1.7;
  color: var(--unifil-gold);
}

.demo__guide-desc {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
  text-wrap: pretty;
}

.demo__guide-note {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
}
</style>
