<script setup lang="ts">
import type { EditionKey } from '#shared/utils/editions'

// One-click choice of the usual editions. The model is the stored key (FIRST_EDITION), the button shows its translation.
// A click on the chosen one takes it back. Any other edition is typed on the card page.
defineProps<{ choices: readonly EditionKey[], disabled?: boolean }>()
const model = defineModel<string | null>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div role="group" :aria-label="t('add.edition.label')" class="flex flex-wrap gap-1.5" data-test="edition-chips">
    <button
      v-for="choice in choices"
      :key="choice"
      type="button"
      class="rounded-full border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      :class="model === choice ? 'border-primary bg-primary font-medium text-inverted' : 'border-default bg-default text-muted hover:text-default'"
      :aria-pressed="model === choice"
      :disabled="disabled"
      :data-test="`edition-${choice}`"
      @click="model = model === choice ? null : choice"
    >
      {{ t(`edition.${choice}`) }}
    </button>
  </div>
</template>
