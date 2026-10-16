<script setup>
import { pvp } from '@/content/copy.js'
import SectionShell from '@/components/SectionShell.vue'
import PvpRoteiro from '@/app-demo/pvp/PvpRoteiro.vue'

// O PvP contado por uma partida: as cinco cenas (lobby, desafio, times às
// cegas, turno, Elo) rodam nas telas do app, e o texto da seção é só o título
// e uma linha por cena. A escada de tiers acompanha o Elo da partida.
</script>

<template>
  <SectionShell :kicker="pvp.kicker" :title="pvp.title">
    <PvpRoteiro />
  </SectionShell>
</template>
