/** The attributes that a card entered by hand can have (the keys under which the card database stores them). */
export const MANUAL_ATTRIBUTE_KEYS = ['type', 'race', 'attribute', 'level', 'atk', 'def'] as const

export type ManualAttributeKey = (typeof MANUAL_ATTRIBUTE_KEYS)[number]

export type ManualAttributeInput = Partial<Record<ManualAttributeKey, string | number | null>>

/** The attributes to store: only what was filled in. An empty field is not stored (no `null`, no marker like -1). */
export function manualAttributes(input: ManualAttributeInput | undefined): Record<string, string | number> {
  const attributes: Record<string, string | number> = {}
  for (const key of MANUAL_ATTRIBUTE_KEYS) {
    const value = input?.[key]
    if (value !== null && value !== undefined && value !== '') {
      attributes[key] = value
    }
  }
  return attributes
}

/** A text field of the form: blank means "not present". */
export const textOrNull = (value: string | null | undefined): string | null => value?.trim() || null
