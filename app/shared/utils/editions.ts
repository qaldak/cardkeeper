/**
 * The editions that are printed on a Yu-Gi-Oh! card, left of the set code. `card_sets.edition` stores the key, never
 * the label, so the label can follow the language (`edition.<KEY>` in the locale files, like `status.<KEY>`).
 * "Unlimited" is not printed on the card: it is the card without an edition, stored as NULL.
 * Any other text (older data, the API) is shown exactly as stored.
 */
export const EDITION_KEYS = ['FIRST_EDITION', 'LIMITED_EDITION'] as const

export type EditionKey = (typeof EDITION_KEYS)[number]

export const YGO_EDITIONS: readonly EditionKey[] = EDITION_KEYS

export const isEditionKey = (value: unknown): value is EditionKey =>
  typeof value === 'string' && (EDITION_KEYS as readonly string[]).includes(value)

/** The label of a stored edition: a key is translated, any other (free) text is returned unchanged. */
export function editionLabel(value: string | null | undefined, translate: (key: string) => string): string {
  if (!value) {
    return ''
  }
  return isEditionKey(value) ? translate(`edition.${value}`) : value
}
