<script setup>
import { credits } from '@/content/copy.js'
import { METRICS_IMAGE, REPO_URL, UNIFIL_URL, photo } from '@/config/links.js'
import SectionShell from '@/components/SectionShell.vue'
import { useReveal } from '@/composables/useReveal.js'

// Dois observadores, como em HowItWorksSection: a lista de pessoas entra em
// cascata, as caixas de baixo entram juntas.
const { el: teamEl } = useReveal()
const { el: metaEl } = useReveal()

const fotos = credits.photos.map((p) => ({ ...p, ...photo(p.slug) }))

// Número com separador de milhar do português (98.422), nunca digitado à mão.
const numero = new Intl.NumberFormat('pt-BR')
</script>

<template>
  <!-- `id="creditos"` é endereço público: a barra do topo, o rodapé e a tela
       "Quem somos" do app apontam para cá. O respiro contra a barra fixa vem
       do `scroll-padding-top` do html — ver styles/base.css. -->
  <SectionShell id="creditos" :kicker="credits.kicker" :title="credits.title">
    <template #lede>{{ credits.lede }}</template>

    <!-- ── Fotos do time ──────────────────────────────────────────────── -->
    <h3 class="credits__subtitle">{{ credits.photosTitle }}</h3>
    <ul class="credits__photos">
      <li v-for="(foto, i) in fotos" :key="foto.slug" class="credits__photo gba-frame gba-frame--plain">
        <img draggable="false"
          :src="foto.src"
          :srcset="foto.srcset"
          :sizes="i === 0 ? '(min-width: 860px) 50vw, 100vw' : '(min-width: 860px) 25vw, 50vw'"
          :alt="foto.alt"
          :width="foto.width"
          :height="foto.height"
          loading="lazy"
          decoding="async"
        />
      </li>
    </ul>

    <!-- ── O projeto e os números do evento ──────────────────────────── -->
    <div class="credits__project">
      <div class="credits__project-text">
        <h3 class="credits__subtitle">{{ credits.projectTitle }}</h3>
        <p v-for="(par, i) in credits.projectParagraphs" :key="i" class="credits__paragraph">
          {{ par }}
        </p>
      </div>

      <div class="credits__readout gba-frame gba-frame--deep">
        <h3 class="credits__subtitle">{{ credits.metricsTitle }}</h3>
        <p class="credits__readout-intro">{{ credits.metricsIntro }}</p>
        <dl class="credits__metrics">
          <div v-for="m in credits.metrics" :key="m.label" class="credits__metric">
            <dt>{{ m.label }}</dt>
            <dd>{{ numero.format(m.value) }}</dd>
          </div>
        </dl>
        <a class="credits__report" :href="METRICS_IMAGE.full" target="_blank" rel="noopener">
          <img draggable="false"
            :src="METRICS_IMAGE.src"
            :srcset="METRICS_IMAGE.srcset"
            sizes="(min-width: 860px) 160px, 120px"
            :alt="credits.metricsImageAlt"
            :width="METRICS_IMAGE.width"
            :height="METRICS_IMAGE.height"
            loading="lazy"
            decoding="async"
          />
          <span>{{ credits.metricsImageLink }}</span>
        </a>
      </div>
    </div>

    <!-- ── Pessoas ────────────────────────────────────────────────────── -->
    <h3 class="credits__subtitle">{{ credits.teamTitle }}</h3>

    <ul ref="teamEl" class="credits__team reveal-stagger">
      <li
        v-for="(person, i) in credits.team"
        :key="person.name + person.role"
        class="credits__person gba-frame gba-frame--plain"
        :style="{ '--reveal-i': i }"
      >
        <!-- Nome em fonte de corpo, nunca em pixel: nome de pessoa não é
             rótulo de UI, e a Press Start 2P não aguenta nome comprido nem
             acento em caixa alta (ver a regra em styles/base.css). -->
        <p class="credits__name">{{ person.name }}</p>
        <p class="credits__role">{{ person.role }}</p>
        <p class="credits__person-links">
          <a
            v-for="link in person.links"
            :key="link.url"
            class="credits__person-link"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${link.label} de ${person.name}`"
          >{{ link.label }}</a>
        </p>
      </li>
    </ul>

    <h3 class="credits__subtitle">{{ credits.advisorsTitle }}</h3>

    <ul class="credits__team">
      <li
        v-for="person in credits.advisors"
        :key="person.name + person.role"
        class="credits__person gba-frame gba-frame--plain"
      >
        <p class="credits__name">{{ person.name }}</p>
        <p class="credits__role">{{ person.role }}</p>
        <p class="credits__person-links">
          <a
            v-for="link in person.links"
            :key="link.url"
            class="credits__person-link"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${link.label} de ${person.name}`"
          >{{ link.label }}</a>
        </p>
      </li>
    </ul>

    <div ref="metaEl" class="credits__meta reveal-steps">
      <article class="credits__card gba-frame gba-frame--deep">
        <h3 class="credits__subtitle">{{ credits.institutionTitle }}</h3>
        <p class="credits__card-name">{{ credits.institutionName }}</p>
        <p class="credits__card-desc">{{ credits.institutionDesc }}</p>
        <p class="credits__card-links">
          <a :href="UNIFIL_URL" target="_blank" rel="noopener noreferrer">{{ credits.institutionLink }}</a>
          <a :href="REPO_URL" target="_blank" rel="noopener noreferrer">{{ credits.projectLink }}</a>
        </p>
      </article>
    </div>
  </SectionShell>
