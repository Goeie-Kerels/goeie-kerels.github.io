<script setup lang="ts">
import '~/assets/css/main.css'
import '~/assets/css/brand.css'
const { isAppMode } = useAppMode()
</script>

<template>
  <div class="layout-default">
    <AppHeader />
    <main class="main-content">
      <slot />
    </main>
    <AppFooter v-if="!isAppMode" />
  </div>
</template>

<style scoped>
.layout-default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg);
}

.main-content {
  flex: 1;
}
</style>
