<script setup lang="ts">
import type { EditionChoice } from '#shared/utils/editions'

// One-click choice of the usual editions ("1st Edition"). A click on the chosen one takes it back. Any other text can
// still be typed where the edition is a free text field.
defineProps<{ choices: readonly EditionChoice[], disabled?: boolean }>()
const model = defineModel<string | null>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div role="group" :aria-label="t('add.edition.label')" class="flex flex-wrap gap-1.5" data-test="edition-chips">
    <button
      v-for="choice in choices"
      :key="choice.value"
      type="button"
      class="rounded-full border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      :class="model === choice.value ? 'border-primary bg-primary font-medium text-inverted' : 'border-default bg-default text-muted hover:text-default'"
      :aria-pressed="model === choice.value"
      :disabled="disabled"
      :data-test="`edition-${choice.key}`"
      @click="model = model === choice.value ? null : choice.value"
    >
      {{ t(`edition.${choice.key}`) }}
    </button>
  </div>
</template>
