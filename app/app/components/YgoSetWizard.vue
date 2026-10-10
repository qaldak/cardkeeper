<script setup lang="ts">
import type { CardDetailDto, GameSetDto, SetCardDto } from '#shared/types/api'
import { foldEszett } from '#shared/utils/eszett'
import { getGameConfig } from '#shared/utils/game-config'
import { SET_IMPORT_REGIONS, type SetImportLanguage } from '#shared/utils/set-code'
import { buildImportRows, importBody, isConflict, needsChoice, shownSetCode, visibleRows, type ImportRow } from '#shared/utils/set-import'

// Adds all cards of a set at once, like a wizard: choose the set, choose the language of the cards (the set codes are
// stored in it), check the cards that are not clear, add them. Only what is unclear has to be decided by the person.

const { t } = useI18n()
const apiError = useApiError()
const labels = useGameLabels()

const GAME = 'ygo'
const PARALLEL = 3
const editionKeys = getGameConfig(GAME).editions

type Step = 'set' | 'review' | 'run'
const step = ref<Step>('set')
const steps = computed(() => (['set', 'review', 'run'] as const).map((key, index) => ({ key, number: index + 1, label: t(`add.setImport.steps.${key}`) })))

// 1. The set
const sets = ref<GameSetDto[]>([])
const loadingSets = ref(true)
const filter = ref('')
const error = ref('')
try {
  sets.value = await $fetch<GameSetDto[]>('/api/sets', { query: { game: GAME } })
}
catch (failure) {
  error.value = apiError(failure)
}
loadingSets.value = false

const MAX_LISTED = 100
const visibleSets = computed(() => {
  const text = foldEszett(filter.value.trim())
  return sets.value
    .filter(set => !text || foldEszett(set.name).includes(text) || (set.code ?? '').toLowerCase().includes(text))
    .slice(0, MAX_LISTED)
})
const dateOf = (set: GameSetDto) => set.releasedAt ? new Date(set.releasedAt).toLocaleDateString() : ''

// 2. Language, edition and cards
const chosenSet = ref<GameSetDto | null>(null)
const language = ref<SetImportLanguage>('de')
const region = computed(() => SET_IMPORT_REGIONS[language.value])
const languageItems = computed(() => (Object.keys(SET_IMPORT_REGIONS) as SetImportLanguage[]).map(code => ({ label: t(`add.setImport.languages.${code}`), value: code })))
const setEdition = ref<string | null>(null)
const rows = ref<ImportRow[]>([])
const loadingCards = ref(false)

async function loadCards(set: GameSetDto) {
  loadingCards.value = true
  error.value = ''
  try {
    const cards = await $fetch<SetCardDto[]>(`/api/sets/${encodeURIComponent(set.id)}`, { query: { game: GAME, language: language.value } })
    // Changing the language keeps what was decided for a card.
    const before = new Map(rows.value.map(row => [row.externalId, row]))
    rows.value = buildImportRows(cards).map((row) => {
      const old = before.get(row.externalId)
      return old ? { ...row, include: old.include, printIndex: old.printIndex ?? row.printIndex, edition: old.edition } : row
    })
    return true
  }
  catch (failure) {
    error.value = apiError(failure)
    return false
  }
  finally {
    loadingCards.value = false
  }
}

async function chooseSet(set: GameSetDto) {
  chosenSet.value = set
  showAll.value = false
  rows.value = []
  if (await loadCards(set)) {
    step.value = 'review'
  }
}
watch(language, () => {
  if (chosenSet.value && step.value === 'review') {
    void loadCards(chosenSet.value)
  }
})

// Only the cards that need a decision are shown. The others are added as they are; whoever wants to leave single
// cards out opens the whole list.
const showAll = ref(false)
const shownRows = computed(() => visibleRows(rows.value, showAll.value))
const clearCount = computed(() => rows.value.filter(row => !isConflict(row) && row.include).length)
const conflictCount = computed(() => rows.value.filter(isConflict).length)

