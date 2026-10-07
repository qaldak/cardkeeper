<script setup lang="ts">
import type { GameSetDto, SetCardDto } from '#shared/types/api'
import { getGameConfig } from '#shared/utils/game-config'
import { formatPrintedNumber, normalizeCardNumberInput, parseCardNumber, sameCardNumber } from '#shared/utils/pokemon-number'

// Finds a Pokémon card by what is printed on it: the set (name, logo) and the number ("040/088").
// There is no set code on the card, and Japanese cards cannot be searched by name, so the set is chosen first.

const emit = defineEmits<{ select: [externalId: string] }>()

const { t } = useI18n()
const apiError = useApiError()

const languages = getGameConfig('pokemon').languages
// German is preselected: it is the language of the cards in this collection and of the names shown afterwards. A set that was
// never released in German may be missing in that list; switch to English or Japanese for it.
const language = ref<string>(languages.includes('de') ? 'de' : languages[0]!)
const numberInput = ref('')
const setFilter = ref('')

const sets = ref<GameSetDto[]>([])
const loadingSets = ref(false)
const error = ref('')

const chosenSet = ref<GameSetDto | null>(null)
const setCards = ref<SetCardDto[]>([])
const loadingCards = ref(false)
const pickedId = ref<string | null>(null)

const languageItems = computed(() => languages.map(code => ({ label: t(`add.bySet.language.${code}`), value: code })))
const parsed = computed(() => parseCardNumber(numberInput.value))
// The slash is optional while typing ("040088"); the field shows the printed form "040/088" once it is left.
const showPrintedForm = () => {
  numberInput.value = normalizeCardNumberInput(numberInput.value)
}

async function loadSets() {
  loadingSets.value = true
  error.value = ''
  chosenSet.value = null
  setCards.value = []
  try {
    sets.value = await $fetch<GameSetDto[]>('/api/sets', { query: { game: 'pokemon', language: language.value } })
  }
  catch (failure) {
    sets.value = []
    error.value = apiError(failure)
  }
  finally {
    loadingSets.value = false
  }
}
watch(language, loadSets, { immediate: true })

// The printed size of the set ("088") narrows the sets down; the typed text narrows them by name or id.
const visibleSets = computed(() => {
  const total = parsed.value?.total ?? null
  const text = setFilter.value.trim().toLowerCase()
  return sets.value.filter(set =>
    (total === null || set.official === total)
    && (!text || set.name.toLowerCase().includes(text) || set.id.toLowerCase().includes(text)))
})

async function chooseSet(set: GameSetDto) {
  chosenSet.value = set
  setCards.value = []
  pickedId.value = null
  loadingCards.value = true
  error.value = ''
  try {
    setCards.value = await $fetch<SetCardDto[]>(`/api/sets/${encodeURIComponent(set.id)}`, {
      query: { game: 'pokemon', language: language.value },
    })
  }
  catch (failure) {
    error.value = apiError(failure)
  }
  finally {
    loadingCards.value = false
  }
}

// The card with the typed number; an explicit click on another card of the set wins.
const matching = computed(() => parsed.value
  ? setCards.value.filter(card => sameCardNumber(card.number, parsed.value!.number))
  : [])
const picked = computed(() =>
  setCards.value.find(card => card.externalId === pickedId.value) ?? (matching.value.length === 1 ? matching.value[0] : undefined))

// The typed size does not belong to this set: a hint that the wrong set was chosen.
const sizeMismatch = computed(() =>
  parsed.value?.total != null && chosenSet.value?.official != null && parsed.value.total !== chosenSet.value.official)
const numberMissing = computed(() => !!parsed.value && !loadingCards.value && setCards.value.length > 0 && matching.value.length === 0)

const printed = (set: GameSetDto) => set.official === null ? `${set.total ?? '?'}` : `${set.official}`
</script>

