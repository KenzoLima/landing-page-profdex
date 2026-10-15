<script setup>
import { asset } from '@/config/asset.js'

// O cabeçalho das telas do app (profdex-front/src/components/AppHeader.vue):
// degradê do cinza para o laranja da marca, subtítulo dourado acima do título
// em pixel e o logotipo branco da UNIFIL à direita.
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <header class="app-header">
    <div class="app-header__lead"><slot name="lead" /></div>
    <div class="app-header__text">
      <p v-if="subtitle" class="app-header__subtitle">{{ subtitle }}</p>
      <h3 class="app-header__title">{{ title }}</h3>
    </div>
    <img draggable="false" class="app-header__logo" :src="asset('/app/logotipo-branco.png')" alt="UniFil" width="68" height="13" />
  </header>
</template>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: minmax(0, auto) 1fr minmax(68px, auto);
  align-items: center;
  gap: 8px;
  min-height: 84px;
  padding: 40px 16px 14px;
  background: linear-gradient(160deg, #2b2b2b 0%, var(--unifil-orange) 100%);
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 10px rgb(0 0 0 / 35%);
}

.app-header__subtitle {
  font-family: var(--font-pixel);
  font-size: 7px;
  line-height: 1.6;
  letter-spacing: 1px;
  color: var(--unifil-gold);
}

.app-header__title {
  margin-top: 4px;
  font-family: var(--font-pixel);
  font-size: 17px;
  line-height: 1.3;
  color: var(--text-primary);
  text-shadow: 2px 2px 0 rgb(0 0 0 / 35%);
}

.app-header__logo {
  justify-self: end;
  width: 68px;
  height: auto;
}
</style>
