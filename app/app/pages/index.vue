<script setup lang="ts">
import type { CardListResponseDto, FacetsDto, GameDto, PlayerDto } from '#shared/types/api'
import { CARD_STATUSES, isCardStatus } from '#shared/utils/status'

const { t } = useI18n()
const { money } = useFormat()
const route = useRoute()
const router = useRouter()

useHead({ title: () => t('nav.overview') })

const { data: games } = await useFetch<GameDto[]>('/api/games')
const { data: players } = await useFetch<PlayerDto[]>('/api/players')

const one = (value: unknown) => (typeof value === 'string' && value !== '' ? value : undefined)
// Accepts query strings and the numbers a number input emits; anything else means "no limit".
const levelOf = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(one(value))
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

// The first registered game is selected by default so the game chip is always filled, as in the mockup.
const game = computed(() => one(route.query.game) ?? games.value?.[0]?.slug)
const status = computed(() => {
  const value = one(route.query.status)
  return isCardStatus(value) ? value : undefined
})
const player = computed(() => one(route.query.player))
const q = computed(() => one(route.query.q))
const cardType = computed(() => one(route.query.cardType))
const race = computed(() => one(route.query.race))
const attribute = computed(() => one(route.query.attribute))
const rarity = computed(() => one(route.query.rarity))
const levelMin = computed(() => levelOf(route.query.levelMin))
const levelMax = computed(() => levelOf(route.query.levelMax))
const page = computed(() => Math.max(1, Number(one(route.query.page)) || 1))

const apiQuery = computed(() => ({
  game: game.value,
  status: status.value,
  player: player.value,
  q: q.value,
  cardType: cardType.value,
  race: race.value,
  attribute: attribute.value,
  rarity: rarity.value,
  levelMin: levelMin.value,
  levelMax: levelMax.value,
  page: page.value,
}))

const { data, error } = await useFetch<CardListResponseDto>('/api/cards', { query: apiQuery })
const { data: facets } = await useFetch<FacetsDto>('/api/facets', { query: computed(() => ({ game: game.value })) })

function setQuery(patch: Record<string, string | number | undefined>) {
  const merged = { ...route.query, page: undefined, ...patch }
  const query = Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined && value !== ''))
  router.push({ query })
}

const ALL = 'all'
const statusItems = computed(() => [
  { label: t('overview.allStatus'), value: ALL },
  ...CARD_STATUSES.map(value => ({ label: t(`status.${value}`), value })),
])
const playerItems = computed(() => [
  { label: t('overview.allPlayers'), value: ALL },
  { label: t('overview.unassigned'), value: 'none' },
  ...(players.value ?? []).map(entry => ({ label: entry.name, value: String(entry.id) })),
])
const facetItems = (allLabel: string, values: string[] | undefined) => [
  { label: allLabel, value: ALL },
  ...(values ?? []).map(value => ({ label: value, value })),
]
const cardTypeItems = computed(() => facetItems(t('overview.filters.allCardTypes'), facets.value?.types))
const raceItems = computed(() => facetItems(t('overview.filters.allRaces'), facets.value?.races))
const attributeItems = computed(() => facetItems(t('overview.filters.allAttributes'), facets.value?.attributes))
const rarityItems = computed(() => facetItems(t('overview.filters.allRarities'), facets.value?.rarities))

// The level range is typed, so it is applied shortly after the last keystroke.
const levelFrom = ref(levelMin.value?.toString() ?? '')
const levelTo = ref(levelMax.value?.toString() ?? '')
let levelTimer: ReturnType<typeof setTimeout> | undefined
watch([levelFrom, levelTo], ([from, to]) => {
  clearTimeout(levelTimer)
  levelTimer = setTimeout(() => {
    setQuery({ levelMin: levelOf(from), levelMax: levelOf(to) })
  }, 400)
})
// Keep the inputs in sync when the filters are reset or the URL changes (back button).
watch([levelMin, levelMax], ([min, max]) => {
  levelFrom.value = min?.toString() ?? ''
  levelTo.value = max?.toString() ?? ''
})
onBeforeUnmount(() => clearTimeout(levelTimer))

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
  status.value || player.value || q.value || cardType.value || race.value || attribute.value
  || rarity.value || levelMin.value !== undefined || levelMax.value !== undefined,
))

