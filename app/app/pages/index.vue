<script setup lang="ts">
import type { CardListResponseDto, FacetsDto, GameDto, PlayerDto } from '#shared/types/api'
import { defaultDirection, isCardSort, isSortDirection, sortsForGame } from '#shared/utils/sorting'
import { CARD_STATUSES, isCardStatus } from '#shared/utils/status'

const { t } = useI18n()
const { money } = useFormat()
const labels = useGameLabels()
const route = useRoute()
const router = useRouter()

useHead({ title: () => t('nav.overview') })

const { data: games } = await useFetch<GameDto[]>('/api/games')
const { data: players } = await useFetch<PlayerDto[]>('/api/players')

const one = (value: unknown) => (typeof value === 'string' && value !== '' ? value : undefined)
// Accepts query strings and the numbers a number input emits; anything else means "no limit".
const numberOf = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(one(value))
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

const ALL = 'all'

// The first registered game is selected by default so a game chip is always filled, as in the mockup;
// "all games" is an explicit choice.
const game = computed(() => {
  const value = one(route.query.game)
  return value === ALL ? undefined : (value ?? games.value?.[0]?.slug)
})
const status = computed(() => {
  const value = one(route.query.status)
  return isCardStatus(value) ? value : undefined
})
const player = computed(() => one(route.query.player))
const q = computed(() => one(route.query.q))
const page = computed(() => Math.max(1, Number(one(route.query.page)) || 1))

// Filters that belong to a game; they are cleared when the game changes.
const cardType = computed(() => one(route.query.cardType))
const race = computed(() => one(route.query.race))
const attribute = computed(() => one(route.query.attribute))
const category = computed(() => one(route.query.category))
const pokemonType = computed(() => one(route.query.pokemonType))
const stage = computed(() => one(route.query.stage))
const variant = computed(() => one(route.query.variant))
const rarity = computed(() => one(route.query.rarity))
const levelMin = computed(() => numberOf(route.query.levelMin))
const levelMax = computed(() => numberOf(route.query.levelMax))
const hpMin = computed(() => numberOf(route.query.hpMin))
const hpMax = computed(() => numberOf(route.query.hpMax))
const GAME_FILTER_KEYS = ['cardType', 'race', 'attribute', 'category', 'pokemonType', 'stage', 'variant', 'rarity', 'levelMin', 'levelMax', 'hpMin', 'hpMax']

const availableSorts = computed(() => sortsForGame(game.value))
const sort = computed(() => {
  const value = one(route.query.sort)
  return isCardSort(value) && availableSorts.value.includes(value) ? value : 'created'
})
const direction = computed(() => {
  const value = one(route.query.dir)
  return isSortDirection(value) ? value : defaultDirection(sort.value)
})

const apiQuery = computed(() => ({
  game: game.value,
  status: status.value,
  player: player.value,
  q: q.value,
  cardType: cardType.value,
  race: race.value,
  attribute: attribute.value,
  category: category.value,
  pokemonType: pokemonType.value,
  stage: stage.value,
  variant: variant.value,
  rarity: rarity.value,
  levelMin: levelMin.value,
  levelMax: levelMax.value,
  hpMin: hpMin.value,
  hpMax: hpMax.value,
  sort: sort.value,
  dir: direction.value,
  page: page.value,
}))

const { data, error } = await useFetch<CardListResponseDto>('/api/cards', { query: apiQuery })
const { data: facets } = await useFetch<FacetsDto>('/api/facets', { query: computed(() => ({ game: game.value })) })

function setQuery(patch: Record<string, string | number | undefined>) {
  const merged = { ...route.query, page: undefined, ...patch }
  const query = Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined && value !== ''))
  router.push({ query })
}

function setGame(slug: string | undefined) {
  const cleared = Object.fromEntries(GAME_FILTER_KEYS.map(key => [key, undefined]))
  setQuery({ ...cleared, game: slug ?? ALL, sort: sortsForGame(slug).includes(sort.value) && sort.value !== 'created' ? sort.value : undefined, dir: undefined })
}

const filterValue = (value: string | undefined) => value ?? ALL
const setFilter = (key: string, value: string) => setQuery({ [key]: value === ALL ? undefined : value })

const statusItems = computed(() => [
  { label: t('overview.allStatus'), value: ALL },
  ...CARD_STATUSES.map(value => ({ label: t(`status.${value}`), value })),
])
const playerItems = computed(() => [
  { label: t('overview.allPlayers'), value: ALL },
  { label: t('overview.unassigned'), value: 'none' },
  ...(players.value ?? []).map(entry => ({ label: entry.name, value: String(entry.id) })),
])
const facetItems = (allLabel: string, values: string[] | undefined, translate: (value: string) => string = value => value) => [
  { label: allLabel, value: ALL },
  ...(values ?? []).map(value => ({ label: translate(value), value })),
]
const cardTypeItems = computed(() => facetItems(t('overview.filters.allCardTypes'), facets.value?.types))
const raceItems = computed(() => facetItems(t('overview.filters.allRaces'), facets.value?.races))
const attributeItems = computed(() => facetItems(t('overview.filters.allAttributes'), facets.value?.attributes))
const rarityItems = computed(() => facetItems(t('overview.filters.allRarities'), facets.value?.rarities))
const categoryItems = computed(() => facetItems(t('overview.filters.allCategories'), facets.value?.categories, labels.pokemonCategory))
const pokemonTypeItems = computed(() => facetItems(t('overview.filters.allPokemonTypes'), facets.value?.pokemonTypes, labels.pokemonType))
const stageItems = computed(() => facetItems(t('overview.filters.allStages'), facets.value?.stages, labels.pokemonStage))
const variantItems = computed(() => facetItems(t('overview.filters.allVariants'), facets.value?.variants, labels.variant))

