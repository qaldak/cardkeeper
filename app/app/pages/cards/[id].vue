<script setup lang="ts">
import type { CardDetailDto, CardImageDto, UserDto } from '#shared/types/api'
import { POKEMON_VARIANTS, type PokemonDetails } from '#shared/types/pokemon'
import { getGameConfig } from '#shared/utils/game-config'
import { formatAttributeValue, getAttributeFields } from '#shared/utils/game-fields'
import { preferredLanguage } from '#shared/utils/languages'
import { CARD_STATUSES, statusNeedsDate, statusNeedsPerson, type CardStatusValue } from '#shared/utils/status'

const { t } = useI18n()
const route = useRoute()
const toast = useToast()
const apiError = useApiError()
const { money, dateTime } = useFormat()
const labels = useGameLabels()

const id = Number(route.params.id)
const { data: card, error } = await useFetch<CardDetailDto>(`/api/cards/${id}`)
if (error.value || !card.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, fatal: true })
}
const { data: users } = await useFetch<UserDto[]>('/api/users')

// Everybody sees every card, but only the owner changes it (the server enforces this, the form only reflects it).
const { user: me } = useAuth()
const canEdit = computed(() => card.value!.owner !== null && card.value!.owner.id === me.value?.id)

const today = () => new Date().toISOString().slice(0, 10)

// --- Language of the shown texts --------------------------------------------------------------

// Only the languages the game stores are offered (Yu-Gi-Oh!: DE/EN, Pokémon: DE/EN/JA).
const shownLanguages = computed(() => getGameConfig(card.value!.game.slug).languages)
const availableLanguages = computed(() => card.value!.translations.map(entry => entry.language))
// German is selected whenever the card has a German text.
const language = ref(preferredLanguage(availableLanguages.value) ?? 'en')
const translation = computed(() =>
  card.value!.translations.find(entry => entry.language === language.value) ?? card.value!.translations[0],
)
const shownName = computed(() => translation.value?.name ?? card.value!.name)

// A refresh can add a language; keep the selection valid if one disappears.
watch(availableLanguages, (languages) => {
  if (!languages.includes(language.value)) {
    language.value = preferredLanguage(languages) ?? 'en'
  }
})

useHead({ title: () => shownName.value })

// --- Editable part of the form ----------------------------------------------------------------

interface FormState {
  setCode: string
  edition: string
  status: CardStatusValue
  statusDate: string
  statusPerson: string
  owner: string
  purchaseDate: string
}

function toForm(source: CardDetailDto): FormState {
  const set = source.sets[0]
  return {
    setCode: set?.setCode ?? '',
    edition: set?.edition ?? '',
    status: source.status,
    statusDate: source.statusDate ?? '',
    statusPerson: source.statusPerson ?? '',
    owner: source.owner ? String(source.owner.id) : '',
    purchaseDate: source.purchaseDate ?? '',
  }
}

const form = reactive<FormState>(toForm(card.value))
const saving = ref(false)

const attributeFields = computed(() => getAttributeFields(card.value!.game.slug))
const gameConfig = computed(() => getGameConfig(card.value!.game.slug))
const isPokemon = computed(() => card.value!.game.slug === 'pokemon')

// Language dependent data of the selected language (Pokémon: attacks, localized types, ...).
const details = computed(() => (translation.value?.details ?? null) as PokemonDetails | null)
const setNameShown = computed(() => details.value?.set?.name ?? card.value!.sets[0]?.setName ?? '')
const rarityShown = computed(() => details.value?.rarity ?? card.value!.sets[0]?.rarity ?? '')

// Pokémon: the variants this card exists in, plus the current one in case the data changed.
const variantItems = computed<{ label: string, value: string }[]>(() => {
  const available = (card.value!.attributes.variants ?? {}) as Record<string, boolean>
  return POKEMON_VARIANTS
    .filter(key => available[key] === true || key === form.edition)
    .map(key => ({ label: labels.variant(key), value: key }))
})
const editionText = (edition: string | null | undefined) =>
  gameConfig.value.editionKind === 'variant' ? labels.variant(edition) : labels.edition(edition)
