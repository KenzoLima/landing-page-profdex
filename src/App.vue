<script setup>
import HeroSection from '@/sections/HeroSection.vue'
import BattleVideoSection from '@/sections/BattleVideoSection.vue'
import AppDemoSection from '@/sections/AppDemoSection.vue'
import HowItWorksSection from '@/sections/HowItWorksSection.vue'
import TypeWheelSection from '@/sections/TypeWheelSection.vue'
import BattleSection from '@/sections/BattleSection.vue'
import ModelSection from '@/sections/ModelSection.vue'
import PvpSection from '@/sections/PvpSection.vue'
import ScoreSection from '@/sections/ScoreSection.vue'
import ProfessorsSection from '@/sections/ProfessorsSection.vue'
import CreditsSection from '@/sections/CreditsSection.vue'
import SiteNav from '@/sections/SiteNav.vue'
import SiteFooter from '@/sections/SiteFooter.vue'
</script>

<template>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

  <!-- A barra fica FORA do <main>: é navegação da página inteira, não
       conteúdo dela. Vem antes do hero na ordem de leitura e de tabulação,
       logo depois do skip-link, que é exatamente onde quem usa teclado
       espera encontrar a navegação. -->
  <SiteNav />

  <HeroSection />

  <main id="conteudo">
    <!-- Os vídeos abrem a página (é para lá que o botão do hero leva). Depois, a
         história na sequência em que o aluno vive: como se joga, o sistema de
         tipos, a batalha e o 3D; então o simulador, onde o visitante toca nas
         telas do app de verdade; e por fim a competição, a coleção e os
         créditos, com o time, as fotos e os números do evento. -->
    <BattleVideoSection />
    <HowItWorksSection />
    <TypeWheelSection />
    <BattleSection />
    <ModelSection />
    <AppDemoSection />
    <PvpSection />
    <ScoreSection />
    <ProfessorsSection />
    <CreditsSection />
  </main>

  <SiteFooter />
</template>

<style scoped>
/* Link de pulo: invisível até receber foco pelo teclado. */
.skip-link {
  position: absolute;
  left: var(--space-3);
  top: -100px;
  z-index: 10;
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  border: 3px solid var(--unifil-gold);
  color: var(--text-primary);
  font-family: var(--font-pixel);
  font-size: 10px;
  transition: top var(--dur-fast) ease;
}

.skip-link:focus {
  top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
}
</style>
