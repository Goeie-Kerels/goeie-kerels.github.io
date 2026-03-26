<script setup lang="ts">
const props = defineProps<{
  icon?: string
  title?: string
}>()

const icons: Record<string, string> = {
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6.93-3c0-.32-.03-.63-.08-.93l2.01-1.57a.48.48 0 0 0 .11-.61l-1.9-3.29a.48.48 0 0 0-.59-.21l-2.37.95a6.9 6.9 0 0 0-1.61-.93l-.36-2.52A.47.47 0 0 0 14 3h-3.8a.47.47 0 0 0-.47.4l-.36 2.52a6.9 6.9 0 0 0-1.61.93l-2.37-.95a.47.47 0 0 0-.59.21L3.1 9.4a.47.47 0 0 0 .11.61l2.01 1.57c-.05.3-.08.62-.08.93s.03.63.08.93L3.2 14.01a.48.48 0 0 0-.11.61l1.9 3.29c.12.21.38.29.59.21l2.37-.95c.5.36 1.04.66 1.61.93l.36 2.52c.06.23.27.4.47.4H14c.2 0 .41-.17.47-.4l.36-2.52a6.9 6.9 0 0 0 1.61-.93l2.37.95c.21.08.47 0 .59-.21l1.9-3.29a.47.47 0 0 0-.11-.61l-2.01-1.57c.05-.3.08-.62.08-.93z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  globe: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.76 4.17-2.76 13.83 0 20m0-20c2.76 4.17 2.76 13.83 0 20M2 12h20',
  car: 'M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2M5 17v2m14-2v2M5 17h14M7.5 13h.01M16.5 13h.01',
  search: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  sparkle: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z',
  broom: 'M3 21l9-9m0 0l4-4m-4 4l-2.5-2.5M21 3l-7 7M9 15l-6 6',
  house: 'M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5zM9 21V12h6v9',
  leaf: 'M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 5 21c7-1 11-5 11-5s-1 5-7 7c8 0 14-6 14-14 0-4-2-7-6-8z',
  briefcase: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  factory: 'M2 20V10l6-4v4l6-4v4l6-4v14H2zM2 20h20',
  chart: 'M18 20V10M12 20V4M6 20v-6',
}
</script>
<template>
  <div class="service-card">
    <div class="service-card-glow"></div>
    <div v-if="props.icon" class="service-icon">
      <svg v-if="icons[props.icon]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path :d="icons[props.icon]" />
      </svg>
      <span v-else>{{ props.icon }}</span>
    </div>
    <h3 v-if="title">{{ title }}</h3>
    <slot />
  </div>
</template>
<style scoped>
.service-card {
  position: relative;
  background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%);
  background-color: #1e293b;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 2rem;
  padding: 3.2rem 2.8rem;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  overflow: hidden;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  cursor: default;
}

.service-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: inherit;
}

.service-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255,255,255,0.18);
  box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(37,99,235,0.2);
}

.service-card:hover::before {
  opacity: 1;
}

.service-card-glow {
  position: absolute;
  top: -4rem;
  right: -4rem;
  width: 16rem;
  height: 16rem;
  background: radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.service-card:hover .service-card-glow {
  opacity: 1.5;
}

.service-icon {
  width: 4.8rem;
  height: 4.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.2));
  border-radius: 1.2rem;
  position: relative;
  z-index: 1;
}

.service-icon svg {
  width: 2.4rem;
  height: 2.4rem;
  color: #7c9fff;
}

h3 {
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #fff;
  margin: 0;
  position: relative;
  z-index: 1;
}

:deep(p) {
  font-size: 1.55rem;
  color: rgba(255,255,255,0.55);
  line-height: 1.7;
  margin: 0;
  position: relative;
  z-index: 1;
}
</style>
