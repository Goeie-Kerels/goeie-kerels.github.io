<script setup lang="ts">
const route = useRoute()
const pageData = useState('currentPage', () => null)
const { locale, defaultLocale } = useI18n()
const { brand } = useBuildTarget()
const contentCollection = 'brand_content'
const showcaseCollection = 'brand_showcase'
const contentDir = brand.contentDir as string

// Map route path to content path: prepend /{contentDir}, treat '/' as '/{contentDir}'
function toContentPath(routePath: string, prefix: string): string {
  // Nuxt Content strips 'index' from path, so /toffekerels/index.md → /toffekerels
  // Route '/' maps to '/{prefix}', '/contact' maps to '/{prefix}/contact'
  const clean = routePath === '/' ? '' : routePath
  return `/${prefix}${clean}`
}

// Fetch content, falling back to showcase collection, then locale fallback
const { data: page } = await useAsyncData(route.path, async () => {
  const contentPath = toContentPath(route.path, contentDir)
  const result = await queryCollection(contentCollection as any).path(contentPath).first()
  if (result) return result
  // Try showcase collection (paths are stored as /{showcaseDir}/slug — prepend prefix)
  const showcasePath = toContentPath(route.path, brand.showcaseDir as string)
  const showcaseResult = await queryCollection(showcaseCollection as any).path(showcasePath).first()
  if (showcaseResult) return showcaseResult
  if (locale.value !== defaultLocale.value) {
    const strippedPath = route.path.replace(new RegExp(`^/${locale.value}`), '') || '/'
    const fallbackPath = toContentPath(strippedPath, contentDir)
    const fallback = await queryCollection(contentCollection as any).path(fallbackPath).first()
    if (fallback) return fallback
    const fallbackShowcasePath = toContentPath(strippedPath, brand.showcaseDir as string)
    return queryCollection(showcaseCollection as any).path(fallbackShowcasePath).first()
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
  ogImage: `${brand.url}/og-image.png`,
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: page.value.title ?? brand.ogImageAlt,
  twitterCard: 'summary_large_image',
  twitterImage: `${brand.url}/og-image.png`
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
