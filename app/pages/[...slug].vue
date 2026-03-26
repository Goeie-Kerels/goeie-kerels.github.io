<script setup lang="ts">
const route = useRoute()
const { locale, defaultLocale } = useI18n()
// Fetch content, falling back to the default-locale path if no translation exists
const { data: page } = await useAsyncData(route.path, async () => {
  const result = await queryCollection('content').path(route.path).first()
  if (result) return result
  if (locale.value !== defaultLocale.value) {
    const fallbackPath = route.path.replace(new RegExp(`^/${locale.value}`), '') || '/'
    return queryCollection('content').path(fallbackPath).first()
  }
  return null
})

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
