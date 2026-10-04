<script setup lang="ts">
import type { CardDetailDto, CardImageDto, PlayerDto } from '#shared/types/api'
import { formatAttributeValue, getAttributeFields, parseAttributeInput } from '#shared/utils/game-fields'
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

useHead({ title: () => card.value?.name })

const NONE = 'none'
const today = () => new Date().toISOString().slice(0, 10)

interface FormState {
  name: string
  description: string
  setName: string
  setCode: string
  rarity: string
  edition: string
  attributes: Record<string, string>
  status: CardStatusValue
  statusDate: string
  statusPerson: string
  player: string
  purchaseDate: string
}

function toForm(source: CardDetailDto): FormState {
  const set = source.sets[0]
  return {
    name: source.name,
    description: source.description ?? '',
    setName: set?.setName ?? '',
    setCode: set?.setCode ?? '',
    rarity: set?.rarity ?? '',
    edition: set?.edition ?? '',
    attributes: Object.fromEntries(
      getAttributeFields(source.game.slug).map(field => [field.key, formatAttributeValue(field.kind, source.attributes[field.key])]),
    ),
    status: source.status,
    statusDate: source.statusDate ?? '',
    statusPerson: source.statusPerson ?? '',
    player: source.assignedPlayerId === null ? NONE : String(source.assignedPlayerId),
    purchaseDate: source.purchaseDate ?? '',
  }
}

