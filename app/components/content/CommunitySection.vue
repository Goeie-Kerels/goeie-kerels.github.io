<script setup lang="ts">
const { locale } = useI18n()
const { brand } = useBuildTarget()
const { data: allItems } = await useAsyncData(`community-items-${brand.id}`, () => {
  return queryCollection('brand_showcase' as any)
    .where('hidden', '<>', true)
    .limit(12)
    .all()
})

// Function to get a color based on the title (for fallback icons)

const getAccentColor = (title: string) => {
  const colors = ['var(--gradient-1)', 'var(--gradient-2)', 'var(--gradient-3)', '#10b981', '#6366f1']
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
</script>

<template>
  <section class="community-section">
    <div class="container community-grid">
      <div class="community-visual reveal-on-scroll active">
        <div class="faces-grid">
          <div 
            v-for="(item, index) in allItems" 
            :key="item.path"
            class="face-card"
            :style="{ 
              '--delay': (index * 0.1) + 's',
              '--accent': getAccentColor(item.title),
              '--index': index
            }"
          >
            <div class="face-image-wrapper">
              <div class="face-placeholder">
                {{ item.title.split(' ').map((n: string) => n[0]).join('').slice(0, 2) }}
              </div>
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                class="face-photo"
              >
            </div>
          </div>
          <!-- Extra "Plus" card to join -->
          <NuxtLink :to="$localePath('/meedoen')" class="face-card plus-card">
            <div class="face-image-wrapper">
              <span>+</span>
            </div>
          </NuxtLink>
        </div>
        
        <div class="vouch-badge glass floating">
          <div class="badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="badge-text">
            <strong>Trusted</strong>
            <span>Verified Crew</span>
          </div>
        </div>
      </div>
      
      <div class="community-content reveal-on-scroll active">
        <slot />
        
        <div class="vouching-motto">
          <div class="motto-item">
            <span class="motto-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>{{ locale === 'en' ? 'Real Craftsmen' : 'Echte Vakmensen' }}</span>
          </div>
          <div class="motto-item">
            <span class="motto-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>{{ locale === 'en' ? 'Hard Workers' : 'Harde Werkers' }}</span>
          </div>
          <div class="motto-item">
            <span class="motto-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>{{ locale === 'en' ? 'One Community' : 'Eén Community' }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.community-section {
  overflow: hidden;
  max-width: 100vw;
  background: radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.05) 0%, transparent 40%),
              radial-gradient(circle at 10% 90%, rgba(79, 70, 229, 0.05) 0%, transparent 40%);
}

.community-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 12rem;
  padding-bottom: 8rem;
}

.community-content {
  position: relative;
  z-index: 2;
}

:deep(h2) {
  margin-bottom: 4rem;
  font-size: clamp(4rem, 6vw, 7rem);
  background: linear-gradient(135deg, var(--primary) 0%, var(--gradient-1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(p) {
  font-size: 2.2rem;
  color: var(--text);
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 4rem;
}

.community-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.faces-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  width: 100%;
  max-width: 50rem;
  transform: rotate(-5deg);
}

.face-card {
  aspect-ratio: 1;
  background: var(--white);
  padding: 1rem;
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  animation: face-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
  animation-delay: var(--delay);
  transition: var(--transition-smooth);
}

.face-card:hover {
  transform: scale(1.1) rotate(5deg) translateY(-10px);
  z-index: 10;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.face-image-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  overflow: hidden;
  background: var(--bg-alt);
  display: flex;
  align-items: center;
  justify-content: center;
}

.face-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.face-placeholder {
  font-size: 2rem;
  font-weight: 800;
  color: var(--white);
  background: var(--accent);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  background: var(--accent); /* Fallback */
  background: var(--accent);
}

/* Give each card a unique accent color based on the style prop */
.face-card {
  background: var(--accent, var(--white));
  padding: 0.4rem;
}
.face-image-wrapper {
  position: relative;
  overflow: hidden;
}

.plus-card .face-image-wrapper {
  background: #0f172a;
  color: var(--white);
  font-size: 3rem;
  font-weight: 900;
}

.vouch-badge {
  position: absolute;
  bottom: -5%;
  right: 0;
  padding: 2.5rem 4rem;
  border-radius: 2.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  border: 1px solid var(--glass-border);
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
  z-index: 15;
}

.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}

.badge-text {
  display: flex;
  flex-direction: column;
}

.badge-text strong {
  font-size: 2.4rem;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-text span {
  font-size: 1.4rem;
  color: var(--text-muted);
  font-weight: 600;
}

.vouching-motto {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.motto-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
}

.motto-icon {
  width: 3.2rem;
  height: 3.2rem;
  background: var(--primary);
  color: var(--bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@keyframes face-pop {
  from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}

@media (max-width: 1024px) {
  .community-grid {
    grid-template-columns: 1fr;
    gap: 8rem;
    text-align: center;
  }
  
  .community-visual {
    order: 2;
  }

  .vouch-badge {
    bottom: 0;
    right: 50%;
    transform: translateX(50%);
  }
  
  .vouching-motto {
    align-items: center;
  }
  
  .faces-grid {
    margin: 0 auto;
    transform: none;
  }
}

@media (max-width: 640px) {
  .community-grid {
    gap: 4rem;
  }

  .community-visual {
    position: static;
    flex-direction: column;
    align-items: center;
    min-height: unset;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  .faces-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
    width: 100%;
    max-width: none;
    transform: none;
  }

  .vouch-badge {
    position: relative !important;
    bottom: auto !important;
    right: auto !important;
    transform: none !important;
    margin: 4rem auto 0;
  }
}
</style>