<template>
  <div class="flex flex-col gap-5" data-test="set-picker">
    <div class="flex flex-wrap items-end gap-3">
      <UFormField :label="t('add.bySet.language.label')" class="w-52">
        <USelect v-model="language" :items="languageItems" class="w-full" />
      </UFormField>
      <UFormField :label="t('add.bySet.number')" class="w-56">
        <UInput
          v-model="numberInput"
          :placeholder="t('add.bySet.numberPlaceholder')"
          class="w-full"
          data-test="number-input"
          @blur="showPrintedForm"
          @keydown.enter.prevent="showPrintedForm"
        />
      </UFormField>
      <UFormField :label="t('add.bySet.filter')" class="min-w-52 flex-1">
        <UInput v-model="setFilter" :placeholder="t('add.bySet.filterPlaceholder')" class="w-full" />
      </UFormField>
    </div>

    <p v-if="numberInput.trim() && !parsed" class="text-sm text-error">
      {{ t('add.bySet.invalidNumber') }}
    </p>
    <p v-if="error" class="text-sm text-error">
      {{ error }}
    </p>

    <section v-if="!chosenSet">
      <h2 class="mb-1 text-[15px] font-semibold">
        {{ t('add.bySet.sets') }} ({{ visibleSets.length }})
      </h2>
      <p class="mb-3 text-xs text-dimmed">
        {{ parsed?.total != null ? t('add.bySet.filteredBySize', { total: parsed.total }) : t('add.bySet.setHint') }}
      </p>
      <p v-if="loadingSets" class="text-sm text-muted">
        {{ t('add.bySet.loading') }}
      </p>
      <p v-else-if="visibleSets.length === 0" class="text-sm text-muted">
        {{ t('add.bySet.noSets') }}
      </p>
      <ul v-else class="grid max-h-[28rem] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="set in visibleSets" :key="set.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border border-default bg-default p-3 text-left hover:border-primary"
            :data-test="`set-${set.id}`"
            @click="chooseSet(set)"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{{ set.name }}</span>
              <span class="block truncate text-xs text-muted">{{ set.id }} · {{ t('add.bySet.cards', { official: printed(set) }) }}</span>
            </span>
            <RemoteImage v-if="set.logoUrl" :src="set.logoUrl" :alt="set.name" loading="lazy" class="h-8 max-w-20 shrink-0 object-contain" />
          </button>
        </li>
      </ul>
    </section>

    <section v-else>
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <RemoteImage v-if="chosenSet.logoUrl" :src="chosenSet.logoUrl" :alt="chosenSet.name" class="h-8 max-w-24 object-contain" />
        <div>
          <p class="text-sm font-semibold">
            {{ chosenSet.name }}
          </p>
          <p class="text-xs text-muted">
            {{ chosenSet.id }} · {{ t('add.bySet.cards', { official: printed(chosenSet) }) }}
          </p>
        </div>
        <UButton size="xs" variant="link" @click="chosenSet = null">
          {{ t('add.bySet.changeSet') }}
        </UButton>
      </div>

      <p v-if="sizeMismatch" class="mb-3 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning" data-test="size-mismatch">
        {{ t('add.bySet.sizeMismatch', { typed: parsed!.total, official: chosenSet.official }) }}
      </p>
      <p v-if="numberMissing" class="mb-3 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning" data-test="number-missing">
        {{ t('add.bySet.numberMissing', { number: parsed!.number }) }}
      </p>

      <div
        v-if="picked"
        class="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-primary bg-default p-4"
        data-test="picked"
      >
        <RemoteImage v-if="picked.thumbnailUrl" :src="picked.thumbnailUrl" :alt="picked.name" class="h-24 w-[70px] rounded bg-primary-50 object-cover" />
        <div class="min-w-0 flex-1">
          <p class="text-xs text-muted">
            {{ t('add.bySet.found') }}
          </p>
          <p class="text-lg font-semibold">
            {{ picked.name }}
          </p>
          <p class="text-xs text-muted">
            {{ formatPrintedNumber(picked.number, chosenSet.official) }} · {{ chosenSet.name }} · {{ picked.externalId }}
          </p>
        </div>
        <UButton icon="i-lucide-check" data-test="use-card" @click="emit('select', picked.externalId)">
          {{ t('add.bySet.use') }}
        </UButton>
      </div>

      <p v-if="loadingCards" class="text-sm text-muted">
        {{ t('add.bySet.loading') }}
      </p>
      <ul v-else class="grid max-h-[28rem] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6">
        <li v-for="card in setCards" :key="card.externalId">
          <button
            type="button"
            class="flex w-full flex-col items-center gap-1 rounded-lg border p-1.5 text-center hover:border-primary"
            :class="picked?.externalId === card.externalId ? 'border-primary bg-primary-50' : 'border-default bg-default'"
            :data-test="`card-${card.externalId}`"
            @click="pickedId = card.externalId"
          >
            <RemoteImage v-if="card.thumbnailUrl" :src="card.thumbnailUrl" :alt="card.name" loading="lazy" class="aspect-[5/7] w-full rounded bg-primary-50 object-cover" />
            <span class="text-xs font-medium">{{ card.number }}</span>
            <span class="w-full truncate text-[11px] text-muted">{{ card.name }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
