<script setup lang="ts">
import type { CardDetailDto, GameDto, LookupCandidateDto } from '#shared/types/api'
import type { PokemonAttributes } from '#shared/types/pokemon'
import { formatAttributeValue } from '#shared/utils/game-fields'
import { getGameConfig } from '#shared/utils/game-config'
import { formatPrintedNumber } from '#shared/utils/pokemon-number'
import { initialGame, LAST_GAME_COOKIE } from '#shared/utils/last-game'
import { isSetCode, setCodeSpellings } from '#shared/utils/set-code'

const { t } = useI18n()
const toast = useToast()
const apiError = useApiError()
const labels = useGameLabels()

useHead({ title: () => t('add.title') })

const { data: games } = await useFetch<GameDto[]>('/api/games')
const { user: me } = useAuth()

const NONE = 'none'

// The game chosen last stays selected for the next card. It is remembered per browser in a cookie (not on the
// server), so every person keeps their own choice, and the server can already render the right game.
const lastGame = useCookie<string | null>(LAST_GAME_COOKIE, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', default: () => null })
const gameSlug = ref(initialGame((games.value ?? []).map(entry => entry.slug), lastGame.value))
const config = computed(() => getGameConfig(gameSlug.value))
const isPokemon = computed(() => gameSlug.value === 'pokemon')

// Pokémon: by set and number (what is printed on the card) or by name / card id.
const mode = ref<'set' | 'name'>('set')
const query = ref('')
const results = ref<LookupCandidateDto[] | null>(null)
const searching = ref(false)
const searchError = ref('')

const chosen = ref<LookupCandidateDto | null>(null)
const choosing = ref<string | null>(null)
const printing = ref(NONE)
// Yu-Gi-Oh!: the edition printed on the card (a key such as FIRST_EDITION), chosen with one click. None chosen means
// Unlimited, which is not printed. The card database does not know the edition.
const edition = ref<string | null>(null)
const purchaseDate = ref('')
const submitting = ref(false)

// A search belongs to one game: switching the game starts over.
watch(gameSlug, (slug) => {
  lastGame.value = slug
  results.value = null
  chosen.value = null
  searchError.value = ''
})

const gameItems = computed(() => (games.value ?? []).map(entry => ({ label: entry.displayName, value: entry.slug })))

// Yu-Gi-Oh!: set, code and rarity. Pokémon: the card is fixed, the choice is the variant of the physical card.
const printingLabel = (set: LookupCandidateDto['sets'][number]) => isPokemon.value
  ? [labels.variant(set.edition), set.rarity, set.setName].filter(Boolean).join(' · ')
  : [set.setCode, set.setName, set.rarity].filter(Boolean).join(' · ')
const printingItems = computed(() => [
  ...(config.value.printingRequired ? [] : [{ label: t('add.noPrinting'), value: NONE }]),
  ...(chosen.value?.sets ?? []).map((set, index) => ({ label: printingLabel(set), value: String(index) })),
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
      query: { game: gameSlug.value, q: query.value.trim() },
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

// The search result only carries the printings of one language (or none); loading the card again
// gives the printings of both languages to choose from.
async function choose(externalId: string) {
  choosing.value = externalId
  try {
    chosen.value = await $fetch<LookupCandidateDto>(`/api/lookup/${encodeURIComponent(externalId)}`, {
      query: { game: gameSlug.value },
    })
    printing.value = config.value.printingRequired && chosen.value.sets.length > 0 ? '0' : NONE
    // Found by the set code of a print ("L5DD-DEA15", or its English "L5DD-ENA15"): that print is preselected.
    if (!isPokemon.value && isSetCode(query.value)) {
      const prints = chosen.value.sets
      const index = setCodeSpellings(query.value)
        .map(code => prints.findIndex(set => set.setCode.toUpperCase() === code))
        .find(found => found >= 0)
      if (index !== undefined) {
        printing.value = String(index)
      }
    }
    edition.value = null
  }
  catch (error) {
    toast.add({ title: apiError(error), color: 'error' })
  }
  finally {
    choosing.value = null
  }
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
        set: set ? { setCode: set.setCode, rarity: set.rarity, edition: config.value.editions.length > 0 ? edition.value : set.edition } : undefined,
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

function subline(candidate: LookupCandidateDto): string {
  if (isPokemon.value) {
    const attributes = candidate.attributes as Partial<PokemonAttributes>
    return [
      attributes.category ? labels.pokemonCategory(attributes.category) : null,
      attributes.hp ? `${t('pokemon.fields.hp')} ${attributes.hp}` : null,
      attributes.types?.map(labels.pokemonType).join(', '),
      attributes.localId ? formatPrintedNumber(attributes.localId, attributes.setCardCount?.official) : null,
      candidate.sets[0]?.setName,
      `#${candidate.externalId}`,
    ].filter(Boolean).join(' · ')
  }
  const stats = ['atk', 'def', 'level']
    .filter(key => candidate.attributes[key] !== undefined)
    .map(key => `${t(`card.attributes.${key}`)} ${formatAttributeValue('number', candidate.attributes[key])}`)
    .join(' · ')
  return [candidate.attributes.type, stats, `#${candidate.externalId}`].filter(Boolean).join(' · ')
}

// The search returns this many cards at most; more means the search should be narrowed down.
const MAX_RESULTS = 50
</script>

<template>
  <div class="mx-auto max-w-[1040px] px-8 pb-12 pt-6">
    <NuxtLink to="/" class="mb-4 inline-block text-[13px] text-muted no-underline">
      {{ t('common.back') }}
    </NuxtLink>
    <h1 class="mb-1 text-2xl font-semibold">
      {{ t('add.title') }}
    </h1>
    <p class="mb-6 text-sm text-muted">
      {{ t('add.languageHint') }}
    </p>

    <template v-if="!chosen">
      <UFormField v-if="gameItems.length > 1" :label="t('add.game')" class="mb-4 w-44">
        <USelect v-model="gameSlug" :items="gameItems" class="w-full" />
      </UFormField>

      <div v-if="isPokemon" class="mb-5 flex gap-1.5" role="group" :aria-label="t('add.bySet.modeLabel')">
        <button
          v-for="entry in (['set', 'name'] as const)"
          :key="entry"
          type="button"
          class="rounded-full border px-3.5 py-1.5 text-sm"
          :class="mode === entry ? 'border-primary bg-primary font-medium text-inverted' : 'border-default bg-default text-muted hover:text-default'"
          :aria-pressed="mode === entry"
          :data-test="`mode-${entry}`"
          @click="mode = entry"
        >
          {{ t(`add.bySet.mode.${entry}`) }}
        </button>
      </div>

      <PokemonSetPicker v-if="isPokemon && mode === 'set'" @select="choose" />

      <form v-else class="mb-6 flex flex-wrap items-end gap-3" @submit.prevent="search">
        <UFormField :label="t('add.query')" class="min-w-64 flex-1">
          <UInput
            v-model="query"
            :placeholder="isPokemon ? t('add.queryPlaceholderPokemon') : t('add.queryPlaceholder')"
            class="w-full"
            autofocus
          />
        </UFormField>
        <UButton type="submit" icon="i-lucide-search" :loading="searching">
          {{ t('add.search') }}
        </UButton>
      </form>

      <p v-if="isPokemon && mode === 'name'" class="-mt-3 mb-5 text-xs text-dimmed">
        {{ t('add.idHint') }}
      </p>

      <p v-if="searchError" class="mb-4 text-sm text-error">
        {{ searchError }}
      </p>

      <template v-if="results && !(isPokemon && mode === 'set')">
        <p v-if="results.length === 0" class="text-sm text-muted">
          {{ t('add.noResults') }}
        </p>
        <template v-else>
          <h2 class="mb-3 text-[15px] font-semibold">
            {{ t('add.results') }} ({{ results.length }})
          </h2>
          <ul class="divide-y divide-default overflow-hidden rounded-xl border border-default bg-default">
            <li v-for="candidate in results" :key="candidate.externalId" class="flex flex-wrap items-center gap-3 px-4 py-3">
              <RemoteImage
                v-if="candidate.thumbnailUrl"
                :src="candidate.thumbnailUrl"
                :alt="candidate.name"
                loading="lazy"
                class="h-16 w-12 shrink-0 rounded bg-(--app-art) object-cover"
              />
              <div class="min-w-0 flex-1">
                <p class="font-medium">
                  {{ candidate.name }}
                  <span v-if="candidate.language !== 'de'" class="ml-1 rounded bg-elevated px-1.5 py-0.5 text-[11px] font-normal uppercase text-muted">
                    {{ candidate.language }}
                  </span>
                </p>
                <p class="truncate text-xs text-muted">
                  {{ subline(candidate) }}
                </p>
              </div>
              <UButton size="sm" variant="outline" :loading="choosing === candidate.externalId" @click="choose(candidate.externalId)">
                {{ t('add.choose') }}
              </UButton>
            </li>
          </ul>
          <p v-if="results.length >= MAX_RESULTS" class="mt-3 text-xs text-dimmed">
            {{ t('add.manyResults') }}
          </p>
        </template>
      </template>
    </template>

    <form v-else class="flex max-w-xl flex-col gap-5" @submit.prevent="submit">
      <div class="flex gap-4 rounded-xl border border-default bg-default p-4">
        <RemoteImage
          v-if="chosen.thumbnailUrl"
          :src="chosen.thumbnailUrl"
          :alt="chosen.name"
          class="h-24 w-[70px] shrink-0 rounded bg-(--app-art) object-cover"
        />
        <div>
          <p class="text-xs text-muted">
            {{ t('add.chosen') }}
          </p>
          <p class="text-lg font-semibold">
            {{ chosen.name }}
          </p>
          <p class="text-xs text-muted">
            {{ subline(chosen) }}
          </p>
          <UButton size="xs" variant="link" class="mt-2 px-0" @click="chosen = null">
            {{ t('add.changeChoice') }}
          </UButton>
        </div>
      </div>

      <UFormField :label="isPokemon ? t('add.variant') : t('add.printing')" :hint="config.printingRequired ? t('add.variantRequired') : undefined">
        <USelectMenu v-model="printing" :items="printingItems" value-key="value" class="w-full" />
      </UFormField>
      <UFormField
        v-if="config.editions.length > 0"
        :label="t('add.edition.label')"
        :description="printing === NONE ? t('add.edition.needsPrinting') : t('add.edition.hint')"
      >
        <EditionChips v-model="edition" :choices="config.editions" :disabled="printing === NONE" />
      </UFormField>
      <p class="text-sm text-muted" data-test="owner-note">
        {{ t('add.ownerNote', { name: me?.name ?? '' }) }}
      </p>
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