</template>

<style scoped>
.credits__subtitle {
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  color: var(--unifil-gold);
  line-height: 1.7;
}

/* ── Fotos ─────────────────────────────────────────────────────────────── */
/* A primeira foto é a do time inteiro no estande e abre a galeria em
   destaque; as outras três dividem o espaço ao lado (desktop) ou embaixo
   (celular, duas por linha). */
.credits__photos {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.credits__photo {
  padding: var(--space-1);
  overflow: hidden;
}

/* Celular: a primeira e a última ocupam a linha toda, as duas do meio dividem
   — quatro fotos sem buraco na grade. */
.credits__photo:first-child,
.credits__photo:last-child {
  grid-column: 1 / -1;
}

.credits__photo img {
  width: 100%;
  height: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: 2px;
}

@media (min-width: 860px) {
  .credits__photos {
    grid-template-columns: 2fr 1fr 1fr;
    grid-template-rows: repeat(2, auto);
  }

  .credits__photo:first-child {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  .credits__photo:last-child {
    grid-column: 2 / span 2;
  }

  .credits__photo:first-child img {
    aspect-ratio: auto;
  }
}

/* ── Projeto + números ─────────────────────────────────────────────────── */
.credits__project {
  display: grid;
  gap: var(--space-4);
  align-items: start;
}

@media (min-width: 860px) {
  .credits__project {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: var(--space-5);
  }
}

.credits__project-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.credits__paragraph {
  max-width: var(--maxw-prose);
  color: var(--text-primary);
  text-wrap: pretty;
}

/* Leitura de visor: rótulo à esquerda, número à direita, ligados por uma
   linha pontilhada — o jeito de um menu de status de console mostrar dados,
   em vez de números gigantes soltos. */
.credits__readout {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.credits__readout-intro {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
}

.credits__metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.credits__metric {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  font-size: var(--fs-body-sm);
}

.credits__metric dt {
  color: var(--text-muted);
}

.credits__metric::after {
  content: '';
  order: 1;
  flex: 1;
  min-width: var(--space-3);
  border-bottom: 2px dotted var(--surface-border);
}

.credits__metric dd {
  order: 2;
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  color: var(--unifil-gold);
  font-variant-numeric: tabular-nums;
}

.credits__report {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  line-height: 1.7;
}

.credits__report img {
  width: 96px;
  height: auto;
  border: 2px solid var(--surface-border);
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── Pessoas ───────────────────────────────────────────────────────────── */
.credits__team {
  list-style: none;
  display: grid;
  /* `auto-fit` + minmax: uma coluna no celular, duas no tablet, quatro no
     desktop — sem uma media query por degrau. `min()` garante que a coluna
     nunca seja mais larga que a tela de 320px. */
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: var(--space-3);
}

.credits__person {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
}

.credits__name {
  font-size: var(--fs-body);
  color: var(--text-primary);
  line-height: 1.4;
}

.credits__role {
  font-family: var(--font-pixel);
  font-size: var(--fs-body-sm);
  line-height: 1.7;
  color: var(--text-muted);
}

.credits__person-links {
  margin-top: var(--space-1);
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-1);
}

.credits__person-link {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  font-family: var(--font-pixel);
  font-size: var(--fs-pixel-sm);
  line-height: 1.7;
}

/* A vírgula entre LinkedIn e GitHub é tipografia, não texto: fica fora do
   nome acessível do link e some quando só há um perfil. */
.credits__person-link:not(:last-child)::after {
  content: ',';
  color: var(--text-muted);
}

.credits__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: var(--space-3);
}

.credits__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
}

.credits__card-name {
  font-family: var(--font-pixel);
  font-size: var(--fs-h3);
  color: var(--text-primary);
  line-height: 1.6;
}

.credits__card-desc {
  font-size: var(--fs-body-sm);
  color: var(--text-muted);
}

.credits__card-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}
</style>
