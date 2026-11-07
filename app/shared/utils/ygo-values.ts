/**
 * The values that the Yu-Gi-Oh! card database (YGOPRODeck) uses for card type (`type`), type (`race`) and attribute.
 * Taken from the data of the API on 2026-11-07, not from third-party libraries (the API writes "Creator God", and
 * has "Illusion"). A manually entered card may only use these values. They are English and language independent, as
 * they are stored for cards from the database.
 */

/** The card types ("Kartentyp"), including `Token`. */
export const YGO_CARD_TYPES = [
  'Effect Monster',
  'Flip Effect Monster',
  'Flip Tuner Effect Monster',
  'Fusion Monster',
  'Gemini Monster',
  'Link Monster',
  'Normal Monster',
  'Normal Tuner Monster',
  'Pendulum Effect Fusion Monster',
  'Pendulum Effect Monster',
  'Pendulum Effect Ritual Monster',
  'Pendulum Flip Effect Monster',
  'Pendulum Normal Monster',
  'Pendulum Tuner Effect Monster',
  'Ritual Effect Monster',
  'Ritual Monster',
  'Skill Card',
  'Spell Card',
  'Spirit Monster',
  'Synchro Monster',
  'Synchro Pendulum Effect Monster',
  'Synchro Tuner Monster',
  'Token',
  'Toon Monster',
  'Trap Card',
  'Tuner Monster',
  'Union Effect Monster',
  'XYZ Monster',
  'XYZ Pendulum Effect Monster',
] as const

/** The types ("Typ"): the monster types, then the types of spells and traps. There is no type `Token`. */
export const YGO_RACES = [
  // Monsters
  'Aqua',
  'Beast',
  'Beast-Warrior',
  'Creator God',
  'Cyberse',
  'Dinosaur',
  'Divine-Beast',
  'Dragon',
  'Fairy',
  'Fiend',
  'Fish',
  'Illusion',
  'Insect',
  'Machine',
  'Plant',
  'Psychic',
  'Pyro',
  'Reptile',
  'Rock',
  'Sea Serpent',
  'Spellcaster',
  'Thunder',
  'Warrior',
  'Winged Beast',
  'Wyrm',
  'Zombie',
  // Spells and traps ("Normal" and "Continuous" are used by both)
  'Continuous',
  'Counter',
  'Equip',
  'Field',
  'Normal',
  'Quick-Play',
  'Ritual',
] as const

export const YGO_ATTRIBUTES = ['DARK', 'DIVINE', 'EARTH', 'FIRE', 'LIGHT', 'WATER', 'WIND'] as const

export type YgoCardType = (typeof YGO_CARD_TYPES)[number]
export type YgoRace = (typeof YGO_RACES)[number]
export type YgoAttribute = (typeof YGO_ATTRIBUTES)[number]
