import { forbidden } from './errors'

/** The logged in user on whose behalf something is changed. */
export interface Actor {
  id: number
  name: string
}

/** Only the owner may change a card. Cards without an owner (from before the logins) cannot be changed by anybody. */
export function assertOwner(card: { ownerUserId: number | null }, actor: Actor): void {
  if (card.ownerUserId === null) {
    throw forbidden('card_has_no_owner', 'This card has no owner and cannot be changed')
  }
  if (card.ownerUserId !== actor.id) {
    throw forbidden('not_card_owner', 'Only the owner can change this card')
  }
}