const showDate = computed(() => statusNeedsDate(form.status))
const showPerson = computed(() => statusNeedsPerson(form.status))

// Switching to a status that records a date pre-fills today's date, like a sensible default.
watch(() => form.status, (status) => {
  if (statusNeedsDate(status) && !form.statusDate) {
    form.statusDate = today()
  }
})

const statusItems = computed(() => CARD_STATUSES.map(value => ({ label: t(`status.${value}`), value })))
const ownerItems = computed(() => (users.value ?? []).map(entry => ({ label: entry.name, value: String(entry.id) })))

const nullIfBlank = (value: string) => (value.trim() === '' ? null : value.trim())

/** Builds the PATCH body with only the fields that differ from the stored card. */
function buildPatch(current: CardDetailDto): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  const original = toForm(current)

  if (form.setCode !== original.setCode || form.edition !== original.edition) {
    const set: Record<string, string | null> = {}
    if (form.setCode !== original.setCode) {
      set.setCode = form.setCode.trim()
    }
    if (form.edition !== original.edition) {
      set.edition = nullIfBlank(form.edition)
    }
    patch.set = set
  }

  if (form.status !== original.status) {
    patch.status = form.status
    patch.statusDate = showDate.value ? (form.statusDate || today()) : null
    patch.statusPerson = showPerson.value ? nullIfBlank(form.statusPerson) : null
  }
  else if (form.statusDate !== original.statusDate || form.statusPerson !== original.statusPerson) {
    patch.statusDate = showDate.value ? (form.statusDate || null) : null
    patch.statusPerson = showPerson.value ? nullIfBlank(form.statusPerson) : null
  }

  if (form.owner !== original.owner && form.owner !== '') {
    patch.ownerId = Number(form.owner)
  }
  if (form.purchaseDate !== original.purchaseDate) {
    patch.purchaseDate = form.purchaseDate || null
  }
  return patch
}

async function save() {
  const patch = buildPatch(card.value!)
  if (Object.keys(patch).length === 0) {
    return
  }
  saving.value = true
  try {
    const updated = await $fetch<CardDetailDto>(`/api/cards/${id}`, { method: 'PATCH', body: patch })
    card.value = updated
    Object.assign(form, toForm(updated))
    toast.add({ title: t('common.saved'), color: 'success' })
  }
  catch (e) {
    toast.add({ title: apiError(e), color: 'error' })
  }
  finally {
    saving.value = false
  }
}

// --- Refresh from the card API ----------------------------------------------------------------

const refreshing = ref(false)

async function refreshFromApi() {
  refreshing.value = true
  try {
    // Set code, edition, status and owner are not touched, so the form stays as it is.
    card.value = await $fetch<CardDetailDto>(`/api/cards/${id}/refresh`, { method: 'POST' })
    toast.add({ title: t('card.refresh.done'), color: 'success' })
  }
  catch (e) {
    toast.add({ title: apiError(e), color: 'error' })
  }
  finally {
    refreshing.value = false
  }
}

// --- Images -----------------------------------------------------------------------------------

const selectedImageId = ref<number | null>(null)
const images = computed(() => card.value!.images)
const selectedImage = computed<CardImageDto | undefined>(() =>
  images.value.find(image => image.id === selectedImageId.value) ?? images.value.find(image => image.isPrimary) ?? images.value[0],
)

const zoomOpen = ref(false)

const imagePosition = computed(() => images.value.findIndex(image => image.id === selectedImage.value?.id) + 1)

// Left and right arrow key switch the image while the dialog is open.
function onZoomKey(event: KeyboardEvent) {
  if (!zoomOpen.value || images.value.length < 2) {
    return
  }
  if (event.key === 'ArrowLeft') {
    stepImage(-1)
  }
  else if (event.key === 'ArrowRight') {
    stepImage(1)
  }
}
onMounted(() => window.addEventListener('keydown', onZoomKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onZoomKey))

