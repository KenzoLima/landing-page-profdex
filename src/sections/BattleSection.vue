<script setup>
import { battle } from '@/content/copy.js'
import { CAPTURABLE } from '@/data/professors.js'
import SectionShell from '@/components/SectionShell.vue'
import TypeBadge from '@/components/TypeBadge.vue'
import { useReveal } from '@/composables/useReveal.js'

// Enquadramento clássico: adversário em cima à direita, o seu em baixo à
// esquerda, cada um com sua barra de HP do lado oposto.
//
// Nota sobre a arte: os arquivos `-cartoon` são cards quadrados com fundo
// branco e moldura de QR — não são recortes de personagem com fundo
// transparente. Colocá-los "de pé" num palco ficaria errado; emoldurados como
// retrato de combatente, funcionam e ainda respeitam a arte original.
const enemy = CAPTURABLE.find((p) => p.slug === 'mario')
const player = CAPTURABLE.find((p) => p.slug === 'gustavo')

// A barra do adversário desce quando a seção entra na tela. É CSS puro
// (transition de width com steps): não vale carregar uma engine de animação
// para drenar uma barra.
const { el } = useReveal({ threshold: 0.4 })
</script>

<template>
  <SectionShell :kicker="battle.kicker" :title="battle.title">
    <template #lede>{{ battle.desc }}</template>

    <div ref="el" class="arena gba-frame">
      <div class="arena__row arena__row--enemy">
        <div class="hp">
          <p class="hp__name">{{ enemy.name }}</p>
          <div class="hp__track" role="img" :aria-label="`Adversário ${enemy.name} com 42% de HP`">
            <span class="hp__fill hp__fill--enemy" />
          </div>
          <ul class="hp__types">
            <li v-for="t in enemy.types" :key="t"><TypeBadge :type-id="t" size="sm" /></li>
          </ul>
        </div>
        <figure class="fighter fighter--enemy">
          <picture>
            <source :srcset="enemy.image" type="image/webp" />
            <img
              :src="enemy.fallback"
              :alt="`Professor ${enemy.name}, o adversário`"
              width="512"
              height="512"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </figure>
      </div>

      <hr class="rule-dashed" />

      <div class="arena__row arena__row--player">
        <figure class="fighter fighter--player">
          <picture>
            <source :srcset="player.image" type="image/webp" />
            <img
              :src="player.fallback"
              :alt="`Professor ${player.name}, o seu combatente`"
              width="512"
              height="512"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </figure>
        <div class="hp hp--player">
          <p class="hp__name">{{ player.name }}</p>
          <div class="hp__track" role="img" :aria-label="`${player.name} com 88% de HP`">
            <span class="hp__fill hp__fill--player" />
          </div>
          <ul class="hp__types">
            <li v-for="t in player.types" :key="t"><TypeBadge :type-id="t" size="sm" /></li>
          </ul>
        </div>
      </div>

      <dl class="stats">
        <div v-for="stat in battle.stats" :key="stat.label" class="stats__item">
          <dt>{{ stat.label }}</dt>
          <dd>{{ stat.hint }}</dd>
        </div>
      </dl>
    </div>

    <div class="moves">
      <div class="moves__block gba-frame gba-frame--plain">
        <h3 class="moves__title">Categorias de golpe</h3>
        <ul class="moves__tags">
          <li v-for="c in battle.moveCategories" :key="c" class="tag">{{ c }}</li>
        </ul>
      </div>

      <div class="moves__block gba-frame gba-frame--plain">
        <h3 class="moves__title">Efeitos de status</h3>
        <ul class="moves__tags">
          <li v-for="e in battle.effects" :key="e" class="tag tag--muted">{{ e }}</li>
        </ul>
        <p class="moves__note">{{ battle.effectsNote }}</p>
      </div>
    </div>

    <p class="training">{{ battle.training }}</p>
  </SectionShell>
</template>

<style scoped>
.arena {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.arena__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.arena__row--enemy {
  flex-direction: row;
}

.arena__row--player {
  flex-direction: row;
}

.fighter {
  flex-shrink: 0;
  width: clamp(96px, 26vw, 168px);
}

.fighter img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 3px solid var(--surface-border);
  border-radius: var(--radius);
}

/* O adversário fica espelhado, como se estivesse virado para o jogador — é o
   que o enquadramento clássico faz com o sprite de costas. */
.fighter--enemy img {
  transform: scaleX(-1);
  border-color: var(--error);
}

.fighter--player img {
  border-color: var(--ds-blue);
}

.hp {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  /* Sem teto, numa tela de 1920px a barra de HP esticava por ~800px e o
     enquadramento deixava de parecer uma tela de batalha. */
  max-width: 420px;
}

.hp--player {
  margin-left: auto;
}

.hp--player {
  align-items: flex-end;
  text-align: right;
}

.hp__name {
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  line-height: 1.6;
}

.hp__track {
  width: 100%;
  height: 14px;
  background: var(--bg-deep);
  border: 2px solid var(--surface-border);
  border-radius: 2px;
  overflow: hidden;
}

.hp__fill {
  display: block;
  height: 100%;
  width: 100%;
  /* `steps()` faz a barra descer aos pulos, como numa tela de 8 bits, em vez de
     deslizar suavemente. */
  transition: width 1.2s var(--ease-pixel);
}

.hp__fill--enemy {
  background: var(--error);
}

.hp__fill--player {
  background: var(--success-text);
}

/* O drenar só acontece quando a seção aparece — antes disso as barras ficam
   cheias, que é o estado correto para quem tem movimento reduzido. */
[data-reveal='shown'] .hp__fill--enemy {
  width: 42%;
}

[data-reveal='shown'] .hp__fill--player {
  width: 88%;
}

.hp__types {
  display: flex;
  gap: var(--space-1);
  list-style: none;
  flex-wrap: wrap;
}

.hp--player .hp__types {
  justify-content: flex-end;
}

.stats {
  display: grid;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 2px dashed var(--surface-border);
}

@media (min-width: 620px) {
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stats__item dt {
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--unifil-gold);
  line-height: 1.6;
  margin-bottom: var(--space-1);
}

.stats__item dd {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
}

.moves {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

@media (min-width: 720px) {
  .moves {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  }
}

.moves__block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.moves__title {
  font-family: var(--font-pixel);
  font-size: var(--fs-h3);
  color: var(--unifil-gold);
  line-height: 1.6;
}

.moves__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
}

.tag {
  padding: 6px 10px;
  border: 2px solid var(--unifil-orange);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text-primary);
}

.tag--muted {
  border-color: var(--surface-border);
  color: var(--text-muted);
}

.moves__note {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
  font-style: italic;
}

.training {
  margin-top: var(--space-3);
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
  border-left: 3px solid var(--unifil-orange);
  padding-left: var(--space-3);
}

@media (prefers-reduced-motion: reduce) {
  .hp__fill {
    transition: none;
  }
}
</style>
