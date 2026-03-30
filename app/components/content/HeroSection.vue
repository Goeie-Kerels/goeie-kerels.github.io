<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  image?: string
  video?: string
  vertical?: boolean
  compact?: boolean
}>()

const { isGoeiekerels } = useBuildTarget()
const REEL_COUNT = isGoeiekerels ? 10 : 15  // must match NUM_REELS in generate-hero-reel.sh
const REEL_BASE = isGoeiekerels ? '/videos/goeiekerels/hero-reel-' : '/videos/hero-reel-'

// Initialise from props so SSR and first client render are identical — no hydration mismatch, no flash.
// onMounted overrides activeVideo for reel-rotation pages only.
const activeVideo = ref<string | null>(props.video ?? null)
const activeImage = ref<string | null>((!props.video && props.image) ? props.image : null)

// Strip any existing extension from the path, then re-add the desired one.
// Handles both "/videos/hero-reel-1" (no ext) and "/videos/showcase/foo.webm" (has ext).
function withExt(path: string, ext: string): string {
  return path.replace(/\.(mp4|webm)$/i, '') + '.' + ext
}

const videoSrcMp4 = computed(() => activeVideo.value ? withExt(activeVideo.value, 'mp4') : null)
const videoSrcWebm = computed(() => activeVideo.value ? withExt(activeVideo.value, 'webm') : null)

onMounted(() => {
  // Image-only hero — already initialised; nothing more to do
  if (!props.video && props.image) return

  // Showcase page: explicit non-reel video — already initialised from props
  if (props.video && !props.video.includes('hero-reel')) return

  // Regular pages: rotate through numbered reels
  const key = 'hero-reel-index'
  const current = parseInt(localStorage.getItem(key) ?? '-1', 10)
  const next = (current + 1) % REEL_COUNT
  localStorage.setItem(key, String(next))
  const reelPath = `${REEL_BASE}${next + 1}`
  activeVideo.value = reelPath

  // Changing <source> src attributes doesn't trigger a reload in browsers;
  // we must call video.load() explicitly after updating the reactive sources.
  const videoEl = document.querySelector('.hero-bg video') as HTMLVideoElement | null
  if (videoEl) videoEl.load()
})
</script>

<template>
  <section class="hero-section" :class="{ 'has-image': !!activeVideo || !!activeImage, 'hero-section--compact': props.compact }">
    <div v-if="activeVideo" class="hero-bg">
      <video autoplay muted loop playsinline preload="auto">
        <source :src="videoSrcMp4!" type="video/mp4">
        <source :src="videoSrcWebm!" type="video/webm">
      </video>
      <div class="overlay"></div>
    </div>
    <div v-else-if="activeImage" class="hero-bg" :class="{ 'portrait-bg-wrap': props.vertical }">
      <div v-if="props.vertical" class="hero-portrait-bg" :style="{ backgroundImage: `url(${activeImage})` }"></div>
      <img :src="activeImage" alt="Hero Background" fetchpriority="high" :class="{ 'portrait': props.vertical }">
      <div class="overlay"></div>
    </div>
    <div class="container hero-content">
      <div class="hero-inner reveal-on-scroll active">
        <slot />
      </div>
    </div>
    <div class="scroll-indicator">
      <span></span>
    </div>
    <div class="hero-shape"></div>
  </section>
</template>

<style scoped>
.hero-section {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: var(--primary);
  padding-top: 12rem;
}

.hero-section--compact {
  min-height: 60vh;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.hero-bg img,
.hero-bg video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: brightness(0.5) saturate(1.2);
  transform: scale(1.1);
  animation: hero-zoom 20s ease infinite alternate;
}

.hero-bg.portrait-bg-wrap {
  background: #0f172a;
}

.hero-portrait-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 20%;
  filter: blur(32px) brightness(0.3) saturate(1.6);
  transform: scale(1.15);
  z-index: 0;
}

.hero-bg img.portrait {
  position: relative;
  z-index: 1;
  width: auto;
  height: 100%;
  max-width: 60%;
  object-fit: contain;
  object-position: center 15%;
  filter: drop-shadow(0 16px 48px rgba(0,0,0,0.6));
  left: 50%;
  transform: translateX(-50%) scale(1.1);
  animation: hero-zoom-portrait 20s ease infinite alternate;
}

@keyframes hero-zoom-portrait {
  to { transform: translateX(-50%) scale(1); }
}

@keyframes hero-zoom {
  to { transform: scale(1); }
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  background: radial-gradient(circle at 20% 50%, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.8));
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
}

.hero-inner {
  max-width: 110rem;
}

:deep(h1) {
  color: var(--white);
  margin-bottom: 4rem;
  line-height: 0.85;
  letter-spacing: -0.07em;
  text-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

:deep(p) {
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 6rem;
  max-width: 80rem;
  line-height: 1.4;
}

.hero-shape {
  position: absolute;
  bottom: -10%;
  right: -5%;
  width: 60rem;
  height: 60rem;
  background: linear-gradient(135deg, var(--gradient-1), var(--gradient-2));
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.4;
  z-index: 1;
  animation: shape-float 15s ease infinite alternate;
}

@keyframes shape-float {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(-10%, -10%) scale(1.2); }
}

.scroll-indicator {
  position: absolute;
  bottom: 6rem;
  left: 50%;
  transform: translateX(-50%);
  width: 3.4rem;
  height: 6rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.scroll-indicator span {
  display: block;
  width: 6px;
  height: 12px;
  background-color: var(--accent);
  margin: 1.2rem auto;
  border-radius: 100px;
  animation: scroll-wheel 2s infinite;
}

@keyframes scroll-wheel {
  0% { transform: translateY(0); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateY(20px); opacity: 0; }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 100svh;
    text-align: center;
    padding-top: 7rem;
    align-items: center;
    justify-content: center;
  }
  
  .hero-content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-inner {
    margin: 0 auto;
    width: 100%;
  }
  
  :deep(p) {
    margin: 0 auto 5rem;
    font-size: clamp(1.8rem, 4vw, 2.4rem);
  }
  
  .hero-shape {
    width: 30rem;
    height: 30rem;
  }

  .scroll-indicator {
    bottom: 3rem;
  }
}
</style>
