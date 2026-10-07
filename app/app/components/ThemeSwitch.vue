<script setup lang="ts">
// Light, dark or "system" (follows the device). The choice is remembered in the browser by Nuxt's color mode.
const { t } = useI18n()
const colorMode = useColorMode()

const options = [
  { value: 'light', icon: 'i-lucide-sun' },
  { value: 'dark', icon: 'i-lucide-moon' },
  { value: 'system', icon: 'i-lucide-monitor' },
] as const
</script>

<template>
  <!-- The stored choice is only known in the browser, so the server renders an empty box of the same size. -->
  <ClientOnly>
    <div role="group" :aria-label="t('theme.label')" class="flex gap-0.5 rounded-lg border border-default bg-elevated p-[3px]" data-test="theme-switch">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="flex size-8 items-center justify-center rounded-md"
        :class="colorMode.preference === option.value ? 'bg-default text-highlighted' : 'text-muted hover:text-default'"
        :aria-pressed="colorMode.preference === option.value"
        :aria-label="t(`theme.${option.value}`)"
        :title="t(`theme.${option.value}`)"
        :data-test="`theme-${option.value}`"
        @click="colorMode.preference = option.value"
      >
        <UIcon :name="option.icon" class="size-4" />
      </button>
    </div>
    <template #fallback>
      <div class="h-10 w-[108px]" />
    </template>
  </ClientOnly>
</template>
