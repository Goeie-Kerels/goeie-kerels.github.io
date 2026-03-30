<script setup lang="ts">
import '~/assets/css/goeiekerels.css'
const { isAppMode } = useAppMode()
const config = useRuntimeConfig()
const brand = (config.public.brands as Record<string, any>)['goeiekerels']
</script>

<template>
  <div class="layout-goeiekerels">
    <AppHeader :show-theme-slider="false" :show-locale-switcher="false" :copyright="brand.copyright" logo-class="logo-goeiekerels">
      <template #logo>
        <span class="gk-logo">Goeie Kerels<span class="gk-dot">.</span></span>
      </template>
    </AppHeader>
    <main class="main-content">
      <slot />
    </main>
    <AppFooter v-if="!isAppMode" />
  </div>
</template>

<style scoped>
.layout-goeiekerels {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg);
}
.main-content {
  flex: 1;
}
</style>