const form = reactive<FormState>(toForm(card.value))
const attributeErrors = ref<Record<string, boolean>>({})
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
function buildPatch(current: CardDetailDto): Record<string, unknown> | null {
  const patch: Record<string, unknown> = {}
  const original = toForm(current)

  if (form.name !== original.name) {
    patch.name = form.name
  }
  if (form.description !== original.description) {
    patch.description = form.description
  }

  const attributes: Record<string, string | number | null> = {}
  const errors: Record<string, boolean> = {}
  for (const field of attributeFields.value) {
    if (form.attributes[field.key] === original.attributes[field.key]) {
      continue
    }
    const parsed = parseAttributeInput(field.kind, form.attributes[field.key] ?? '')
    if (parsed === undefined) {
      errors[field.key] = true
    }
    else {
      attributes[field.key] = parsed
    }
  }
  attributeErrors.value = errors
  if (Object.keys(errors).length > 0) {
    return null
  }
  if (Object.keys(attributes).length > 0) {
    patch.attributes = attributes
  }

  const setFields = ['setName', 'setCode', 'rarity', 'edition'] as const
  if (setFields.some(key => form[key] !== original[key])) {
    patch.set = {
      setName: nullIfBlank(form.setName) ?? undefined,
      setCode: nullIfBlank(form.setCode) ?? undefined,
      rarity: nullIfBlank(form.rarity),
      edition: nullIfBlank(form.edition),
    }
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
  if (patch === null) {
    toast.add({ title: t('errors.invalid_attribute'), color: 'error' })
    return
  }
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

// --- Images -----------------------------------------------------------------------------

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

// --- Prices -----------------------------------------------------------------------------

const priceSources = computed(() => [...new Set(card.value!.priceHistory.map(point => point.source))])
const selectedSource = ref(card.value.primarySource)
const sourceItems = computed(() => priceSources.value.map(source => ({ label: source, value: source })))
const pricePoints = computed(() => {
  const source = priceSources.value.includes(selectedSource.value) ? selectedSource.value : priceSources.value[0]
  return card.value!.priceHistory.filter(point => point.source === source)
})
const refreshing = ref(false)

async function refreshPrices() {
  refreshing.value = true
  const before = card.value!.priceHistory.length
  try {
    card.value = await $fetch<CardDetailDto>(`/api/cards/${id}/refresh-prices`, { method: 'POST' })
    const added = card.value.priceHistory.length > before
    toast.add({ title: added ? t('card.prices.refreshed') : t('card.prices.noNewPrices'), color: added ? 'success' : 'warning' })
  }
  catch (e) {
    toast.add({ title: apiError(e), color: 'error' })
  }
  finally {
    refreshing.value = false
  }
}

// --- Deleting the card ----------------------------------------------------------------

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

const originOf = (key: string) => card.value!.manualOverrides[key]
const isEdited = (key: string) => key in card.value!.manualOverrides
const subtitle = computed(() => [
  card.value!.sets[0]?.setCode,
  card.value!.game.displayName,
  card.value!.externalId ? t('card.origin.api') : t('card.origin.manual'),
].filter(Boolean).join(' · '))
const imageCaption = computed(() => [card.value!.sets[0]?.edition, card.value!.sets[0]?.rarity].filter(Boolean).join(' · '))
</script>

<template>
  <div v-if="card" class="mx-auto max-w-[1040px] px-8 pb-12 pt-6">
    <NuxtLink to="/" class="mb-4 inline-block text-[13px] text-muted no-underline">
      {{ t('common.back') }}
    </NuxtLink>

    <div class="mb-6">
      <h1 class="mb-1 text-2xl font-semibold">
        {{ card.name }}
      </h1>
      <span class="text-[13px] text-muted">{{ subtitle }}</span>
    </div>

    <form class="flex flex-wrap gap-8" @submit.prevent="save">
      <!-- Images -->
      <div class="flex max-w-[300px] flex-[1_1_280px] flex-col gap-4">
        <div class="flex h-[380px] items-center justify-center overflow-hidden rounded-xl bg-primary-50 text-sm text-primary">
          <img
            v-if="selectedImage"
            :src="`/api/images/${selectedImage.id}`"
            :alt="card.name"
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
          <h2 class="mb-3 text-[15px] font-semibold">
            {{ t('card.sections.basics') }}
          </h2>
          <div class="flex flex-col gap-3.5">
            <UFormField :label="t('card.fields.name')">
              <template v-if="isEdited('name')" #hint>
                <span class="text-primary" :title="t('card.editedHint', { value: String(originOf('name')) })">{{ t('card.edited') }}</span>
              </template>
              <UInput v-model="form.name" required maxlength="200" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <UFormField :label="t('card.fields.setName')">
                <UInput v-model="form.setName" maxlength="200" class="w-full" />
              </UFormField>
              <UFormField :label="t('card.fields.setCode')">
                <UInput v-model="form.setCode" maxlength="40" class="w-full" />
              </UFormField>
              <UFormField :label="t('card.fields.rarity')">
                <UInput v-model="form.rarity" maxlength="80" class="w-full" />
              </UFormField>
              <UFormField :label="t('card.fields.edition')">
                <UInput v-model="form.edition" maxlength="80" class="w-full" />
              </UFormField>
            </div>
            <UFormField v-if="card.externalId" :label="t('card.fields.externalId')">
              <UInput :model-value="card.externalId" readonly class="w-full" :ui="{ base: 'bg-elevated text-muted' }" />
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
              :error="attributeErrors[field.key] ? t('errors.invalid_attribute') : undefined"
            >
              <template v-if="isEdited(`attributes.${field.key}`)" #hint>
                <span class="text-primary" :title="t('card.editedHint', { value: String(originOf(`attributes.${field.key}`) ?? '') })">{{ t('card.edited') }}</span>
              </template>
              <UInput v-model="form.attributes[field.key]" maxlength="200" class="w-full" />
            </UFormField>
          </div>
        </section>

        <UFormField :label="t('card.fields.description')">
          <template v-if="isEdited('description')" #hint>
            <span class="text-primary">{{ t('card.edited') }}</span>
          </template>
          <UTextarea v-model="form.description" :rows="3" maxlength="5000" class="w-full" />
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
          <UButton color="error" variant="outline" @click="deleteOpen = true">
            {{ t('card.delete.button') }}
          </UButton>
          <span class="text-xs text-dimmed">
            {{ t('card.lastModified', { date: dateTime(card.lastModifiedAt), user: card.lastModifiedBy ?? t('common.none') }) }}
          </span>
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
          <UButton
            v-if="card.externalId"
            type="button"
            class="mt-2.5"
            color="primary"
            variant="outline"
            size="sm"
            :loading="refreshing"
            @click="refreshPrices"
          >
            {{ t('card.prices.refresh') }}
          </UButton>
        </section>
      </div>
    </form>

    <UModal v-model:open="deleteOpen" :title="t('card.delete.title')">
      <template #body>
        <p class="text-sm">
          {{ t('card.delete.text', { name: card.name }) }}
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