function stepImage(delta: number) {
  const list = images.value
  const index = list.findIndex(image => image.id === selectedImage.value?.id)
  selectedImageId.value = list[(index + delta + list.length) % list.length]!.id
}

async function reloadCard() {
  card.value = await $fetch<CardDetailDto>(`/api/cards/${id}`)
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  const body = new FormData()
  body.append('file', file)
  try {
    const image = await $fetch<CardImageDto>(`/api/cards/${id}/images`, { method: 'POST', body })
    await reloadCard()
    selectedImageId.value = image.id
    toast.add({ title: t('card.image.uploaded'), color: 'success' })
  }
  catch (e) {
    toast.add({ title: apiError(e), color: 'error' })
  }
  finally {
    input.value = ''
  }
}

async function makePrimary() {
  if (!selectedImage.value) {
    return
  }
  try {
    await $fetch(`/api/images/${selectedImage.value.id}`, { method: 'PATCH', body: { isPrimary: true } })
    await reloadCard()
    toast.add({ title: t('card.image.primaryChanged'), color: 'success' })
  }
  catch (e) {
    toast.add({ title: apiError(e), color: 'error' })
  }
}

async function deleteImage() {
  if (!selectedImage.value) {
    return
  }
  try {
    await $fetch(`/api/images/${selectedImage.value.id}`, { method: 'DELETE' })
    selectedImageId.value = null
    await reloadCard()
    toast.add({ title: t('card.image.deleted'), color: 'success' })
  }
  catch (e) {
    toast.add({ title: apiError(e), color: 'error' })
  }
}

// --- Prices -----------------------------------------------------------------------------------

const priceSources = computed(() => [...new Set(card.value!.priceHistory.map(point => point.source))])
const selectedSource = ref(card.value.primarySource)
const sourceItems = computed(() => priceSources.value.map(source => ({ label: source, value: source })))
const pricePoints = computed(() => {
  const source = priceSources.value.includes(selectedSource.value) ? selectedSource.value : priceSources.value[0]
  return card.value!.priceHistory.filter(point => point.source === source)
})

// --- Deleting the card ------------------------------------------------------------------------

const deleteOpen = ref(false)

async function deleteCard() {
  try {
    await $fetch(`/api/cards/${id}`, { method: 'DELETE' })
    toast.add({ title: t('card.delete.done'), color: 'success' })
    await navigateTo('/')
  }
  catch (e) {
    toast.add({ title: apiError(e), color: 'error' })
    deleteOpen.value = false
  }
}

const subtitle = computed(() => [
  card.value!.sets[0]?.setCode,
  card.value!.game.displayName,
  card.value!.externalId ? t('card.origin.api') : t('card.origin.manual'),
  card.value!.userModifiedAt ? t('card.modifiedOn', { date: dateTime(card.value!.userModifiedAt) }) : null,
].filter(Boolean).join(' · '))
const imageCaption = computed(() => [editionText(card.value!.sets[0]?.edition), rarityShown.value].filter(Boolean).join(' · '))
const readonlyUi = { base: 'bg-elevated text-muted' }
</script>

