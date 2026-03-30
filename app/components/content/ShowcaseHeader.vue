<template>
  <div class="section-header text-center reveal-on-scroll active">
    <h2><slot name="title" /></h2>
    <p class="section-sub"><slot name="subtitle" /></p>
  </div>
</template>

<style scoped>
.section-header {
  padding-top: 6rem;
}

.section-sub {
  font-size: 2rem;
  color: var(--text-muted);
  margin: 2.5rem auto 0;
  max-width: 60rem;
}

@media (max-width: 768px) {
  .section-header {
    padding-top: var(--section-padding-mobile, 10rem);
  }
}
</style>
