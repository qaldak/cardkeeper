// Game specific card attributes that can be edited manually. They are stored in the
// JSONB column `cards.game_specific_attributes`; a new game only needs a new entry here.

export type AttributeKind = 'number' | 'text'

export interface AttributeField {
  key: string
  kind: AttributeKind
}

export const GAME_ATTRIBUTE_FIELDS: Record<string, readonly AttributeField[]> = {
  ygo: [
    { key: 'atk', kind: 'number' },
    { key: 'def', kind: 'number' },
    { key: 'level', kind: 'number' },
    { key: 'type', kind: 'text' },
    { key: 'race', kind: 'text' },
    { key: 'attribute', kind: 'text' },
  ],
}

export function getAttributeFields(gameSlug: string): readonly AttributeField[] {
  return GAME_ATTRIBUTE_FIELDS[gameSlug] ?? []
}

/**
 * Converts the text of a form input into the value stored in the database.
 * Empty input clears the attribute; "?" is stored as -1 (the API's marker for unknown ATK/DEF).
 * Returns `undefined` when the input is not valid for the field kind.
 */
export function parseAttributeInput(kind: AttributeKind, input: string): string | number | null | undefined {
  const text = input.trim()
  if (text === '') {
    return null
  }
  if (kind === 'text') {
    return text
  }
  if (text === '?') {
    return -1
  }
  return /^-?\d{1,6}$/.test(text) ? Number(text) : undefined
}

/** Converts a stored attribute value into the text shown in a form input. */
export function formatAttributeValue(kind: AttributeKind, value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (kind === 'number' && value === -1) {
    return '?'
  }
  return String(value)
}