function resetFilters() {
  router.push({ query: game.value && games.value && games.value.length > 1 ? { game: game.value } : {} })
}
</script>

<template>
  <div class="px-8 pb-10 pt-6">
    <p class="mb-4 text-sm text-muted">
      {{ summaryText }}
    </p>

    <div v-if="games && games.length > 1" class="mb-3 flex flex-wrap gap-2">
      <button
        v-for="entry in games"
        :key="entry.slug"
        type="button"
        class="rounded-full border px-4 py-2 text-sm"
        :class="game === entry.slug
          ? 'border-primary bg-primary font-medium text-white'
          : 'border-default bg-default text-muted hover:text-default'"
        @click="setQuery({ game: entry.slug })"
      >
        {{ entry.displayName }}
      </button>
    </div>
    <div v-else-if="games?.[0]" class="mb-3 flex flex-wrap gap-2">
      <span class="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">{{ games[0].displayName }}</span>
    </div>

    <div class="mb-6 flex flex-wrap items-center gap-2">
      <USelect
        :model-value="status ?? ALL"
        :items="statusItems"
        :aria-label="t('overview.statusFilter')"
        class="w-40"
        @update:model-value="(value: string) => setQuery({ status: value === ALL ? undefined : value })"
      />
      <USelect
        :model-value="player ?? ALL"
        :items="playerItems"
        :aria-label="t('overview.playerFilter')"
        class="w-44"
        @update:model-value="(value: string) => setQuery({ player: value === ALL ? undefined : value })"
      />
      <USelect
        :model-value="cardType ?? ALL"
        :items="cardTypeItems"
        :aria-label="t('overview.filters.cardType')"
        class="w-44"
        @update:model-value="(value: string) => setQuery({ cardType: value === ALL ? undefined : value })"
      />
      <USelect
        :model-value="race ?? ALL"
        :items="raceItems"
        :aria-label="t('overview.filters.race')"
        class="w-40"
        @update:model-value="(value: string) => setQuery({ race: value === ALL ? undefined : value })"
      />
      <USelect
        :model-value="attribute ?? ALL"
        :items="attributeItems"
        :aria-label="t('overview.filters.attribute')"
        class="w-40"
        @update:model-value="(value: string) => setQuery({ attribute: value === ALL ? undefined : value })"
      />
      <USelect
        :model-value="rarity ?? ALL"
        :items="rarityItems"
        :aria-label="t('overview.filters.rarity')"
        class="w-44"
        @update:model-value="(value: string) => setQuery({ rarity: value === ALL ? undefined : value })"
      />
      <div class="flex items-center gap-1.5 text-sm text-muted">
        <span>{{ t('overview.filters.level') }}</span>
        <UInput
          v-model="levelFrom"
          type="number"
          min="0"
          max="99"
          :placeholder="t('overview.filters.from')"
          :aria-label="t('overview.filters.levelFrom')"
          class="w-20"
        />
        <span>–</span>
        <UInput
          v-model="levelTo"
          type="number"
          min="0"
          max="99"
          :placeholder="t('overview.filters.to')"
          :aria-label="t('overview.filters.levelTo')"
          class="w-20"
        />
      </div>
      <UButton v-if="hasFilters" color="neutral" variant="ghost" icon="i-lucide-x" @click="resetFilters">
        {{ t('overview.filters.reset') }}
      </UButton>
    </div>

    <UAlert v-if="error" color="error" variant="subtle" :title="t('errors.unknown')" class="mb-4" />

    <div v-if="data && data.items.length > 0" class="flex flex-wrap gap-5">
      <CardTile v-for="card in data.items" :key="card.id" :card="card" />
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
      <UButton
        color="neutral"
        variant="outline"
        :disabled="page <= 1"
        @click="setQuery({ page: page - 1 })"
      >
        {{ t('common.previous') }}
      </UButton>
      <span class="text-muted">{{ t('common.page', { page, pages: pageCount }) }}</span>
      <UButton
        color="neutral"
        variant="outline"
        :disabled="page >= pageCount"
        @click="setQuery({ page: page + 1 })"
      >
        {{ t('common.next') }}
      </UButton>
    </nav>
  </div>
</template>
