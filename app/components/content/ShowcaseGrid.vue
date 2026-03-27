<script setup lang="ts">
import { ref, computed } from 'vue'

const { locale } = useI18n()

// Returns the companies array for an item, normalising legacy single `company` string
function getCompanies(item: any): string[] {
  if (Array.isArray(item.companies)) return item.companies
  if (item.company) return [item.company]
  return []
}

const { data: allItems } = await useAsyncData(`showcase-items`, () => {
  return queryCollection('content')
    .where('path', 'LIKE', '/showcase/%')
    .where('path', 'NOT LIKE', '/en/%')
    .where('hidden', '<>', true)
    .all()
})

const search = ref('')
const typeFilter = ref('all')
const activeTag = ref('')

const allTags = computed(() => {
  if (!allItems.value) return []
  const tags = new Set<string>()
  allItems.value.forEach(item => item.tags?.forEach((t: string) => tags.add(t)))
  return Array.from(tags).sort()
})

const filteredItems = computed(() => {
  if (!allItems.value) return []
  let items = allItems.value

  if (typeFilter.value !== 'all') {
    items = items.filter(item => item.type === typeFilter.value)
  }

  if (activeTag.value) {
    items = items.filter(item => item.tags?.includes(activeTag.value))
  }

  const q = search.value.trim().toLowerCase()
  if (q) {
    items = items.filter(item => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        getCompanies(item).some((c: string) => c.toLowerCase().includes(q)) ||
        item.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
        item.members?.some((m: string) => m.toLowerCase().includes(q))
      )
    })
  }

  return items
})

function toggleTag(tag: string) {
  activeTag.value = activeTag.value === tag ? '' : tag
}

function clearFilters() {
  search.value = ''
  typeFilter.value = 'all'
  activeTag.value = ''
}

const hasActiveFilters = computed(() => search.value || typeFilter.value !== 'all' || activeTag.value)

const showAllTags = ref(false)
const TAG_LIMIT = 12
const visibleTags = computed(() => showAllTags.value ? allTags.value : allTags.value.slice(0, TAG_LIMIT))
</script>

