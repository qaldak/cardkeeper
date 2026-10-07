<script setup lang="ts">
import type { PokemonAttributes, PokemonDetails } from '#shared/types/pokemon'

const props = defineProps<{
  attributes: Record<string, unknown>
  /** Language dependent data of the selected language; null if the card has none for it. */
  details: Record<string, unknown> | null
}>()

const { t } = useI18n()
const labels = useGameLabels()

const attrs = computed(() => props.attributes as unknown as Partial<PokemonAttributes>)
const text = computed(() => (props.details ?? {}) as PokemonDetails)

// The selected language wins, the English values of the attributes are the fallback.
const category = computed(() => text.value.category ?? labels.pokemonCategory(attrs.value.category))
const types = computed(() => text.value.types ?? (attrs.value.types ?? []).map(labels.pokemonType))
const stage = computed(() => text.value.stage ?? labels.pokemonStage(attrs.value.stage))
const trainerType = computed(() => text.value.trainerType ?? labels.trainerType(attrs.value.trainerType))
const energyType = computed(() => text.value.energyType ?? labels.energyType(attrs.value.energyType))
const evolveFrom = computed(() => text.value.evolveFrom ?? attrs.value.evolveFrom)
const number = computed(() => {
  const count = attrs.value.setCardCount?.official
  return attrs.value.localId ? (count ? `${attrs.value.localId}/${count}` : attrs.value.localId) : ''
})

const facts = computed(() => [
  { key: 'category', value: category.value },
  { key: 'hp', value: attrs.value.hp },
  { key: 'types', value: types.value.join(', ') },
  { key: 'stage', value: stage.value },
  { key: 'trainerType', value: trainerType.value },
  { key: 'energyType', value: energyType.value },
  { key: 'retreat', value: attrs.value.retreat },
  { key: 'evolveFrom', value: evolveFrom.value },
  { key: 'number', value: number.value },
  { key: 'illustrator', value: attrs.value.illustrator },
  { key: 'regulationMark', value: attrs.value.regulationMark },
  { key: 'dexId', value: attrs.value.dexId?.join(', ') },
].filter(fact => fact.value !== undefined && fact.value !== null && fact.value !== ''))

const hasTexts = computed(() =>
  Boolean(text.value.attacks?.length || text.value.abilities?.length || text.value.weaknesses?.length
    || text.value.resistances?.length || text.value.effect),
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <UFormField v-for="fact in facts" :key="fact.key" :label="t(`pokemon.fields.${fact.key}`)">
        <UInput :model-value="String(fact.value)" readonly class="w-full" :ui="{ base: 'bg-elevated text-muted' }" />
      </UFormField>
    </div>

    <p v-if="!hasTexts && details === null" class="text-sm text-muted">
      {{ t('pokemon.noDetails') }}
    </p>

    <section v-if="text.effect">
      <h3 class="mb-1.5 text-sm font-semibold">
        {{ t('pokemon.sections.effect') }}
      </h3>
      <p class="whitespace-pre-line text-sm text-muted">
        {{ text.effect }}
      </p>
    </section>

    <section v-if="text.abilities?.length">
      <h3 class="mb-1.5 text-sm font-semibold">
        {{ t('pokemon.sections.abilities') }}
      </h3>
      <ul class="flex flex-col gap-2">
        <li v-for="ability in text.abilities" :key="ability.name" class="rounded-lg border border-default bg-elevated px-3.5 py-2.5 text-sm">
          <p class="font-medium">
            <span v-if="ability.type" class="mr-1.5 rounded bg-default px-1.5 py-0.5 text-[11px] font-normal text-muted">{{ ability.type }}</span>{{ ability.name }}
          </p>
          <p v-if="ability.effect" class="mt-0.5 whitespace-pre-line text-muted">
            {{ ability.effect }}
          </p>
        </li>
      </ul>
    </section>

    <section v-if="text.attacks?.length">
      <h3 class="mb-1.5 text-sm font-semibold">
        {{ t('pokemon.sections.attacks') }}
      </h3>
      <ul class="flex flex-col gap-2">
        <li v-for="attack in text.attacks" :key="attack.name" class="rounded-lg border border-default bg-elevated px-3.5 py-2.5 text-sm">
          <p class="flex flex-wrap items-baseline justify-between gap-2 font-medium">
            <span>{{ attack.name }}</span>
            <span class="text-xs font-normal text-muted">
              {{ attack.cost.join(' · ') }}<template v-if="attack.damage !== undefined"> → {{ attack.damage }}</template>
            </span>
          </p>
          <p v-if="attack.effect" class="mt-0.5 whitespace-pre-line text-muted">
            {{ attack.effect }}
          </p>
        </li>
      </ul>
    </section>

    <div v-if="text.weaknesses?.length || text.resistances?.length" class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <section v-if="text.weaknesses?.length">
        <h3 class="mb-1.5 text-sm font-semibold">
          {{ t('pokemon.sections.weakness') }}
        </h3>
        <p class="text-sm text-muted">
          {{ text.weaknesses.map(entry => `${entry.type} ${entry.value ?? ''}`.trim()).join(', ') }}
        </p>
      </section>
      <section v-if="text.resistances?.length">
        <h3 class="mb-1.5 text-sm font-semibold">
          {{ t('pokemon.sections.resistance') }}
        </h3>
        <p class="text-sm text-muted">
          {{ text.resistances.map(entry => `${entry.type} ${entry.value ?? ''}`.trim()).join(', ') }}
        </p>
      </section>
    </div>
  </div>
</template>
