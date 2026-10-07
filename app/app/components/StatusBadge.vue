<script setup lang="ts">
import type { CardStatusValue } from '#shared/utils/status'

const props = defineProps<{ status: CardStatusValue }>()
const { t } = useI18n()

// Colors follow the UI mockups: green for active, red for lost, neutral for everything given away.
const styles: Record<CardStatusValue, string> = {
  ACTIVE: 'bg-(--app-ok-bg) text-(--app-ok-fg)',
  SOLD: 'bg-(--app-neutral-bg) text-(--app-neutral-fg)',
  TRADED: 'bg-(--app-neutral-bg) text-(--app-neutral-fg)',
  GIFTED: 'bg-(--app-neutral-bg) text-(--app-neutral-fg)',
  LOST: 'bg-(--app-lost-bg) text-(--app-lost-fg)',
}
</script>

<template>
  <span class="rounded-full px-2.5 py-[3px] text-[11px] font-medium" :class="styles[props.status]">
    {{ t(`status.${props.status}`) }}
  </span>
</template>