<template>
  <section class="showcase-section">
    <div class="container">

      <!-- Header -->
      <div class="section-header text-center reveal-on-scroll active">
        <h2>{{ locale === 'en' ? 'Our' : 'Onze' }} <span class="accent-text">{{ locale === 'en' ? 'Makers & Thinkers' : 'Makers & Denkers' }}</span></h2>
        <p class="section-sub">{{ locale === 'en' ? 'A unique mix of driven companies and passionate individuals.' : 'Een uniek mix van gedreven bedrijven en gepassioneerde personen.' }}</p>
      </div>

      <!-- Search + Filter Bar -->
      <div class="search-bar-wrapper">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            v-model="search"
            type="text"
            class="search-input"
            :placeholder="locale === 'en' ? 'Search by name, company, tag…' : 'Zoek op naam, bedrijf, tag…'"
          />
          <button v-if="search" class="search-clear" @click="search = ''" aria-label="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="type-pills">
          <button
            v-for="t in ['all', 'company', 'individual']"
            :key="t"
            class="type-pill"
            :class="{ active: typeFilter === t }"
            @click="typeFilter = t"
          >
            <span class="pill-dot" :class="t"></span>
            {{ t === 'all' ? (locale === 'en' ? 'All' : 'Alles') : t === 'company' ? (locale === 'en' ? 'Companies' : 'Bedrijven') : (locale === 'en' ? 'Individuals' : 'Personen') }}
          </button>
        </div>
      </div>

      <!-- Tag Cloud -->
      <div class="tag-cloud">
        <button
          v-for="tag in visibleTags"
          :key="tag"
          class="tag-pill"
          :class="{ active: activeTag === tag }"
          @click="toggleTag(tag)"
        >
          #{{ tag }}
        </button>
        <button v-if="allTags.length > TAG_LIMIT" class="tag-pill show-more-pill" @click="showAllTags = !showAllTags">
          {{ showAllTags ? (locale === 'en' ? '↑ Less' : '↑ Minder') : `+${allTags.length - TAG_LIMIT}` }}
        </button>
        <button v-if="hasActiveFilters" class="tag-pill clear-pill" @click="clearFilters">
          {{ locale === 'en' ? '✕ Clear' : '✕ Wis' }}
        </button>
      </div>

      <!-- Results count -->
      <div class="results-meta" v-if="hasActiveFilters">
        <span>{{ filteredItems.length }} {{ locale === 'en' ? (filteredItems.length === 1 ? 'result' : 'results') : (filteredItems.length === 1 ? 'resultaat' : 'resultaten') }}</span>
      </div>

      <!-- Grid -->
      <TransitionGroup name="grid" tag="div" class="showcase-grid">
        <NuxtLink
          v-for="(item, index) in filteredItems"
          :key="item.path"
          :to="item.path"
          class="showcase-card"
          :class="item.type"
          :style="{ '--delay': (index * 0.07) + 's' }"
        >
          <!-- Media -->
          <div class="card-media" :class="{ 'portrait-media': item.vertical }">
            <!-- Blurred background fill for portrait media -->
            <div v-if="item.vertical && item.image" class="portrait-bg" :style="{ backgroundImage: `url(${item.image})` }"></div>
            <video
              v-if="item.video"
              :src="item.video.replace('.webm', '.mp4')"
              :poster="item.image || undefined"
              muted
              loop
              playsinline
              :class="['card-video', { 'portrait': item.vertical }]"
              onmouseover="this.play()"
              onmouseout="this.pause(); this.currentTime = 0;"
            ></video>
            <img v-else-if="item.image" :src="item.image" :alt="item.title" loading="lazy" :class="{ 'portrait': item.vertical }">
            <div v-else class="card-media-placeholder" :style="{ '--accent': item.type === 'company' ? '#f59e0b' : '#2563eb' }">
              {{ item.title.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() }}
            </div>
            <div class="card-media-overlay"></div>
            <div class="card-type-badge" :class="item.type">
              {{ item.type === 'company' ? (locale === 'en' ? 'Company' : 'Bedrijf') : (locale === 'en' ? 'Individual' : 'Persoon') }}
            </div>
          </div>

          <!-- Body -->
          <div class="card-body">
            <div class="card-meta-row">
              <span v-for="tag in item.tags?.slice(0, 2)" :key="tag" class="card-tag">#{{ tag }}</span>
            </div>

            <h3 class="card-title">{{ item.title }}</h3>

            <!-- Company affiliation for individuals -->
            <div v-if="item.type === 'individual' && getCompanies(item).length && !item.hiddenCompany" class="card-affiliation">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              {{ getCompanies(item).join(' · ') }}
            </div>

            <!-- Members for companies -->
            <div v-if="item.type === 'company' && item.members?.length" class="card-members">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {{ item.members.slice(0, 3).join(', ') }}<span v-if="item.members.length > 3"> +{{ item.members.length - 3 }}</span>
            </div>

            <p class="card-desc">{{ item.description }}</p>

            <div class="card-cta">
              <span>{{ locale === 'en' ? 'View profile' : 'Bekijk profiel' }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </NuxtLink>
      </TransitionGroup>

      <!-- Empty state -->
      <div v-if="!filteredItems.length" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>{{ locale === 'en' ? 'No results found.' : 'Geen resultaten gevonden.' }}</p>
        <button class="empty-reset" @click="clearFilters">{{ locale === 'en' ? 'Clear filters' : 'Filters wissen' }}</button>
      </div>

    </div>
  </section>
</template>

<style scoped>
.showcase-section {
  padding-top: 6rem;
}

/* ── Header ── */
.section-header {
  margin-bottom: 6rem;
}

.section-sub {
  font-size: 2rem;
  color: var(--text-muted);
  margin: 2.5rem auto 0;
  max-width: 60rem;
}

/* ── Search bar ── */
.search-bar-wrapper {
  display: flex;
  gap: 2rem;
  align-items: center;
  margin-bottom: 2.4rem;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 28rem;
}

.search-icon {
  position: absolute;
  left: 1.8rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 1.4rem 4.8rem 1.4rem 5rem;
  border-radius: 50px;
  border: 2px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text);
  font-family: inherit;
  font-size: 1.6rem;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(10px);
}

.search-input::placeholder {
  color: var(--text-muted);
  font-weight: 500;
}

