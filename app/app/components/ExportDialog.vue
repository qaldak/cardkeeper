<script setup lang="ts">
// The table export of the overview: shows what is exported (the selection of the overview) and downloads it as CSV.
defineProps<{
  /** The selection as short texts: game, owner, status, sort order, search and further filters. */
  summary: string[]
  /** How many cards the selection has. */
  count: number
  /** The download address: the filters and the sort order of the overview and the language. */
  href: string
  /** The name of the language the texts are exported in. */
  language: string
}>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
</script>

<template>
  <UModal v-model:open="open" :title="t('export.title')">
    <template #body>
      <div class="flex flex-col gap-4 text-sm">
        <div class="rounded-lg bg-elevated px-3 py-2.5" data-test="export-selection">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {{ t('export.selection') }}
          </p>
          <p>{{ summary.join(' · ') }} · <strong>{{ t('export.cards', { n: count }, count) }}</strong></p>
        </div>
        <ul class="list-disc space-y-1 pl-5 text-muted">
          <li>{{ t('export.details.format') }}</li>
          <li>{{ t('export.details.content') }}</li>
          <li>{{ t('export.details.language', { language }) }}</li>
        </ul>
        <UAlert v-if="count === 0" color="warning" variant="subtle" :title="t('export.empty')" />
      </div>
    </template>
    <template #footer>
      <!-- On the right, the main action first. -->
      <div class="flex w-full justify-end gap-2">
        <!-- A link that downloads; without cards a button that cannot be pressed (a link cannot be disabled). -->
        <UButton v-if="count === 0" icon="i-lucide-download" disabled data-test="export-download">
          {{ t('export.download') }}
        </UButton>
        <UButton v-else as="a" :href="href" download icon="i-lucide-download" data-test="export-download" @click="open = false">
          {{ t('export.download') }}
        </UButton>
        <UButton color="neutral" variant="outline" data-test="export-cancel" @click="open = false">
          {{ t('common.cancel') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
