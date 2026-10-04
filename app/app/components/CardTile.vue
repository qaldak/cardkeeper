<script setup lang="ts">
import type { CardListItemDto } from '#shared/types/api'

const props = defineProps<{ card: CardListItemDto }>()
const { t } = useI18n()
const { money } = useFormat()

const subtitle = computed(() =>
  [props.card.setCode, props.card.price ? money(props.card.price.amount, props.card.price.currency) : null]
    .filter(Boolean)
    .join(' · '),
)
</script>

<template>
  <NuxtLink
    :to="`/cards/${card.id}`"
    class="flex w-[220px] flex-col overflow-hidden rounded-xl border border-default bg-default transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
  >
    <div class="flex h-[140px] items-center justify-center bg-primary-50 text-[13px] text-primary">
      <img
        v-if="card.imageId"
        :src="`/api/images/${card.imageId}`"
        :alt="card.name"
        loading="lazy"
        class="size-full object-cover object-[50%_22%]"
      >
      <span v-else>{{ t('card.noImage') }}</span>
    </div>
    <div class="flex flex-col gap-1.5 p-3.5">
      <span class="text-sm font-semibold">{{ card.name }}</span>
      <span class="text-xs text-muted">{{ subtitle || t('common.none') }}</span>
      <div class="mt-1 flex items-center justify-between">
        <StatusBadge :status="card.status" />
        <span class="text-[11px] text-dimmed">{{ card.player?.name ?? t('common.none') }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
