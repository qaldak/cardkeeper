import { preferredLanguage, sortByLanguagePreference } from '../../shared/utils/languages'
import type { CommonCard, CommonCardImage, CommonCardPrice, CommonCardSet } from '../tcg/types'

export interface CardTranslation {
  language: string
  name: string
  description: string | null
  /** Language dependent data beyond name and description (Pokémon); null if there is none. */
  details: Record<string, unknown> | null
}

/** The per-language API responses of one card, merged into what is stored. */
export interface MergedCard {
  externalId: string
  /** Name in the preferred language. */
  name: string
  translations: CardTranslation[]
  /** Language independent values; taken from the English response when there is one. */
  attributes: Record<string, unknown>
  /** Printings of all languages, de-duplicated. */
  sets: CommonCardSet[]
  images: CommonCardImage[]
  prices: CommonCardPrice[]
  /** Raw API responses, one snapshot per language. */
  snapshots: { language: string, raw: unknown }[]
}

/**
 * Merges the responses for the same card in different languages. English is the canonical source
 * for the language independent data, and every language contributes its text.
 *
 * A translation that is identical to the English one (name, description and details) is dropped: it
 * means the API answered with the English card instead of a translation, and storing it would show
 * English text as if it were German.
 */
export function mergeLanguageCards(cards: readonly CommonCard[]): MergedCard {
  const first = cards[0]
  if (!first) {
    throw new Error('At least one language response is required')
  }
  const english = cards.find(card => card.language === 'en')
  const canonical = english ?? first

  const translations: CardTranslation[] = []
  for (const card of cards) {
    const isEnglishCopy = english !== undefined
      && card !== english
      && card.name === english.name
      && (card.description ?? null) === (english.description ?? null)
      && JSON.stringify(card.details ?? null) === JSON.stringify(english.details ?? null)
    if (!isEnglishCopy) {
      translations.push({ language: card.language, name: card.name, description: card.description, details: card.details ?? null })
    }
  }
  const sortedTranslations = sortByLanguagePreference(translations)

  // Printings: the canonical (English) response is complete; another language only adds printings
  // with a set code or variant the canonical one does not have (e.g. a German-only print). Comparing
  // the rarity there would duplicate every Pokémon, because its rarity is translated.
  const sets: CommonCardSet[] = []
  const seenFull = new Set<string>()
  const seenPrinting = new Set<string>()
  const printing = (set: CommonCardSet) => `${set.setCode}\u0000${set.edition ?? ''}`
  for (const set of canonical.sets) {
    const key = `${printing(set)}\u0000${set.rarity ?? ''}`
    if (!seenFull.has(key)) {
      seenFull.add(key)
      seenPrinting.add(printing(set))
      sets.push(set)
    }
  }
  for (const other of cards.filter(entry => entry !== canonical)) {
    for (const set of other.sets) {
      if (!seenPrinting.has(printing(set))) {
        seenPrinting.add(printing(set))
        sets.push(set)
      }
    }
  }

  const primaryLanguage = preferredLanguage(sortedTranslations.map(entry => entry.language))
  const primary = sortedTranslations.find(entry => entry.language === primaryLanguage) ?? sortedTranslations[0]!

  return {
    externalId: canonical.externalId,
    name: primary.name,
    translations: sortedTranslations,
    attributes: canonical.attributes,
    sets,
    images: canonical.images,
    prices: canonical.prices,
    snapshots: cards.map(card => ({ language: card.language, raw: card.raw })),
  }
}

/** Name of the preferred language among already stored translations. */
export function primaryName<T extends { language: string, name: string }>(translations: readonly T[], fallback: string): string {
  const language = preferredLanguage(translations.map(entry => entry.language))
  return translations.find(entry => entry.language === language)?.name ?? fallback
}
