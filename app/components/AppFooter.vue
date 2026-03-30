<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { brand } = useBuildTarget()
const { data: navPages } = await useAsyncData(`footer-nav-links-${brand.id}`, () =>
  queryCollection('brand_content' as any)
    .where('nav', 'IS NOT NULL', '')
    .order('order', 'ASC')
    .select('path', 'nav', 'order')
    .all()
)
const navLinks = computed(() =>
  (navPages.value ?? []).map(p => ({
    name: p.nav as string,
    path: p.path.replace('/' + brand.contentDir, '') || '/'
  }))
)
</script>
<template>
  <footer class="app-footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-logo">
          <h3 class="logo-brand" :class="brand.logoClass">{{ brand.logoText }}<span>{{ brand.logoSpan }}</span><span v-if="brand.logoDot" class="logo-dot">{{ brand.logoDot }}</span></h3>
        </div>
        <p>{{ t(brand.descriptionKey) }}</p>
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
@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 4rem;
  }
}
</style>