const selected = computed(() => rows.value.filter(row => row.include))
const open = computed(() => rows.value.filter(needsChoice))
const allIncluded = computed(() => rows.value.filter(row => row.prints.length > 0).every(row => row.include))
function toggleAll() {
  const value = !allIncluded.value
  rows.value.forEach((row) => {
    row.include = value && row.prints.length > 0
  })
}

const printItems = (row: ImportRow) => row.prints.map((print, index) => ({
  label: `${print.rarity ?? '–'} · ${shownSetCode({ ...row, printIndex: index }, region.value)}`,
  value: index,
}))

// The edition of a single card: the one of the whole set unless it is set here.
const SAME = 'same'
const NONE = 'none'
const rowEditionItems = computed(() => [
  { label: t('add.setImport.sameEdition'), value: SAME },
  { label: t('add.setImport.noEdition'), value: NONE },
  ...editionKeys.map(key => ({ label: labels.edition(key), value: key })),
])
const rowEdition = (row: ImportRow) => row.edition === undefined ? SAME : row.edition === null ? NONE : row.edition
const setRowEdition = (row: ImportRow, value: string) => {
  row.edition = value === SAME ? undefined : value === NONE ? null : value
}

// 3. Adding
type State = { state: 'wait' | 'busy' | 'ok' | 'error', message?: string }
const status = reactive<Record<string, State>>({})
const running = ref(false)
const total = computed(() => Object.keys(status).length)
const done = computed(() => Object.values(status).filter(entry => entry.state === 'ok').length)
const failed = computed(() => rows.value.filter(row => status[row.externalId]?.state === 'error'))
const finished = computed(() => step.value === 'run' && !running.value && total.value > 0)

