import { preferredLanguage, sortByLanguagePreference } from '../../shared/utils/languages'
import type { CommonCard, CommonCardImage, CommonCardPrice, CommonCardSet } from '../tcg/types'

export interface CardTranslation {
  language: string
  name: string
  description: string | null
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
 * A translation that is identical to the English text (name and description) is dropped: it means
 * the API answered with the English card instead of a translation, and storing it would show
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
    if (!isEnglishCopy) {
      translations.push({ language: card.language, name: card.name, description: card.description })
    }
  }
  const sortedTranslations = sortByLanguagePreference(translations)

  const seenSets = new Set<string>()
  const sets: CommonCardSet[] = []
  for (const card of [canonical, ...cards.filter(other => other !== canonical)]) {
    for (const set of card.sets) {
      const key = `${set.setCode}\u0000${set.rarity ?? ''}`
      if (!seenSets.has(key)) {
        seenSets.add(key)
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
export function primaryName(translations: readonly CardTranslation[], fallback: string): string {
  const language = preferredLanguage(translations.map(entry => entry.language))
  return translations.find(entry => entry.language === language)?.name ?? fallback
}
