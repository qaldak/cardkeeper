// Card lifecycle states. Stored language-neutral; the UI translates them.
export const CARD_STATUSES = ['ACTIVE', 'SOLD', 'TRADED', 'GIFTED', 'LOST'] as const

export type CardStatusValue = (typeof CARD_STATUSES)[number]

export function isCardStatus(value: unknown): value is CardStatusValue {
  return typeof value === 'string' && (CARD_STATUSES as readonly string[]).includes(value)
}

/** A date is recorded for every status except ACTIVE. */
export function statusNeedsDate(status: CardStatusValue): boolean {
  return status !== 'ACTIVE'
}

/** A counterpart (person) is only meaningful when the card went to someone else. */
export function statusNeedsPerson(status: CardStatusValue): boolean {
  return status === 'SOLD' || status === 'TRADED' || status === 'GIFTED'
}
