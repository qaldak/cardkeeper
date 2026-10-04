<script setup lang="ts">
import type { CardDetailDto, GameDto, LookupCandidateDto, PlayerDto } from '#shared/types/api'
import { formatAttributeValue } from '#shared/utils/game-fields'

const { t, locale } = useI18n()
const toast = useToast()
const apiError = useApiError()

useHead({ title: () => t('add.title') })

const { data: games } = await useFetch<GameDto[]>('/api/games')
const { data: players } = await useFetch<PlayerDto[]>('/api/players')

const NONE = 'none'

const gameSlug = ref(games.value?.[0]?.slug ?? '')
const game = computed(() => games.value?.find(entry => entry.slug === gameSlug.value))

// Preselect the card language that matches the UI language when the game supports it.
const language = ref(game.value?.languages.includes(locale.value) ? locale.value : (game.value?.defaultLanguage ?? 'en'))
const query = ref('')
const results = ref<LookupCandidateDto[] | null>(null)
const searching = ref(false)
const searchError = ref('')

const chosen = ref<LookupCandidateDto | null>(null)
const printing = ref(NONE)
const playerId = ref(NONE)
const purchaseDate = ref('')
const submitting = ref(false)

const gameItems = computed(() => (games.value ?? []).map(entry => ({ label: entry.displayName, value: entry.slug })))
const languageItems = computed(() => (game.value?.languages ?? []).map(code => ({ label: code.toUpperCase(), value: code })))
const playerItems = computed(() => [
  { label: t('common.none'), value: NONE },
  ...(players.value ?? []).map(entry => ({ label: entry.name, value: String(entry.id) })),
])
const printingItems = computed(() => [
  { label: t('add.noPrinting'), value: NONE },
  ...(chosen.value?.sets ?? []).map((set, index) => ({
    label: [set.setCode, set.setName, set.rarity].filter(Boolean).join(' · '),
    value: String(index),
  })),
])

async function search() {
  searchError.value = ''
  if (query.value.trim().length < 2) {
    searchError.value = t('add.minChars')
    return
  }
  searching.value = true
  try {
    results.value = await $fetch<LookupCandidateDto[]>('/api/lookup', {
      query: { game: gameSlug.value, q: query.value.trim(), language: language.value },
    })
  }
  catch (error) {
    results.value = null
    searchError.value = apiError(error)
  }
  finally {
    searching.value = false
  }
}

function choose(candidate: LookupCandidateDto) {
  chosen.value = candidate
  printing.value = NONE
}

async function submit() {
  if (!chosen.value) {
    return
  }
  const set = printing.value === NONE ? undefined : chosen.value.sets[Number(printing.value)]
  submitting.value = true
  try {
    const card = await $fetch<CardDetailDto>('/api/cards', {
      method: 'POST',
      body: {
        game: gameSlug.value,
        externalId: chosen.value.externalId,
        language: chosen.value.language,
        set: set ? { setCode: set.setCode, rarity: set.rarity } : undefined,
        playerId: playerId.value === NONE ? null : Number(playerId.value),
        purchaseDate: purchaseDate.value || null,
      },
    })
    toast.add({ title: t('add.added'), color: 'success' })
    await navigateTo(`/cards/${card.id}`)
  }
  catch (error) {
    toast.add({ title: apiError(error), color: 'error' })
  }
  finally {
    submitting.value = false
  }
}

const summaryAttributes = (candidate: LookupCandidateDto) =>
  ['atk', 'def', 'level']
    .filter(key => candidate.attributes[key] !== undefined)
    .map(key => `${t(`card.attributes.${key}`)} ${formatAttributeValue('number', candidate.attributes[key])}`)
    .join(' · ')
</script>

<template>
  <div class="mx-auto max-w-[1040px] px-8 pb-12 pt-6">
    <NuxtLink to="/" class="mb-4 inline-block text-[13px] text-muted no-underline">
      {{ t('common.back') }}
    </NuxtLink>
    <h1 class="mb-6 text-2xl font-semibold">
      {{ t('add.title') }}
    </h1>

    <template v-if="!chosen">
      <form class="mb-6 flex flex-wrap items-end gap-3" @submit.prevent="search">
        <UFormField v-if="gameItems.length > 1" :label="t('add.game')" class="w-44">
          <USelect v-model="gameSlug" :items="gameItems" class="w-full" />
        </UFormField>
        <UFormField :label="t('add.language')" class="w-28">
          <USelect v-model="language" :items="languageItems" class="w-full" />
        </UFormField>
        <UFormField :label="t('add.query')" class="min-w-64 flex-1">
          <UInput v-model="query" :placeholder="t('add.queryPlaceholder')" class="w-full" autofocus />
        </UFormField>
        <UButton type="submit" icon="i-lucide-search" :loading="searching">
          {{ t('add.search') }}
        </UButton>
      </form>

      <p v-if="searchError" class="mb-4 text-sm text-error">
        {{ searchError }}
      </p>

      <template v-if="results">
        <p v-if="results.length === 0" class="text-sm text-muted">
          {{ t('add.noResults') }}
        </p>
        <template v-else>
          <h2 class="mb-3 text-[15px] font-semibold">
            {{ t('add.results') }} ({{ results.length }})
          </h2>
          <ul class="divide-y divide-default overflow-hidden rounded-xl border border-default bg-default">
            <li v-for="candidate in results" :key="candidate.externalId" class="flex flex-wrap items-center gap-3 px-4 py-3">
              <div class="min-w-0 flex-1">
                <p class="font-medium">
                  {{ candidate.name }}
                </p>
                <p class="truncate text-xs text-muted">
                  {{ [candidate.attributes.type, summaryAttributes(candidate), `#${candidate.externalId}`].filter(Boolean).join(' · ') }}
                </p>
              </div>
              <UButton size="sm" variant="outline" @click="choose(candidate)">
                {{ t('add.choose') }}
              </UButton>
            </li>
          </ul>
        </template>
      </template>
    </template>

    <form v-else class="flex max-w-xl flex-col gap-5" @submit.prevent="submit">
      <div class="rounded-xl border border-default bg-default p-4">
        <p class="text-xs text-muted">
          {{ t('add.chosen') }}
        </p>
        <p class="text-lg font-semibold">
          {{ chosen.name }}
        </p>
        <p class="text-xs text-muted">
          {{ [chosen.attributes.type, summaryAttributes(chosen), `#${chosen.externalId}`].filter(Boolean).join(' · ') }}
        </p>
        <UButton size="xs" variant="link" class="mt-2 px-0" @click="chosen = null">
          {{ t('add.changeChoice') }}
        </UButton>
      </div>

      <UFormField :label="t('add.printing')">
        <USelectMenu v-model="printing" :items="printingItems" value-key="value" class="w-full" />
      </UFormField>
      <UFormField :label="t('add.player')">
        <USelect v-model="playerId" :items="playerItems" class="w-full" />
      </UFormField>
      <UFormField :label="t('add.purchaseDate')">
        <UInput v-model="purchaseDate" type="date" class="w-full" />
      </UFormField>

      <div>
        <UButton type="submit" :loading="submitting" icon="i-lucide-plus">
          {{ t('add.submit') }}
        </UButton>
      </div>
    </form>
  </div>
</template>
