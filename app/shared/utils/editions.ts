/**
 * The editions of a Yu-Gi-Oh! card that nearly every card has. `card_sets.edition` stores the key, never the
 * label, so the label can follow the language (`edition.<KEY>` in the locale files, like `status.<KEY>`).
 * Every other edition is free text and is stored and shown exactly as typed.
 */
export const EDITION_KEYS = ['FIRST_EDITION', 'UNLIMITED', 'LIMITED_EDITION'] as const

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