const sortItems = computed(() => availableSorts.value.map(value => ({ label: t(`overview.sort.${value}`), value })))
// Choosing an order starts with its default direction; the arrow button flips it.
const setSort = (value: string) => setQuery({ sort: value === 'created' ? undefined : value, dir: undefined })
const flipDirection = () => setQuery({ dir: direction.value === 'asc' ? 'desc' : 'asc' })

// A typed range (level, HP) is applied shortly after the last keystroke.
function useRange(minKey: string, maxKey: string, min: Ref<number | undefined>, max: Ref<number | undefined>) {
  const from = ref(min.value?.toString() ?? '')
  const to = ref(max.value?.toString() ?? '')
  let timer: ReturnType<typeof setTimeout> | undefined
  watch([from, to], ([nextFrom, nextTo]) => {
    clearTimeout(timer)
    timer = setTimeout(() => setQuery({ [minKey]: numberOf(nextFrom), [maxKey]: numberOf(nextTo) }), 400)
  })
  // Keep the inputs in sync when the filters are reset or the URL changes (back button).
  watch([min, max], ([nextMin, nextMax]) => {
    from.value = nextMin?.toString() ?? ''
    to.value = nextMax?.toString() ?? ''
  })
  onBeforeUnmount(() => clearTimeout(timer))
  return { from, to }
}
const levelRange = useRange('levelMin', 'levelMax', levelMin, levelMax)
const hpRange = useRange('hpMin', 'hpMax', hpMin, hpMax)

const summaryText = computed(() => {
  const summary = data.value?.summary
  if (!summary) {
    return ''
  }
  const count = t('overview.count', { n: summary.count }, summary.count)
  if (summary.totals.length === 0) {
    return count
  }
  const total = summary.totals.map(entry => money(entry.amount, entry.currency)).join(' + ')
  return `${count} · ${t('overview.totalValue', { value: total })}`
})

const pageCount = computed(() => Math.max(1, Math.ceil((data.value?.summary.count ?? 0) / (data.value?.pageSize ?? 48))))
const hasFilters = computed(() => Boolean(
  status.value || player.value || q.value || cardType.value || race.value || attribute.value || category.value
  || pokemonType.value || stage.value || variant.value || rarity.value
  || levelMin.value !== undefined || levelMax.value !== undefined || hpMin.value !== undefined || hpMax.value !== undefined,
))

// The game and the sort order are not filters and stay when the filters are reset.
function resetFilters() {
  const keep = { game: one(route.query.game), sort: one(route.query.sort), dir: one(route.query.dir) }
  router.push({ query: Object.fromEntries(Object.entries(keep).filter(([, value]) => value !== undefined)) as Record<string, string> })
}
</script>

