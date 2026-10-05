import { POKEMON_VARIANTS, type PokemonAttributes, type PokemonDetails } from '../../../shared/types/pokemon'
import { HttpError } from '../../lib/errors'
import type { CommonCard, CommonCardImage, CommonCardSet } from '../types'
import { normalizeCategorical } from './normalize'
import { mapTcgdexPricing } from './pricing'
import { tcgdexCardSchema } from './schema'

/** Removes keys without a value, so the stored JSON only holds what the API delivered. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined) {
    return undefined
  }
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Image URLs of a card: `<base>/<quality>.<extension>`. WebP is small and supported everywhere. */
export function cardImages(base: string | undefined): CommonCardImage[] {
  return base ? [{ url: `${base}/high.webp`, smallUrl: `${base}/low.webp` }] : []
}

/**
 * Maps one TCGdex card to the common card schema. Throws a 502 if the payload is malformed.
 *
 * Everything language independent goes to `attributes` (the merge takes it from the English response),
 * everything that is translated goes to `details` of this language.
 */
export function mapTcgdexCard(raw: unknown, language: string): CommonCard {
  const parsed = tcgdexCardSchema.safeParse(raw)
  if (!parsed.success) {
    throw new HttpError(502, 'upstream_invalid_response', 'Unexpected card data from TCGdex')
  }
  const card = parsed.data

  const variants = Object.fromEntries(
    POKEMON_VARIANTS.map(key => [key, card.variants?.[key] === true]),
  ) as PokemonAttributes['variants']

  const categorical = normalizeCategorical(language, {
    category: card.category,
    types: card.types,
    stage: card.stage,
    trainerType: card.trainerType,
    energyType: card.energyType,
  })

  const attributes: PokemonAttributes = compact({
    category: categorical.category ?? 'Pokemon',
    localId: String(card.localId ?? card.id.split('-').pop() ?? ''),
    setId: card.set?.id ?? card.id.split('-')[0] ?? '',
    setCardCount: card.set?.cardCount,
    hp: toNumber(card.hp),
    types: categorical.types,
    stage: categorical.stage,
    evolveFrom: card.evolveFrom,
    dexId: card.dexId,
    level: toNumber(card.level),
    suffix: card.suffix,
    retreat: toNumber(card.retreat),
    regulationMark: card.regulationMark,
    illustrator: card.illustrator,
    trainerType: categorical.trainerType,
    energyType: categorical.energyType,
    legal: card.legal,
    variants,
  })

  const details: PokemonDetails = compact({
    category: card.category,
    types: card.types,
    stage: card.stage,
    rarity: card.rarity,
    trainerType: card.trainerType,
    energyType: card.energyType,
    evolveFrom: card.evolveFrom,
    set: card.set ? { name: card.set.name } : undefined,
    attacks: card.attacks?.map(attack => compact({
      name: attack.name,
      cost: attack.cost ?? [],
      damage: attack.damage,
      effect: attack.effect,
    })),
    abilities: card.abilities?.map(ability => compact({ type: ability.type, name: ability.name, effect: ability.effect })),
    weaknesses: card.weaknesses?.map(entry => compact({ type: entry.type, value: entry.value })),
    resistances: card.resistances?.map(entry => compact({ type: entry.type, value: entry.value })),
    effect: card.effect,
  })

  // The card id is the same for every language and identifies the printing; the physical card is
  // one of the variants that exist, so each variant is one choice.
  const available = POKEMON_VARIANTS.filter(key => variants[key])
  const sets: CommonCardSet[] = (available.length > 0 ? available : ['normal' as const]).map(edition => ({
    setCode: card.id,
    setName: card.set?.name ?? null,
    rarity: card.rarity ?? null,
    edition,
  }))

  return {
    externalId: card.id,
    name: card.name,
    description: card.description ?? card.effect ?? null,
    language,
    attributes: attributes as unknown as Record<string, unknown>,
    details: details as Record<string, unknown>,
    sets,
    images: cardImages(card.image),
    prices: mapTcgdexPricing(card.pricing),
    raw,
  }
}
