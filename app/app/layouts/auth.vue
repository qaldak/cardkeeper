<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen px-4 pt-16">
    <h1 class="mb-8 text-center text-2xl font-semibold">
      {{ t('app.title') }}
    </h1>
    <slot />
  </div>
</template>
