import { editionLabel } from '#shared/utils/editions'

/**
 * Translated labels for stored values. Values are keys ("reverse", "FIRST_EDITION") or the English API
 * spellings ("Fire", "Stage1"); an unknown value is shown as it is.
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
    // The preset editions of a Yu-Gi-Oh! card are stored as keys (FIRST_EDITION → "1. Auflage"); any other text is shown as it is.
    edition: (value: string | null | undefined) => editionLabel(value, key => t(key)),
    pokemonCategory: (value: string | null | undefined) => label('pokemon.category', value),
    pokemonType: (value: string | null | undefined) => label('pokemon.type', value),
    pokemonStage: (value: string | null | undefined) => label('pokemon.stage', value),
    trainerType: (value: string | null | undefined) => label('pokemon.trainerType', value),
    energyType: (value: string | null | undefined) => label('pokemon.energyType', value),
  }
}
