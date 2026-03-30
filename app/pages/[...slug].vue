<script setup lang="ts">
const route = useRoute()
const pageData = useState('currentPage', () => null)
const { locale, defaultLocale } = useI18n()
const { target } = useBuildTarget()
const contentCollection = target === 'default' ? 'content' : `${target}_content`
const showcaseCollection = target === 'default' ? 'showcase' : `${target}_showcase`

// Map route path to content path: prepend /{target}, treat '/' as '/{target}'
function toContentPath(routePath: string, targetPrefix: string): string {
  // Nuxt Content strips 'index' from path, so /default/index.md → /default
  // Route '/' maps to '/{target}', '/contact' maps to '/{target}/contact'
  const clean = routePath === '/' ? '' : routePath
  return `/${targetPrefix}${clean}`
}

// Fetch content, falling back to showcase collection, then locale fallback
const { data: page } = await useAsyncData(route.path, async () => {
  const contentPath = toContentPath(route.path, target)
  const result = await queryCollection(contentCollection as any).path(contentPath).first()
  if (result) return result

  // Try showcase collection (paths are stored as /showcase/slug, matching route directly)
  const showcaseResult = await queryCollection(showcaseCollection as any).path(route.path).first()
  if (showcaseResult) return showcaseResult

  if (locale.value !== defaultLocale.value) {
    const strippedPath = route.path.replace(new RegExp(`^/${locale.value}`), '') || '/'
    const fallbackPath = toContentPath(strippedPath, target)
    const fallback = await queryCollection(contentCollection as any).path(fallbackPath).first()
    if (fallback) return fallback
    return queryCollection(showcaseCollection as any).path(strippedPath).first()
  }
  return null
})

if (page.value) pageData.value = page.value
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: false })
}

// SEO
useSeoMeta({
  title: page.value.title,
  description: page.value.description,
  ogTitle: page.value.title,
  ogDescription: page.value.description,
  ogImage: 'https://toffekerels.nl/og-image-v2.png',
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: page.value.title ?? 'Toffe Kerels',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://toffekerels.nl/og-image-v2.png'
})

</script>

<template>
  <div class="page-container">
    <ContentRenderer v-if="page" :value="page" />
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--bg);
}
</style>
