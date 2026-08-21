<script setup>
import { battle } from '@/content/copy.js'
import { BY_SLUG } from '@/data/professors.js'
import SectionShell from '@/components/SectionShell.vue'
import TypeBadge from '@/components/TypeBadge.vue'
import { useReveal } from '@/composables/useReveal.js'

// Enquadramento clássico: adversário em cima à direita, o seu em baixo à
// esquerda, cada um com sua barra de HP do lado oposto.
//
// A arte aqui é o BONECO, não o cartoon — é o que o app desenha na arena desde
// que os `.glb` saíram de lá, e o que o briefing pede nesta seção. Um retrato
// emoldurado em QR contaria a coisa errada: dá para reconhecer o professor, mas
// não parece uma partida.
//
// O adversário aparece de FRENTE (ele encara você) e o seu, de COSTAS em
// primeiro plano — a câmera está atrás do seu ombro. É o enquadramento que todo
// mundo reconhece sem legenda, e é o que o app faz.
const enemy = BY_SLUG.mario
const player = BY_SLUG.gustavo

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
          <img
            class="pixelated"
            :src="enemy.sprite"
            :alt="`Professor ${enemy.name}, o adversário`"
            width="64"
            height="64"
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>

      <hr class="rule-dashed" />

      <div class="arena__row arena__row--player">
        <figure class="fighter fighter--player">
          <img
            class="pixelated"
            :src="player.spriteBack"
            :alt="`Professor ${player.name}, o seu combatente, visto de costas`"
            width="64"
            height="64"
            loading="lazy"
            decoding="async"
          />
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

/* A largura vira variável porque o respiro de baixo é DERIVADO dela: 0,091 é
   meia elipse (largura 62% ÷ proporção 3,4 ÷ 2). Assim os dois números não podem
   sair de sincronia quando alguém mexer no tamanho do combatente.

   Não dá para usar `padding-bottom: 9%` aqui: porcentagem de padding resolve
   contra a largura do CONTÊINER — que é a linha flex de ~680 px, não os 168 px da
   figure. Dava 61 px de espaço morto embaixo de cada boneco. */
.fighter {
  --largura: clamp(96px, 26vw, 168px);
  flex-shrink: 0;
  width: var(--largura);
  position: relative;
  display: grid;
  place-items: end center;
  /* Espaço para a metade de baixo do disco: o sprite tem os pés encostados na
     borda inferior da própria imagem (a caixa do desenho vai de y=0 a y=63 num
     arquivo de 64 px), então a linha do chão é exatamente a base da <img>. */
  padding-bottom: calc(var(--largura) * 0.091);
}

.fighter img {
  width: 100%;
  aspect-ratio: 1;
  /* `contain`: o boneco é corpo inteiro sobre transparência. `cover` cortaria
     os pés, que é justamente o que faz um sprite parecer um recorte. */
  object-fit: contain;
  /* Sombra dura, sem blur: sombra de sprite, não de cartão. */
  filter: drop-shadow(3px 3px 0 rgb(0 0 0 / 45%));
  /* O disco é `position: absolute` e, sem isto, pintaria POR CIMA do boneco —
     conteúdo posicionado vem depois de conteúdo não posicionado na ordem de
     pintura, mesmo estando antes no documento. O chão precisa ficar atrás de
     quem pisa nele. */
  position: relative;
  z-index: 1;
}

/* Sem moldura em volta do boneco: ele é recortado, e emoldurá-lo o devolveria à
   condição de retrato. Quem diz de que lado cada um está é o DISCO no chão —
   vermelho para o adversário, azul para o seu —, que é como a arena do app
   marca os dois lados.

   O disco fica atrás pelo `::before` da figure e não como `background` da img,
   porque precisa ser uma elipse achatada no pé do boneco, não um retângulo. */
/* Disco e boneco ocupam a MESMA célula da grade, os dois alinhados ao fim dela.
   Assim a base da elipse e a base da <img> são a mesma linha por construção — não
   por um número que precisa ser mantido em sincronia.

   Foi o que a primeira tentativa errou: `bottom: 9%` num elemento absoluto
   resolve contra a ALTURA do contêiner, enquanto `padding-bottom: 9%` resolve
   contra a LARGURA. Dois eixos, mesmo número, e a elipse subia para a canela.

   O `translate: 0 50%` desce meia altura, levando o CENTRO da elipse até a linha
   dos pés — é onde fica o contato com o chão. A metade de baixo cai dentro do
   `padding-bottom` da figure, que é 9% da largura ≈ exatamente meia elipse
   (0,62 × 1/3,4 ÷ 2 = 0,091). Os dois vêm da largura, então continuam casados em
   qualquer tamanho de tela. */
.fighter::before,
.fighter img {
  grid-area: 1 / 1;
}

.fighter::before {
  content: '';
  align-self: end;
  width: 62%;
  aspect-ratio: 3.4 / 1;
  translate: 0 50%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--disco) 50%, transparent) 0%,
    color-mix(in srgb, var(--disco) 22%, transparent) 55%,
    transparent 75%
  );
}

.fighter--enemy {
  --disco: var(--error);
}

.fighter--player {
  --disco: var(--ds-blue);
}

/* O seu combatente está em PRIMEIRO PLANO: a câmera está atrás do ombro dele.
   Se os dois tivessem o mesmo tamanho, a cena viraria dois bonecos lado a lado
   em vez de uma arena com profundidade. */
.fighter--player {
  --largura: clamp(120px, 32vw, 208px);
}

/* Respiração de sprite parado: 2 quadros, como uma animação de idle de GBA.
   `steps(2)` em vez de uma curva contínua — um sprite que desliza suavemente
   para cima e para baixo é exatamente o que um sprite de 8 bits não faz. */
.fighter img {
  animation: sprite-idle 1.8s steps(2, end) infinite;
}

.fighter--player img {
  /* Defasado, para os dois não pulsarem no mesmo quadro. */
  animation-delay: 0.9s;
}

@keyframes sprite-idle {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -3px;
  }
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
  font-family: var(--font-pixel);
  font-size: var(--fs-body-sm);
  line-height: 1.7;
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
  font-family: var(--font-pixel);
  font-size: var(--fs-body-sm);
  line-height: 1.7;
  color: var(--text-muted);
  font-style: italic;
}

.training {
  margin-top: var(--space-3);
  font-family: var(--font-pixel);
  font-size: var(--fs-body-sm);
  line-height: 1.7;
  color: var(--text-muted);
  border-left: 3px solid var(--unifil-orange);
  padding-left: var(--space-3);
}

@media (prefers-reduced-motion: reduce) {
  .hp__fill {
    transition: none;
  }

  .fighter img {
    animation: none;
  }
}
</style>
