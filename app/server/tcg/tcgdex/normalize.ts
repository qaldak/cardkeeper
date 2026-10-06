// Language independent values (category, type, stage, ...) are stored in the English spelling so filters work
// across languages. German and English cards get them from the English response. A card that only exists in
// Japanese has no English response, so the common Japanese names are mapped to the English ones here.
// Anything not in these tables stays as the API delivered it.

const CATEGORY: Record<string, string> = { 'ポケモン': 'Pokemon', 'トレーナーズ': 'Trainer', 'エネルギー': 'Energy' }

const TYPE: Record<string, string> = {
  '草': 'Grass', '炎': 'Fire', '水': 'Water', '雷': 'Lightning', '超': 'Psychic', '闘': 'Fighting',
  '悪': 'Darkness', '鋼': 'Metal', '竜': 'Dragon', '無色': 'Colorless', 'フェアリー': 'Fairy',
}

const STAGE: Record<string, string> = { 'たね': 'Basic', '1進化': 'Stage1', '2進化': 'Stage2' }

const TRAINER_TYPE: Record<string, string> = {
  'グッズ': 'Item', 'サポート': 'Supporter', 'スタジアム': 'Stadium', 'ポケモンのどうぐ': 'Tool',
}

const ENERGY_TYPE: Record<string, string> = { '基本': 'Basic', '特殊': 'Special' }

const mapped = (table: Record<string, string>, value: string | undefined) =>
  value === undefined ? undefined : (table[value] ?? value)

export interface CategoricalValues {
  category?: string
  types?: string[]
  stage?: string
  trainerType?: string
  energyType?: string
}

/** Maps Japanese categorical values to the English spelling; other languages are returned unchanged. */
export function normalizeCategorical<T extends CategoricalValues>(language: string, values: T): T {
  if (language !== 'ja') {
    return values
  }
  return {
    ...values,
    category: mapped(CATEGORY, values.category),
    types: values.types?.map(type => TYPE[type] ?? type),
    stage: mapped(STAGE, values.stage),
    trainerType: mapped(TRAINER_TYPE, values.trainerType),
    energyType: mapped(ENERGY_TYPE, values.energyType),
  }
}
