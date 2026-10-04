<script setup lang="ts">
import type { CardStatusValue } from '#shared/utils/status'

const props = defineProps<{ status: CardStatusValue }>()
const { t } = useI18n()

// Colors follow the UI mockups: green for active, red for lost, neutral for everything given away.
const styles: Record<CardStatusValue, string> = {
  ACTIVE: 'bg-[#E6F4EA] text-[#1F7A3D]',
  SOLD: 'bg-[#EEF1F5] text-[#51606F]',
  TRADED: 'bg-[#EEF1F5] text-[#51606F]',
  GIFTED: 'bg-[#EEF1F5] text-[#51606F]',
  LOST: 'bg-[#FBEAE7] text-[#AD4634]',
}
</script>

<template>
  <span class="rounded-full px-2.5 py-[3px] text-[11px] font-medium" :class="styles[props.status]">
    {{ t(`status.${props.status}`) }}
  </span>
</template>
