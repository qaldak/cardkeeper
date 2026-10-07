import { YGO_EDITIONS } from '#shared/utils/editions'

/**
 * Translated labels for stored values. Values are the English API spellings ("Fire", "Stage1",
 * "reverse"); an unknown value is shown as it is.
 */
export function useGameLabels() {
  const { t, te } = useI18n()

  const label = (prefix: string, value: string | null | undefined) => {
    if (!value) {
      return ''
    }
    const key = `${prefix}.${value}`
    return te(key) ? t(key) : value
  }

  return {
    variant: (value: string | null | undefined) => label('variant', value),
    // The usual editions of a Yu-Gi-Oh! card ("1st Edition" → "1. Auflage"); any other text is shown as it is.
    edition: (value: string | null | undefined) => {
      const known = YGO_EDITIONS.find(entry => entry.value === value)
      return known ? t(`edition.${known.key}`) : (value ?? '')
    },
    pokemonCategory: (value: string | null | undefined) => label('pokemon.category', value),
    pokemonType: (value: string | null | undefined) => label('pokemon.type', value),
    pokemonStage: (value: string | null | undefined) => label('pokemon.stage', value),
    trainerType: (value: string | null | undefined) => label('pokemon.trainerType', value),
    energyType: (value: string | null | undefined) => label('pokemon.energyType', value),
  }
}