async function addAll(targets: ImportRow[]) {
  running.value = true
  targets.forEach((row) => {
    status[row.externalId] = { state: 'wait' }
  })
  const queue = [...targets]
  const worker = async () => {
    for (let row = queue.shift(); row; row = queue.shift()) {
      status[row.externalId] = { state: 'busy' }
      const body = importBody(row, region.value, setEdition.value)
      try {
        await $fetch<CardDetailDto>('/api/cards', { method: 'POST', body })
        status[row.externalId] = { state: 'ok' }
      }
      catch (failure) {
        status[row.externalId] = { state: 'error', message: apiError(failure) }
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker))
  running.value = false
}

function start() {
  step.value = 'run'
  Object.keys(status).forEach(key => Reflect.deleteProperty(status, key))
  void addAll(selected.value)
}
const retry = () => addAll(failed.value)

function another() {
  showAll.value = false
  Object.keys(status).forEach(key => Reflect.deleteProperty(status, key))
  rows.value = []
  chosenSet.value = null
  step.value = 'set'
}
</script>

<template>
  <div class="flex flex-col gap-5" data-test="set-wizard">
    <ol class="flex flex-wrap gap-2 text-sm" data-test="wizard-steps">
      <li
        v-for="entry in steps"
        :key="entry.key"
        class="flex items-center gap-2 rounded-full border px-3 py-1"
        :class="entry.key === step ? 'border-primary bg-primary font-medium text-inverted' : 'border-default text-muted'"
        :aria-current="entry.key === step ? 'step' : undefined"
      >
        <span class="font-semibold">{{ entry.number }}</span> {{ entry.label }}
      </li>
    </ol>

    <p v-if="error" class="text-sm text-error" data-test="wizard-error">
      {{ error }}
    </p>

    <!-- 1. Set -->
    <section v-if="step === 'set'">
      <UFormField :label="t('add.setImport.searchLabel')" class="mb-3 max-w-md">
        <UInput v-model="filter" :placeholder="t('add.setImport.searchPlaceholder')" class="w-full" data-test="set-filter" autofocus />
      </UFormField>
      <p v-if="loadingSets || loadingCards" class="text-sm text-muted">
        {{ t('add.setImport.loading') }}
      </p>
      <p v-else-if="visibleSets.length === 0" class="text-sm text-muted">
        {{ t('add.setImport.noSets') }}
      </p>
      <ul v-else class="max-h-[28rem] divide-y divide-default overflow-y-auto rounded-xl border border-default bg-default">
        <li v-for="set in visibleSets" :key="set.id">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-elevated"
            :data-test="`set-${set.code ?? set.id}`"
            @click="chooseSet(set)"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{{ set.name }}</span>
              <span class="block truncate text-xs text-muted">
                {{ [set.code, set.official !== null ? t('add.setImport.cardsCount', { count: set.official }) : null, dateOf(set)].filter(Boolean).join(' · ') }}
              </span>
            </span>
            <UIcon name="i-lucide-chevron-right" class="shrink-0 text-muted" />
          </button>
        </li>
      </ul>
      <p v-if="sets.length > MAX_LISTED && visibleSets.length === MAX_LISTED" class="mt-2 text-xs text-dimmed">
        {{ t('add.setImport.manySets', { count: MAX_LISTED }) }}
      </p>
    </section>

    <!-- 2. Language, edition, cards -->
    <section v-else-if="step === 'review' && chosenSet" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <div>
          <p class="text-lg font-semibold">
            {{ chosenSet.name }}
          </p>
          <p class="text-xs text-muted">
            {{ [chosenSet.code, chosenSet.official !== null ? t('add.setImport.cardsCount', { count: chosenSet.official }) : null].filter(Boolean).join(' · ') }}
          </p>
        </div>
        <UButton size="xs" variant="link" data-test="other-set" @click="another">
          {{ t('add.setImport.otherSet') }}
        </UButton>
      </div>

      <div class="flex flex-wrap items-start gap-6">
        <UFormField :label="t('add.setImport.language')" :description="t('add.setImport.languageHint', { example: `${chosenSet.code ?? 'SDAZ'}-${region}001` })" class="w-72">
          <USelect v-model="language" :items="languageItems" class="w-full" data-test="set-language" />
        </UFormField>
        <UFormField :label="t('add.setImport.edition')" :description="t('add.setImport.editionHint')">
          <EditionChips v-model="setEdition" :choices="editionKeys" />
        </UFormField>
      </div>

      <p v-if="loadingCards" class="text-sm text-muted">
        {{ t('add.setImport.loading') }}
      </p>

      <p v-if="!loadingCards && rows.length > 0 && conflictCount === 0" class="text-sm text-muted" data-test="no-conflicts">
        {{ t('add.setImport.noConflicts') }}
      </p>

      <div v-if="shownRows.length > 0" class="overflow-x-auto rounded-xl border border-default bg-default">
        <table class="w-full text-sm" data-test="set-cards">
          <thead class="border-b border-default text-left text-xs text-muted">
            <tr>
              <th class="w-10 px-3 py-2">
                <UCheckbox v-if="showAll" :model-value="allIncluded" :aria-label="t('add.setImport.toggleAll')" data-test="toggle-all" @update:model-value="toggleAll" />
              </th>
              <th class="px-2 py-2">
                {{ t('add.setImport.card') }}
              </th>
              <th class="px-2 py-2">
                {{ t('add.setImport.code') }}
              </th>
              <th class="px-2 py-2">
                {{ t('add.setImport.rarity') }}
              </th>
              <th class="px-2 py-2">
                {{ t('add.setImport.editionColumn') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="row in shownRows"
              :key="row.externalId"
              :class="needsChoice(row) ? 'bg-warning/10' : ''"
              :data-test="`row-${row.externalId}`"
              :data-open="needsChoice(row) ? 'true' : 'false'"
            >
              <td class="px-3 py-2">
                <UCheckbox v-model="row.include" :disabled="row.prints.length === 0" :aria-label="row.name" />
              </td>
              <td class="px-2 py-2">
                <div class="flex items-center gap-2">
                  <RemoteImage v-if="row.thumbnailUrl" :src="row.thumbnailUrl" :alt="row.name" loading="lazy" class="h-12 w-9 shrink-0 rounded bg-(--app-art) object-cover" />
                  <span class="min-w-0">
                    <span class="block truncate font-medium">{{ row.name }}</span>
                    <span class="block text-xs text-muted">#{{ row.externalId }}</span>
                  </span>
                </div>
              </td>
              <td class="whitespace-nowrap px-2 py-2 font-mono text-xs" data-test="row-code">
                {{ shownSetCode(row, region) ?? '–' }}
              </td>
              <td class="px-2 py-2">
                <span v-if="row.prints.length === 0" class="text-muted">{{ t('add.setImport.noPrint') }}</span>
                <span v-else-if="row.prints.length === 1">{{ row.prints[0]!.rarity ?? '–' }}</span>
                <USelect
                  v-else
                  :model-value="row.printIndex ?? undefined"
                  :items="printItems(row)"
                  :placeholder="t('add.setImport.pleaseChoose')"
                  :color="needsChoice(row) ? 'warning' : 'neutral'"
                  class="w-56"
                  data-test="row-print"
                  @update:model-value="(value: number) => (row.printIndex = value)"
                />
              </td>
              <td class="px-2 py-2">
                <USelect :model-value="rowEdition(row)" :items="rowEditionItems" size="sm" class="w-44" @update:model-value="(value: string) => setRowEdition(row, value)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="rows.length > 0" class="flex flex-wrap items-center gap-3 text-sm">
        <p class="text-muted" data-test="clear-count">
          {{ showAll ? t('add.setImport.allShown') : t('add.setImport.clearCount', { count: clearCount }) }}
        </p>
        <UButton
          size="xs"
          variant="link"
          :icon="showAll ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          :aria-expanded="showAll"
          data-test="toggle-list"
          @click="showAll = !showAll"
        >
          {{ showAll ? t('add.setImport.showConflicts') : t('add.setImport.showAll', { total: rows.length }) }}
        </UButton>
      </div>

      <div class="sticky bottom-0 flex flex-wrap items-center gap-4 rounded-xl border border-default bg-default px-4 py-3">
        <p class="text-sm text-muted" data-test="summary">
          {{ t('add.setImport.summary', { selected: selected.length, total: rows.length }) }}
        </p>
        <p v-if="open.length > 0" class="text-sm font-medium text-warning" data-test="needs-choice">
          {{ t('add.setImport.needsChoice', { count: open.length }) }}
        </p>
        <UButton class="ml-auto" icon="i-lucide-plus" :disabled="open.length > 0 || selected.length === 0 || loadingCards" data-test="add-all" @click="start">
          {{ t('add.setImport.add', { count: selected.length }) }}
        </UButton>
      </div>
    </section>

    <!-- 3. Adding -->
    <section v-else-if="step === 'run'" class="flex flex-col gap-4" data-test="wizard-run">
      <p class="text-sm" data-test="progress-text">
        {{ t('add.setImport.progress', { done, total }) }}
      </p>
      <UProgress :model-value="done + failed.length" :max="total" />

      <div v-if="finished" class="flex flex-col gap-3" data-test="wizard-done">
        <p v-if="done > 0" class="font-medium text-success">
          {{ t('add.setImport.done', { count: done }) }}
        </p>
        <template v-if="failed.length > 0">
          <p class="text-sm text-error">
            {{ t('add.setImport.failed', { count: failed.length }) }}
          </p>
          <ul class="text-sm" data-test="failed-list">
            <li v-for="row in failed" :key="row.externalId">
              {{ row.name }}: <span class="text-muted">{{ status[row.externalId]?.message }}</span>
            </li>
          </ul>
          <div>
            <UButton variant="outline" icon="i-lucide-refresh-cw" data-test="retry" @click="retry">
              {{ t('add.setImport.retry') }}
            </UButton>
          </div>
        </template>
        <div class="flex flex-wrap gap-3">
          <UButton to="/" icon="i-lucide-layout-grid" data-test="to-overview">
            {{ t('add.setImport.toOverview') }}
          </UButton>
          <UButton variant="outline" data-test="another-set" @click="another">
            {{ t('add.setImport.another') }}
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>
