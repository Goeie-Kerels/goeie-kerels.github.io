<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { target, isGoeiekerels } = useBuildTarget()
const config = useRuntimeConfig()
const brand = computed(() => {
  const brands = config.public.brands as Record<string, any>
  return brands[target] ?? brands['default']
})
const contentCollection = target === 'default' ? 'content' : `${target}_content`
const { data: navPages } = await useAsyncData(`footer-nav-links-${target}`, () =>
  queryCollection(contentCollection as any)
    .where('nav', 'IS NOT NULL', '')
    .order('order', 'ASC')
    .select('path', 'nav', 'order')
    .all()
)
const navLinks = computed(() =>
  (navPages.value ?? []).map(p => ({
    name: p.nav as string,
    path: p.path.replace('/' + target, '') || '/'
  }))
)
</script>
<template>
  <footer class="app-footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-logo">
          <template v-if="isGoeiekerels">
            <span class="gk-logo footer-gk-logo">
              <span class="gk-goeie">goeie</span>
              <span class="gk-kerels">kerels</span>
            </span>
          </template>
          <template v-else>
            <h3 class="logo-brand" :class="brand.logoClass">{{ brand.logoText }}<span>{{ brand.logoSpan }}</span></h3>
          </template>
        </div>
        <p>{{ t(brand.description) }}</p>
      </div>
      <div class="footer-col">
        <h4>{{ t('footer.navigation') }}</h4>
        <ul>
          <li v-for="link in navLinks" :key="link.path">
            <NuxtLink :to="localePath(link.path)">{{ t(link.name) }}</NuxtLink>
          </li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>{{ t('footer.contact') }}</h4>
        <p v-if="brand.email">
          <a :href="`mailto:${brand.email}`">{{ brand.email }}</a>
        </p>
        <p v-if="brand.phone">{{ brand.phone }}</p>
        <p v-if="brand.address">{{ brand.address }}</p>
        <p v-if="brand.location">{{ brand.location }}</p>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>&copy; {{ new Date().getFullYear() }} {{ brand.copyright }}. All rights reserved.</p>
    </div>
  </footer>
</template>
<style scoped>
.app-footer {
  background-color: var(--footer-bg);
  color: var(--text);
  padding: 4rem 0 2rem;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 8rem;
  margin-bottom: 3rem;
}
.footer-logo {
  margin-bottom: 2rem;
}
.footer-col h4 {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: var(--accent);
}
.footer-col p {
  color: var(--text-muted);
  font-size: 1.4rem;
}
.footer-col p a {
  color: var(--text-muted);
  text-decoration: none;
}
.footer-col p a:hover {
  color: var(--accent);
}
.footer-col ul {
  list-style: none;
}
.footer-col ul li {
  margin-bottom: 0.35rem;
}
.footer-col ul a {
  color: var(--text-muted);
  font-size: 1.4rem;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-col ul a:hover {
  color: var(--accent);
}
.footer-bottom {
  padding-top: 2rem;
  border-top: 1px solid var(--glass-border);
  text-align: center;
  color: var(--text-muted);
  font-size: 1.2rem;
}
/* goeiekerels footer logo sizing */
.footer-gk-logo {
  gap: 0.1rem;
}
.footer-gk-logo .gk-goeie {
  font-size: 1.1rem;
}
.footer-gk-logo .gk-kerels {
  font-size: 2rem;
}
@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 4rem;
  }
}
</style>
