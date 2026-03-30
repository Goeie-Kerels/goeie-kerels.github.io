<script setup lang="ts">
</script>

<template>
  <div class="app-container">
    <NuxtRouteAnnouncer />
    <NuxtLayout name="default">
      <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    </NuxtLayout>
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
