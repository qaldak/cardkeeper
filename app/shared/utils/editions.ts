/**
 * The editions of a Yu-Gi-Oh! card that nearly every card has, as they are stored: in English, like the card
 * databases and the marketplaces write them. `key` names the translation of the label.
 */
export const YGO_EDITIONS = [
  { value: '1st Edition', key: 'first' },
  { value: 'Unlimited', key: 'unlimited' },
  { value: 'Limited Edition', key: 'limited' },
] as const

export type EditionChoice = (typeof YGO_EDITIONS)[number]
