const LOCALE_TAGS: Record<string, string> = { de: 'de-CH', en: 'en-GB' }

/** Locale aware formatting of prices and dates. Prices are shown in the currency of their source. */
export function useFormat() {
  const { locale } = useI18n()
  const tag = computed(() => LOCALE_TAGS[locale.value] ?? 'en-GB')

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat(tag.value, { style: 'currency', currency }).format(amount)

  const dateParts = { day: '2-digit', month: '2-digit', year: 'numeric' } as const

  /** Formats an ISO timestamp in the browser's time zone. */
  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(tag.value, dateParts).format(new Date(value))

  return { money, dateTime }
}