<template>
  <div v-if="card" class="mx-auto max-w-[1040px] px-8 pb-12 pt-6">
    <NuxtLink to="/" class="mb-4 inline-block text-[13px] text-muted no-underline">
      {{ t('common.back') }}
    </NuxtLink>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="mb-1 text-2xl font-semibold">
          {{ shownName }}
        </h1>
        <span class="text-[13px] text-muted">{{ subtitle }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex gap-1.5" role="group" :aria-label="t('card.language.label')">
          <button
            v-for="code in shownLanguages"
            :key="code"
            type="button"
            class="rounded-full border px-3.5 py-1.5 text-sm uppercase disabled:cursor-not-allowed disabled:opacity-40"
            :class="language === code
              ? 'border-primary bg-primary font-medium text-inverted'
              : 'border-default bg-default text-muted hover:text-default'"
            :aria-pressed="language === code"
            :disabled="!availableLanguages.includes(code)"
            :title="availableLanguages.includes(code) ? undefined : t('card.language.unavailable')"
            @click="language = code"
          >
            {{ code }}
          </button>
        </div>
        <UButton
          v-if="card.externalId && canEdit"
          type="button"
          color="primary"
          variant="outline"
          size="sm"
          icon="i-lucide-refresh-cw"
          :loading="refreshing"
          :title="t('card.refresh.hint')"
          @click="refreshFromApi"
        >
          {{ t('card.refresh.button') }}
        </UButton>
      </div>
    </div>

    <p v-if="!canEdit" class="mb-5 rounded-lg bg-elevated px-3.5 py-2.5 text-sm text-muted" data-test="read-only">
      {{ card.owner ? t('card.readOnly.owned', { owner: card.owner.name }) : t('card.readOnly.noOwner') }}
    </p>

    <form class="flex flex-wrap gap-8" @submit.prevent="save">
      <!-- Images -->
      <div class="flex max-w-[300px] flex-[1_1_280px] flex-col gap-4">
        <div class="flex h-[380px] items-center justify-center overflow-hidden rounded-xl bg-(--app-art) text-sm text-primary">
          <button v-if="selectedImage" type="button" class="size-full cursor-zoom-in" :aria-label="t('card.image.zoom')" data-test="zoom-open" @click="zoomOpen = true">
            <img
              :src="`/api/images/${selectedImage.id}`"
              :alt="shownName"
              class="size-full object-contain"
            >
          </button>
          <span v-else>{{ t('card.noImage') }}</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="image in images"
            :key="image.id"
            type="button"
            class="size-14 overflow-hidden rounded-lg border bg-(--app-art)"
            :class="image.id === selectedImage?.id ? 'border-primary ring-2 ring-primary' : 'border-default'"
            @click="selectedImageId = image.id"
          >
            <img :src="`/api/images/${image.id}`" alt="" class="size-full object-cover">
          </button>
          <label
            v-if="canEdit"
            for="imgUpload"
            class="flex size-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-accented bg-default text-muted"
          >
            <UIcon name="i-lucide-plus" />
          </label>
        </div>

        <div class="flex flex-wrap gap-2">
          <label
            v-if="canEdit"
            for="imgUpload"
            class="inline-block cursor-pointer rounded-lg border border-primary px-3.5 py-2 text-[13px] font-medium text-primary"
          >
            {{ t('card.image.upload') }}
          </label>
          <input v-if="canEdit" id="imgUpload" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" @change="uploadImage">
          <UButton
            v-if="canEdit && selectedImage && !selectedImage.isPrimary"
            size="sm"
            color="neutral"
            variant="outline"
            @click="makePrimary"
          >
            {{ t('card.image.makePrimary') }}
          </UButton>
          <UButton
            v-if="canEdit && selectedImage?.source === 'MANUAL'"
            size="sm"
            color="error"
            variant="ghost"
            @click="deleteImage"
          >
            {{ t('card.image.delete') }}
          </UButton>
        </div>
        <span v-if="imageCaption" class="text-xs text-dimmed">{{ imageCaption }}</span>
      </div>

      <!-- Data -->
      <div class="flex min-w-0 flex-[999_1_420px] flex-col gap-7">
        <section>
          <h2 class="mb-1 text-[15px] font-semibold">
            {{ t('card.sections.basics') }}
          </h2>
          <p class="mb-3 text-xs text-dimmed">
            {{ isPokemon ? t('card.basicsHintVariant') : t('card.basicsHint') }}
          </p>
          <div class="flex flex-col gap-3.5">
            <UFormField :label="t('card.fields.name')">
              <UInput :model-value="shownName" readonly class="w-full" :ui="readonlyUi" />
            </UFormField>
            <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <UFormField :label="isPokemon ? t('card.fields.cardId') : t('card.fields.setCode')">
                <UInput
                  v-model="form.setCode"
                  maxlength="40"
                  class="w-full"
                  :readonly="!gameConfig.setCodeEditable || !canEdit"
                  :ui="gameConfig.setCodeEditable && canEdit ? undefined : readonlyUi"
                />
              </UFormField>
              <UFormField :label="isPokemon ? t('card.fields.variant') : t('card.fields.edition')">
                <USelect v-if="gameConfig.editionKind === 'variant'" v-model="form.edition" :items="variantItems" :disabled="!canEdit" class="w-full" />
                <UInput v-else v-model="form.edition" maxlength="80" :readonly="!canEdit" :ui="canEdit ? undefined : readonlyUi" class="w-full" />
                <EditionChips
                  v-if="canEdit && gameConfig.editions.length > 0"
                  :model-value="form.edition || null"
                  :choices="gameConfig.editions"
                  class="mt-2"
                  @update:model-value="(value: string | null) => (form.edition = value ?? '')"
                />
              </UFormField>
              <UFormField :label="t('card.fields.setName')">
                <UInput :model-value="setNameShown" readonly class="w-full" :ui="readonlyUi" />
              </UFormField>
              <UFormField :label="t('card.fields.rarity')">
                <UInput :model-value="rarityShown" readonly class="w-full" :ui="readonlyUi" />
              </UFormField>
            </div>
            <UFormField v-if="card.externalId && !isPokemon" :label="t('card.fields.externalId')">
              <UInput :model-value="card.externalId" readonly class="w-full" :ui="readonlyUi" />
            </UFormField>
          </div>
        </section>

        <section v-if="isPokemon">
          <h2 class="mb-3 text-[15px] font-semibold">
            {{ t('card.sections.attributes', { game: card.game.displayName }) }}
          </h2>
          <PokemonInfo :attributes="card.attributes" :details="translation?.details ?? null" />
        </section>

        <section v-else-if="attributeFields.length">
          <h2 class="mb-3 text-[15px] font-semibold">
            {{ t('card.sections.attributes', { game: card.game.displayName }) }}
          </h2>
          <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <UFormField
              v-for="field in attributeFields"
              :key="field.key"
              :label="t(`card.attributes.${field.key}`)"
            >
              <UInput
                :model-value="formatAttributeValue(field.kind, card.attributes[field.key])"
                readonly
                class="w-full"
                :ui="readonlyUi"
              />
            </UFormField>
          </div>
        </section>

        <UFormField :label="t('card.fields.description')">
          <UTextarea :model-value="translation?.description ?? ''" readonly :rows="3" class="w-full" :ui="readonlyUi" />
        </UFormField>

        <section>
          <h2 class="mb-3 text-[15px] font-semibold">
            {{ t('card.sections.status') }}
          </h2>
          <div class="flex max-w-xs flex-col gap-3.5">
            <UFormField :label="t('card.fields.status')">
              <USelect v-model="form.status" :items="statusItems" :disabled="!canEdit" class="w-full" />
            </UFormField>
            <UFormField v-if="showDate" :label="t('card.fields.statusDate')">
              <UInput v-model="form.statusDate" type="date" :readonly="!canEdit" :ui="canEdit ? undefined : readonlyUi" class="w-full" />
            </UFormField>
            <UFormField v-if="showPerson" :label="t('card.fields.statusPerson')">
              <UInput v-model="form.statusPerson" :placeholder="t('card.fields.statusPersonPlaceholder')" maxlength="120" :readonly="!canEdit" :ui="canEdit ? undefined : readonlyUi" class="w-full" />
            </UFormField>
            <UFormField :label="t('card.fields.owner')" :description="canEdit ? t('card.fields.ownerHint') : undefined">
              <USelect v-if="canEdit" v-model="form.owner" :items="ownerItems" class="w-full" />
              <UInput v-else :model-value="card.owner?.name ?? ''" readonly class="w-full" :ui="readonlyUi" />
            </UFormField>
            <UFormField :label="t('card.fields.purchaseDate')">
              <UInput v-model="form.purchaseDate" type="date" :readonly="!canEdit" :ui="canEdit ? undefined : readonlyUi" class="w-full" />
            </UFormField>
          </div>
        </section>

        <div v-if="canEdit" class="flex flex-wrap items-center gap-3">
          <UButton type="submit" :loading="saving">
            {{ t('common.save') }}
          </UButton>
          <UButton type="button" color="error" variant="outline" @click="deleteOpen = true">
            {{ t('card.delete.button') }}
          </UButton>
        </div>
        <div class="flex flex-col gap-0.5 text-xs text-dimmed">
          <span>{{ t('card.lastModified', { date: dateTime(card.lastModifiedAt), user: card.lastModifiedBy ?? t('common.none') }) }}</span>
          <span v-if="card.lastFetchedAt">{{ t('card.lastFetched', { date: dateTime(card.lastFetchedAt) }) }}</span>
        </div>

        <section>
          <h2 class="mb-3 text-[15px] font-semibold">
            {{ t('card.sections.prices') }}
          </h2>
          <UFormField v-if="priceSources.length > 1" :label="t('card.prices.source')" class="mb-3 max-w-[220px]">
            <USelect v-model="selectedSource" :items="sourceItems" class="w-full" />
          </UFormField>
          <div v-if="pricePoints.length" class="max-h-72 max-w-[420px] overflow-auto rounded-[10px] border border-default bg-default">
            <div
              v-for="point in pricePoints"
              :key="point.id"
              class="flex justify-between border-b border-default px-3.5 py-2.5 text-[13px] last:border-b-0"
            >
              <span class="text-muted">{{ dateTime(point.fetchedAt) }}</span>
              <span>{{ money(point.price, point.currency) }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-muted">
            {{ t('card.prices.empty') }}
          </p>
        </section>
      </div>
    </form>

    <!-- The stored image in its full size. A click on the image closes the dialog; with several images the wide areas
         beside the image (and the arrow keys) switch between them. -->
    <UModal v-model:open="zoomOpen" :title="shownName" :ui="{ content: 'max-w-5xl' }">
      <template #body>
        <div class="flex items-stretch gap-1">
          <button
            v-if="images.length > 1"
            type="button"
            class="flex w-14 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary sm:w-24"
            :aria-label="t('card.image.previous')"
            data-test="zoom-prev"
            @click="stepImage(-1)"
          >
            <UIcon name="i-lucide-chevron-left" class="size-9" />
          </button>
          <div class="flex min-w-0 flex-1 items-center justify-center">
            <img
              v-if="selectedImage"
              :src="`/api/images/${selectedImage.id}`"
              :alt="shownName"
              :title="t('card.image.closeHint')"
              class="max-h-[calc(100dvh-16rem)] w-auto max-w-full cursor-zoom-out rounded-lg object-contain"
              data-test="zoom-image"
              @click="zoomOpen = false"
            >
          </div>
          <button
            v-if="images.length > 1"
            type="button"
            class="flex w-14 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary sm:w-24"
            :aria-label="t('card.image.next')"
            data-test="zoom-next"
            @click="stepImage(1)"
          >
            <UIcon name="i-lucide-chevron-right" class="size-9" />
          </button>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full items-center justify-between gap-3">
          <span class="text-sm text-muted" data-test="zoom-position">{{ images.length > 1 ? `${imagePosition} / ${images.length}` : '' }}</span>
          <UButton v-if="selectedImage" :href="`/api/images/${selectedImage.id}`" external download color="neutral" variant="outline" icon="i-lucide-download" data-test="zoom-download">
            {{ t('card.image.download') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteOpen" :title="t('card.delete.title')">
      <template #body>
        <p class="text-sm">
          {{ t('card.delete.text', { name: shownName }) }}
        </p>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="deleteOpen = false">
          {{ t('common.cancel') }}
        </UButton>
        <UButton color="error" @click="deleteCard">
          {{ t('common.delete') }}
        </UButton>
      </template>
    </UModal>
  </div>
</template>