.search-input:focus {
  border-color: var(--gradient-1);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.search-clear {
  position: absolute;
  right: 1.6rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  padding: 0.4rem;
}

.search-clear svg {
  width: 1.6rem;
  height: 1.6rem;
}

/* ── Type pills ── */
.type-pills {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.type-pill {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.2rem 2.4rem;
  border-radius: 50px;
  border: 2px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.type-pill:hover {
  border-color: var(--gradient-1);
  color: var(--text);
}

.type-pill.active {
  background: var(--gradient-1);
  border-color: var(--gradient-1);
  color: #fff;
}

.pill-dot {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

.pill-dot.company { background: #f59e0b; opacity: 1; }
.pill-dot.individual { background: #2563eb; opacity: 1; }
.pill-dot.all { background: var(--text-muted); opacity: 1; }

.type-pill.active .pill-dot {
  background: #fff;
  opacity: 0.8;
}

/* ── Tag cloud ── */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0.4rem 0.2rem;
}

.tag-pill {
  padding: 0.6rem 1.6rem;
  border-radius: 50px;
  border: 1.5px solid var(--glass-border);
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag-pill:hover {
  border-color: var(--gradient-2);
  color: var(--gradient-2);
}

.tag-pill.active {
  background: var(--gradient-2);
  border-color: var(--gradient-2);
  color: #fff;
}

.show-more-pill {
  border-color: var(--glass-border);
  color: var(--text-muted);
  font-weight: 800;
}

.show-more-pill:hover {
  border-color: var(--gradient-1);
  color: var(--gradient-1);
}

.clear-pill {
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.clear-pill:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

/* ── Results meta ── */
.results-meta {
  font-size: 1.4rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 3rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Grid ── */
.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38rem, 1fr));
  gap: 3.2rem;
}

/* ── Card ── */
.showcase-card {
  --card-bg: #ffffff;
  --card-text: #0f172a;
  --card-text-muted: #64748b;
  --card-border: rgba(15, 23, 42, 0.08);
  --card-bg-alt: #f1f5f9;

  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border-radius: 2.4rem;
  overflow: hidden;
  border: 1.5px solid var(--card-border);
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  animation: card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--delay, 0s);
  text-decoration: none;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.showcase-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
}

/* ── Card media ── */
.card-media {
  position: relative;
  height: 24rem;
  overflow: hidden;
  flex-shrink: 0;
}

.card-media-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #0f172a), color-mix(in srgb, var(--accent) 40%, #0f172a));
  font-size: 5rem;
  font-weight: 900;
  color: var(--accent);
  letter-spacing: -0.05em;
  opacity: 0.9;
}

.card-media img,
.card-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Portrait: show full person, blurred bg fills the sides */
.card-media.portrait-media {
  background: #0f172a;
}

.portrait-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 20%;
  filter: blur(18px) brightness(0.45) saturate(1.4);
  transform: scale(1.08);
  z-index: 0;
}

.card-media img.portrait,
.card-media .card-video.portrait {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  width: auto;
  height: 130%;
  max-width: 100%;
  object-fit: contain;
  object-position: center 15%;
}

.showcase-card:hover .card-media img:not(.portrait),
.showcase-card:hover .card-video:not(.portrait) {
  transform: scale(1.06);
}

.showcase-card:hover .card-media img.portrait,
.showcase-card:hover .card-video.portrait {
  transform: translateX(-50%) scale(1.06);
}

.showcase-card:hover .portrait-bg {
  transform: scale(1.12);
}

.card-media-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(to bottom, transparent 40%, rgba(15, 23, 42, 0.5) 100%);
}

.card-type-badge {
  position: absolute;
  top: 1.6rem;
  right: 1.6rem;
  z-index: 3;
  padding: 0.5rem 1.4rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #fff;
  backdrop-filter: blur(10px);
}

.card-type-badge.company {
  background: rgba(245, 158, 11, 0.85);
}

.card-type-badge.individual {
  background: rgba(37, 99, 235, 0.85);
}

/* ── Card body ── */
.card-body {
  padding: 2.8rem 3.2rem 3.2rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-meta-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.card-tag {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--gradient-2);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.card-title {
  font-size: 2.6rem;
  font-weight: 900;
  color: var(--card-text);
  line-height: 1;
  letter-spacing: -0.04em;
  margin-bottom: 1.2rem;
  text-transform: uppercase;
}

.card-affiliation,
.card-members {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--card-text-muted);
  margin-bottom: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.card-affiliation svg,
.card-members svg {
  width: 1.4rem;
  height: 1.4rem;
  flex-shrink: 0;
  color: var(--gradient-1);
}

.card-desc {
  font-size: 1.5rem;
  color: var(--card-text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 2.4rem;
  flex: 1;
}

.card-cta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--gradient-1);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: auto;
  transition: gap 0.2s;
}

.card-cta svg {
  width: 1.6rem;
  height: 1.6rem;
  transition: transform 0.2s;
}

.showcase-card:hover .card-cta {
  gap: 1.4rem;
}

.showcase-card:hover .card-cta svg {
  transform: translateX(4px);
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 10rem 0;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 2rem;
}

.empty-state p {
  font-size: 2rem;
  color: var(--text-muted);
  margin: 0 auto 3rem;
}

.empty-reset {
  padding: 1.2rem 3rem;
  border-radius: 50px;
  border: 2px solid var(--gradient-1);
  background: transparent;
  color: var(--gradient-1);
  font-family: inherit;
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: all 0.2s;
}

.empty-reset:hover {
  background: var(--gradient-1);
  color: #fff;
}

/* ── Transitions ── */
.grid-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.grid-enter-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.grid-leave-active {
  transition: opacity 0.15s ease;
  pointer-events: none;
}

.grid-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.grid-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .showcase-grid {
    grid-template-columns: repeat(auto-fill, minmax(32rem, 1fr));
  }
}

@media (max-width: 768px) {
  .search-bar-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 1.2rem;
  }

  .search-input-wrap {
    min-width: unset;
  }

  .type-pills {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .type-pill {
    flex: 1;
    justify-content: center;
    min-width: 0;
    padding: 1.2rem 1rem;
    font-size: 1.3rem;
  }

  .showcase-grid {
    grid-template-columns: 1fr;
    gap: 2.4rem;
  }

  .card-media {
    height: 20rem;
  }

  .card-body {
    padding: 2.4rem;
  }
}
</style>