<template>
  <div class="px-8 pb-10 pt-6">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">
        {{ summaryText }}
      </p>
      <div class="flex items-center gap-1.5">
        <USelect
          :model-value="sort"
          :items="sortItems"
          :aria-label="t('overview.sort.label')"
          class="w-48"
          @update:model-value="setSort"
        />
        <UButton
          color="neutral"
          variant="outline"
          :icon="direction === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow'"
          :aria-label="direction === 'asc' ? t('overview.sort.ascending') : t('overview.sort.descending')"
          :title="direction === 'asc' ? t('overview.sort.ascending') : t('overview.sort.descending')"
          @click="flipDirection"
        />
      </div>
    </div>

    <div v-if="games && games.length > 1" class="mb-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full border px-4 py-2 text-sm"
        :class="game === undefined
          ? 'border-primary bg-primary font-medium text-white'
          : 'border-default bg-default text-muted hover:text-default'"
        @click="setGame(undefined)"
      >
        {{ t('overview.allGames') }}
      </button>
      <button
        v-for="entry in games"
        :key="entry.slug"
        type="button"
        class="rounded-full border px-4 py-2 text-sm"
        :class="game === entry.slug
          ? 'border-primary bg-primary font-medium text-white'
          : 'border-default bg-default text-muted hover:text-default'"
        @click="setGame(entry.slug)"
      >
        {{ entry.displayName }}
      </button>
    </div>
    <div v-else-if="games?.[0]" class="mb-3 flex flex-wrap gap-2">
      <span class="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">{{ games[0].displayName }}</span>
    </div>

    <div class="mb-6 flex flex-wrap items-center gap-2">
      <USelect
        :model-value="filterValue(status)"
        :items="statusItems"
        :aria-label="t('overview.statusFilter')"
        class="w-40"
        @update:model-value="(value: string) => setFilter('status', value)"
      />
      <USelect
        :model-value="filterValue(player)"
        :items="playerItems"
        :aria-label="t('overview.playerFilter')"
        class="w-44"
        @update:model-value="(value: string) => setFilter('player', value)"
      />

      <template v-if="game === 'ygo'">
        <USelect :model-value="filterValue(cardType)" :items="cardTypeItems" :aria-label="t('overview.filters.cardType')" class="w-44" @update:model-value="(value: string) => setFilter('cardType', value)" />
        <USelect :model-value="filterValue(race)" :items="raceItems" :aria-label="t('overview.filters.race')" class="w-40" @update:model-value="(value: string) => setFilter('race', value)" />
        <USelect :model-value="filterValue(attribute)" :items="attributeItems" :aria-label="t('overview.filters.attribute')" class="w-40" @update:model-value="(value: string) => setFilter('attribute', value)" />
        <USelect :model-value="filterValue(rarity)" :items="rarityItems" :aria-label="t('overview.filters.rarity')" class="w-44" @update:model-value="(value: string) => setFilter('rarity', value)" />
        <div class="flex items-center gap-1.5 text-sm text-muted">
          <span>{{ t('overview.filters.level') }}</span>
          <UInput v-model="levelRange.from.value" type="number" min="0" max="99" :placeholder="t('overview.filters.from')" :aria-label="t('overview.filters.levelFrom')" class="w-20" />
          <span>–</span>
          <UInput v-model="levelRange.to.value" type="number" min="0" max="99" :placeholder="t('overview.filters.to')" :aria-label="t('overview.filters.levelTo')" class="w-20" />
        </div>
      </template>

      <template v-else-if="game === 'pokemon'">
        <USelect :model-value="filterValue(category)" :items="categoryItems" :aria-label="t('overview.filters.category')" class="w-44" @update:model-value="(value: string) => setFilter('category', value)" />
        <USelect :model-value="filterValue(pokemonType)" :items="pokemonTypeItems" :aria-label="t('overview.filters.pokemonType')" class="w-40" @update:model-value="(value: string) => setFilter('pokemonType', value)" />
        <USelect :model-value="filterValue(stage)" :items="stageItems" :aria-label="t('overview.filters.stage')" class="w-40" @update:model-value="(value: string) => setFilter('stage', value)" />
        <USelect :model-value="filterValue(rarity)" :items="rarityItems" :aria-label="t('overview.filters.rarity')" class="w-44" @update:model-value="(value: string) => setFilter('rarity', value)" />
        <USelect :model-value="filterValue(variant)" :items="variantItems" :aria-label="t('overview.filters.variant')" class="w-44" @update:model-value="(value: string) => setFilter('variant', value)" />
        <div class="flex items-center gap-1.5 text-sm text-muted">
          <span>{{ t('overview.filters.hp') }}</span>
          <UInput v-model="hpRange.from.value" type="number" min="0" max="999" :placeholder="t('overview.filters.from')" :aria-label="t('overview.filters.hpFrom')" class="w-20" />
          <span>–</span>
          <UInput v-model="hpRange.to.value" type="number" min="0" max="999" :placeholder="t('overview.filters.to')" :aria-label="t('overview.filters.hpTo')" class="w-20" />
        </div>
      </template>

      <UButton v-if="hasFilters" color="neutral" variant="ghost" icon="i-lucide-x" @click="resetFilters">
        {{ t('overview.filters.reset') }}
      </UButton>
    </div>

    <UAlert v-if="error" color="error" variant="subtle" :title="t('errors.unknown')" class="mb-4" />

    <div v-if="data && data.items.length > 0" class="flex flex-wrap gap-5">
      <CardTile v-for="card in data.items" :key="card.id" :card="card" :show-game="game === undefined" />
    </div>

    <div v-else-if="data" class="rounded-xl border border-dashed border-accented bg-default px-6 py-12 text-center">
      <template v-if="hasFilters">
        <p class="text-muted">
          {{ t('overview.noResults') }}
        </p>
      </template>
      <template v-else>
        <p class="text-lg font-semibold">
          {{ t('overview.emptyTitle') }}
        </p>
        <p class="mx-auto mb-4 mt-1 max-w-md text-sm text-muted">
          {{ t('overview.emptyText') }}
        </p>
        <UButton to="/cards/new" icon="i-lucide-plus">
          {{ t('nav.addCard') }}
        </UButton>
      </template>
    </div>

    <nav v-if="pageCount > 1" class="mt-8 flex items-center justify-center gap-4 text-sm">
      <UButton color="neutral" variant="outline" :disabled="page <= 1" @click="setQuery({ page: page - 1 })">
        {{ t('common.previous') }}
      </UButton>
      <span class="text-muted">{{ t('common.page', { page, pages: pageCount }) }}</span>
      <UButton color="neutral" variant="outline" :disabled="page >= pageCount" @click="setQuery({ page: page + 1 })">
        {{ t('common.next') }}
      </UButton>
    </nav>
  </div>
</template>
