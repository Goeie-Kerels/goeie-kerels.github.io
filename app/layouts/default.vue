<script setup lang="ts">
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
