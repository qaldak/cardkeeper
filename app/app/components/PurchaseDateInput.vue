<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import { EARLIEST_PURCHASE_DATE, todayOnDevice } from '#shared/utils/purchase-date'

/**
 * Date field for the purchase date. `v-model` is `YYYY-MM-DD`, or '' for no date. Instead of the date field of the browser
 * (which shows today's date or a placeholder that looks like a value, depending on the browser) it has segments with a visible
 * placeholder ("tt.mm.jjjj"), a calendar and a button to remove the date. The range is EARLIEST_PURCHASE_DATE to today on the
 * device; a date outside of it can still be typed, is marked and refused by the server.
 */
const props = defineProps<{ readonly?: boolean }>()
const model = defineModel<string>({ default: '' })
const { t } = useI18n()
const { tag } = useFormat()

const min = parseDate(EARLIEST_PURCHASE_DATE)
const max = computed(() => parseDate(todayOnDevice()))

const date = computed<CalendarDate | null>({
  get() {
    try {
      return model.value ? parseDate(model.value) : null
    }
    catch {
      return null
    }
  },
  set(value) {
    model.value = value ? value.toString() : ''
  },
})
const outOfRange = computed(() => !!date.value && (date.value.compare(min) < 0 || date.value.compare(max.value) > 0))
const open = ref(false)
</script>

<template>
  <UInputDate
    v-model="date"
    :locale="tag"
    :min-value="min"
    :max-value="max"
    :readonly="props.readonly"
    :color="outOfRange ? 'error' : undefined"
    :highlight="outOfRange"
    :ui="props.readonly ? { base: 'bg-elevated text-muted' } : undefined"
    icon="i-lucide-calendar"
    class="w-full"
  >
    <template v-if="!props.readonly" #trailing>
      <UButton
        v-if="date"
        icon="i-lucide-x"
        color="neutral"
        variant="link"
        size="xs"
        :aria-label="t('purchaseDate.clear')"
        data-test="purchase-date-clear"
        @click="date = null"
      />
      <UPopover v-model:open="open" :content="{ align: 'end' }">
        <UButton
          icon="i-lucide-calendar-days"
          color="neutral"
          variant="link"
          size="xs"
          :aria-label="t('purchaseDate.openCalendar')"
          data-test="purchase-date-calendar"
        />
        <template #content>
          <UCalendar
            v-model="date"
            :locale="tag"
            :min-value="min"
            :max-value="max"
            class="p-2"
            @update:model-value="open = false"
          />
        </template>
      </UPopover>
    </template>
  </UInputDate>
</template>
