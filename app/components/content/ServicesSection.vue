<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>
<template>
  <section class="services-section">
    <div class="services-bg-glow services-bg-glow--1"></div>
    <div class="services-bg-glow services-bg-glow--2"></div>
    <div class="container">
      <div v-if="title" class="services-header">
        <p class="services-eyebrow">Wat wij doen</p>
        <h2 class="services-title">{{ title }}</h2>
        <div class="services-title-bar"></div>
      </div>
      <div class="services-grid">
        <slot />
      </div>
    </div>
  </section>
</template>
<style scoped>
.services-section {
  padding: var(--section-padding) 0;
  background: var(--bg-alt);
  position: relative;
  overflow: hidden;
}

.services-bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}

.services-bg-glow--1 {
  width: 60rem;
  height: 60rem;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.18), transparent 70%);
  top: -10rem;
  left: -15rem;
  animation: glow-drift-1 18s ease infinite alternate;
}

.services-bg-glow--2 {
  width: 50rem;
  height: 50rem;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.15), transparent 70%);
  bottom: -10rem;
  right: -10rem;
  animation: glow-drift-2 22s ease infinite alternate;
}

@keyframes glow-drift-1 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(8rem, 6rem) scale(1.15); }
}

@keyframes glow-drift-2 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-6rem, -8rem) scale(1.2); }
}

.container {
  position: relative;
  z-index: 1;
}

.services-header {
  text-align: center;
  margin-bottom: 7rem;
}

.services-eyebrow {
  font-size: 1.2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 1.6rem;
}

.services-title {
  font-size: clamp(3.2rem, 5vw, 5.6rem);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.03em;
  line-height: 0.9;
  background: linear-gradient(135deg, #fff 30%, #2563eb 70%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2.4rem;
}

.services-title-bar {
  width: 6rem;
  height: 4px;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  border-radius: 100px;
  margin: 0 auto;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr));
  gap: 2.4rem;
}

@media (max-width: 640px) {
  .services-grid {
    grid-template-columns: 1fr;
  }

  .services-header {
    margin-bottom: 5rem;
  }
}
</style>
