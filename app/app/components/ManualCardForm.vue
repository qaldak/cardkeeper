<script setup lang="ts">
import type { CardDetailDto } from '#shared/types/api'
import { YGO_EDITIONS } from '#shared/utils/editions'
import { isSetCode, normalizeSetCode } from '#shared/utils/set-code'
import { YGO_ATTRIBUTES, YGO_CARD_TYPES, YGO_RACES } from '#shared/utils/ygo-values'

// Entering a Yu-Gi-Oh! card by hand, for a card that the card database does not know (a token, for instance). Only name
// and set code are required. Card type, type and attribute can only be chosen among the values of the card database;
// level, ATK and DEF may stay empty. Status and owner are not asked: the card is active and belongs to the user, as
// every new card does.
const props = defineProps<{ prefill: string }>()
const emit = defineEmits<{ cancel: [] }>()

const { t } = useI18n()
const toast = useToast()
const apiError = useApiError()
const { user: me } = useAuth()

const language = ref<'de' | 'en'>('de')
const name = ref('')
const setCode = ref('')
const setName = ref('')
const rarity = ref('')
const edition = ref<string | null>(null)
const cardType = ref<string | null>(null)
const race = ref<string | null>(null)
const attribute = ref<string | null>(null)
const level = ref('')
const atk = ref('')
const def = ref('')
const description = ref('')
const purchaseDate = ref('')
const submitting = ref(false)

// What was searched for is what the user is most likely to enter: a set code fills the set code, any other text the name.
const searched = props.prefill.trim()
if (isSetCode(searched)) {
  setCode.value = normalizeSetCode(searched)
}
else {
  name.value = searched
}

const languageItems = computed(() => (['de', 'en'] as const).map(value => ({ label: t(`manual.languages.${value}`), value })))
const cardTypeItems: string[] = [...YGO_CARD_TYPES]
const raceItems: string[] = [...YGO_RACES]
const attributeItems: string[] = [...YGO_ATTRIBUTES]

// A code that does not look like a set code is warned about, always, but it can still be saved.
const unusualSetCode = computed(() => setCode.value.trim() !== '' && !isSetCode(setCode.value))

// The set code is written in capitals in the field itself, keeping the cursor where it is.
function upperCaseSetCode(event: Event) {
  const input = event.target as HTMLInputElement
  const { selectionStart, selectionEnd } = input
  input.value = input.value.toUpperCase()
  input.setSelectionRange(selectionStart, selectionEnd)
  setCode.value = input.value
}

const nullIfBlank = (value: string) => (value.trim() === '' ? null : value.trim())
const numberOrNull = (value: string) => (value.trim() === '' ? null : Number(value))

async function submit() {
  submitting.value = true
  try {
    const card = await $fetch<CardDetailDto>('/api/cards/manual', {
      method: 'POST',
      body: {
        game: 'ygo',
        translation: { language: language.value, name: name.value.trim(), description: nullIfBlank(description.value) },
        set: { setCode: setCode.value.trim(), setName: nullIfBlank(setName.value), rarity: nullIfBlank(rarity.value), edition: edition.value },
        attributes: {
          type: cardType.value,
          race: race.value,
          attribute: attribute.value,
          level: numberOrNull(level.value),
          atk: numberOrNull(atk.value),
          def: numberOrNull(def.value),
        },
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
</script>

<template>
  <form class="flex max-w-xl flex-col gap-5" data-test="manual-form" @submit.prevent="submit">
    <div>
      <h2 class="text-lg font-semibold">
        {{ t('manual.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted">
        {{ t('manual.intro') }}
      </p>
    </div>

    <div class="flex flex-wrap items-start gap-3">
      <UFormField :label="t('manual.name')" required class="min-w-56 flex-1">
        <UInput v-model="name" required maxlength="200" class="w-full" data-test="manual-name" />
      </UFormField>
      <UFormField :label="t('manual.language')" class="w-40">
        <USelect v-model="language" :items="languageItems" class="w-full" data-test="manual-language" />
      </UFormField>
    </div>

    <UFormField :label="t('manual.setCode')" required>
      <UInput
        :model-value="setCode"
        required
        maxlength="40"
        :placeholder="t('manual.setCodePlaceholder')"
        class="w-full"
        data-test="manual-set-code"
        @input="upperCaseSetCode"
      />
      <p v-if="unusualSetCode" class="mt-1.5 text-sm text-warning" role="alert" data-test="set-code-warning">
        {{ t('manual.setCodeWarning', { code: setCode.trim() }) }}
      </p>
    </UFormField>

    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <UFormField :label="t('manual.setName')">
        <UInput v-model="setName" maxlength="200" class="w-full" data-test="manual-set-name" />
      </UFormField>
      <UFormField :label="t('manual.rarity')">
        <UInput v-model="rarity" maxlength="80" class="w-full" data-test="manual-rarity" />
      </UFormField>
    </div>

    <UFormField :label="t('add.edition.label')" :description="t('add.edition.hint')">
      <EditionChips v-model="edition" :choices="YGO_EDITIONS" />
    </UFormField>

    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      <UFormField :label="t('manual.cardType')">
        <USelectMenu
          :model-value="cardType ?? undefined"
          :items="cardTypeItems"
          :placeholder="t('manual.notSet')"
          clear
          class="w-full"
          data-test="manual-card-type"
          @update:model-value="(value?: string | null) => (cardType = value ?? null)"
        />
      </UFormField>
      <UFormField :label="t('manual.race')">
        <USelectMenu
          :model-value="race ?? undefined"
          :items="raceItems"
          :placeholder="t('manual.notSet')"
          clear
          class="w-full"
          data-test="manual-race"
          @update:model-value="(value?: string | null) => (race = value ?? null)"
        />
      </UFormField>
      <UFormField :label="t('manual.attribute')">
        <USelectMenu
          :model-value="attribute ?? undefined"
          :items="attributeItems"
          :placeholder="t('manual.notSet')"
          clear
          class="w-full"
          data-test="manual-attribute"
          @update:model-value="(value?: string | null) => (attribute = value ?? null)"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      <UFormField :label="t('manual.level')">
        <UInput v-model="level" type="number" min="0" max="99" step="1" class="w-full" data-test="manual-level" />
      </UFormField>
      <UFormField :label="t('manual.atk')">
        <UInput v-model="atk" type="number" min="0" max="99999" step="1" class="w-full" data-test="manual-atk" />
      </UFormField>
      <UFormField :label="t('manual.def')">
        <UInput v-model="def" type="number" min="0" max="99999" step="1" class="w-full" data-test="manual-def" />
      </UFormField>
    </div>
    <p class="-mt-3 text-xs text-dimmed">
      {{ t('manual.numberHint') }}
    </p>

    <UFormField :label="t('manual.description')">
      <UTextarea v-model="description" autoresize :rows="3" :maxrows="8" maxlength="5000" class="w-full" data-test="manual-description" />
    </UFormField>

    <p class="text-sm text-muted" data-test="owner-note">
      {{ t('add.ownerNote', { name: me?.name ?? '' }) }}
    </p>
    <UFormField :label="t('add.purchaseDate')">
      <UInput v-model="purchaseDate" type="date" class="w-full" data-test="manual-purchase-date" />
    </UFormField>

    <div class="flex flex-wrap gap-3">
      <UButton type="submit" :loading="submitting" icon="i-lucide-plus" data-test="manual-submit">
        {{ t('manual.submit') }}
      </UButton>
      <UButton type="button" color="neutral" variant="outline" data-test="manual-cancel" @click="emit('cancel')">
        {{ t('manual.cancel') }}
      </UButton>
    </div>
  </form>
</template>
