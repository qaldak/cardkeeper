// Game specific card attributes that are shown on the card page. They are stored in the
// JSONB column `cards.game_specific_attributes` and come from the card API (read-only);
// a new game only needs a new entry here.

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

/** Converts a stored attribute value into display text; -1 is the API's marker for an unknown ("?") ATK/DEF. */
export function formatAttributeValue(kind: AttributeKind, value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (kind === 'number' && value === -1) {
    return '?'
  }
  return String(value)
}
