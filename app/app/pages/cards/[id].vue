<script setup lang="ts">
import type { CardDetailDto, CardImageDto, PlayerDto } from '#shared/types/api'
import { formatAttributeValue, getAttributeFields } from '#shared/utils/game-fields'
import { CARD_LANGUAGES, preferredLanguage } from '#shared/utils/languages'
import { CARD_STATUSES, statusNeedsDate, statusNeedsPerson, type CardStatusValue } from '#shared/utils/status'

const { t } = useI18n()
const route = useRoute()
const toast = useToast()
const apiError = useApiError()
const { money, dateTime } = useFormat()

const id = Number(route.params.id)
const { data: card, error } = await useFetch<CardDetailDto>(`/api/cards/${id}`)
if (error.value || !card.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, fatal: true })
}
const { data: players } = await useFetch<PlayerDto[]>('/api/players')

const NONE = 'none'
const today = () => new Date().toISOString().slice(0, 10)

// --- Language of the shown texts --------------------------------------------------------------

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
  player: string
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
    player: source.assignedPlayerId === null ? NONE : String(source.assignedPlayerId),
    purchaseDate: source.purchaseDate ?? '',
  }
}

const form = reactive<FormState>(toForm(card.value))
const saving = ref(false)

const attributeFields = computed(() => getAttributeFields(card.value!.game.slug))
const showDate = computed(() => statusNeedsDate(form.status))
const showPerson = computed(() => statusNeedsPerson(form.status))

// Switching to a status that records a date pre-fills today's date, like a sensible default.
watch(() => form.status, (status) => {
  if (statusNeedsDate(status) && !form.statusDate) {
    form.statusDate = today()
  }
})

const statusItems = computed(() => CARD_STATUSES.map(value => ({ label: t(`status.${value}`), value })))
const playerItems = computed(() => [
  { label: t('common.none'), value: NONE },
  ...(players.value ?? []).map(entry => ({ label: entry.name, value: String(entry.id) })),
])

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

  if (form.player !== original.player) {
    patch.assignedPlayerId = form.player === NONE ? null : Number(form.player)
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
    // Set code, edition, status and assignment are not touched, so the form stays as it is.
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
const imageCaption = computed(() => [card.value!.sets[0]?.edition, card.value!.sets[0]?.rarity].filter(Boolean).join(' · '))
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
            v-for="code in CARD_LANGUAGES"
            :key="code"
            type="button"
            class="rounded-full border px-3.5 py-1.5 text-sm uppercase disabled:cursor-not-allowed disabled:opacity-40"
            :class="language === code
              ? 'border-primary bg-primary font-medium text-white'
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
          v-if="card.externalId"
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

    <form class="flex flex-wrap gap-8" @submit.prevent="save">
      <!-- Images -->
      <div class="flex max-w-[300px] flex-[1_1_280px] flex-col gap-4">
        <div class="flex h-[380px] items-center justify-center overflow-hidden rounded-xl bg-primary-50 text-sm text-primary">
          <img
            v-if="selectedImage"
            :src="`/api/images/${selectedImage.id}`"
            :alt="shownName"
            class="size-full object-contain"
          >
          <span v-else>{{ t('card.noImage') }}</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="image in images"
            :key="image.id"
            type="button"
            class="size-14 overflow-hidden rounded-lg border bg-primary-50"
            :class="image.id === selectedImage?.id ? 'border-primary ring-2 ring-primary' : 'border-default'"
            @click="selectedImageId = image.id"
          >
            <img :src="`/api/images/${image.id}`" alt="" class="size-full object-cover">
          </button>
          <label
            for="imgUpload"
            class="flex size-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-accented bg-default text-muted"
          >
            <UIcon name="i-lucide-plus" />
          </label>
        </div>

        <div class="flex flex-wrap gap-2">
          <label
            for="imgUpload"
            class="inline-block cursor-pointer rounded-lg border border-primary px-3.5 py-2 text-[13px] font-medium text-primary"
          >
            {{ t('card.image.upload') }}
          </label>
          <input id="imgUpload" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" @change="uploadImage">
          <UButton
            v-if="selectedImage && !selectedImage.isPrimary"
            size="sm"
            color="neutral"
            variant="outline"
            @click="makePrimary"
          >
            {{ t('card.image.makePrimary') }}
          </UButton>
          <UButton
            v-if="selectedImage?.source === 'MANUAL'"
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
            {{ t('card.basicsHint') }}
          </p>
          <div class="flex flex-col gap-3.5">
            <UFormField :label="t('card.fields.name')">
              <UInput :model-value="shownName" readonly class="w-full" :ui="readonlyUi" />
            </UFormField>
            <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <UFormField :label="t('card.fields.setCode')" :hint="t('card.fields.editable')">
                <UInput v-model="form.setCode" maxlength="40" class="w-full" />
              </UFormField>
              <UFormField :label="t('card.fields.edition')" :hint="t('card.fields.editable')">
                <UInput v-model="form.edition" maxlength="80" class="w-full" />
              </UFormField>
              <UFormField :label="t('card.fields.setName')">
                <UInput :model-value="card.sets[0]?.setName ?? ''" readonly class="w-full" :ui="readonlyUi" />
              </UFormField>
              <UFormField :label="t('card.fields.rarity')">
                <UInput :model-value="card.sets[0]?.rarity ?? ''" readonly class="w-full" :ui="readonlyUi" />
              </UFormField>
            </div>
            <UFormField v-if="card.externalId" :label="t('card.fields.externalId')">
              <UInput :model-value="card.externalId" readonly class="w-full" :ui="readonlyUi" />
            </UFormField>
          </div>
        </section>

        <section v-if="attributeFields.length">
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
              <USelect v-model="form.status" :items="statusItems" class="w-full" />
            </UFormField>
            <UFormField v-if="showDate" :label="t('card.fields.statusDate')">
              <UInput v-model="form.statusDate" type="date" class="w-full" />
            </UFormField>
            <UFormField v-if="showPerson" :label="t('card.fields.statusPerson')">
              <UInput v-model="form.statusPerson" :placeholder="t('card.fields.statusPersonPlaceholder')" maxlength="120" class="w-full" />
            </UFormField>
            <UFormField :label="t('card.fields.player')">
              <USelect v-model="form.player" :items="playerItems" class="w-full" />
            </UFormField>
            <UFormField :label="t('card.fields.purchaseDate')">
              <UInput v-model="form.purchaseDate" type="date" class="w-full" />
            </UFormField>
          </div>
        </section>

        <div class="flex flex-wrap items-center gap-3">
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
