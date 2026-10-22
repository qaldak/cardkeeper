import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'

export type ExportLocale = 'de' | 'en'

const CATALOGS: Record<ExportLocale, unknown> = { de, en }

function lookup(catalog: unknown, key: string): string | undefined {
  let node = catalog
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) {
      return undefined
    }
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

/**
 * The texts of the interface (the locale files of the app) for the server, e.g. for the headers and the translated
 * values of an export: the text in the language, else the English one, else the key itself. `{name}` is replaced.
 */
export function translator(locale: ExportLocale) {
  const translate = (key: string, params: Record<string, string | number> = {}): string => {
    const text = lookup(CATALOGS[locale], key) ?? lookup(CATALOGS.en, key) ?? key
    return text.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match))
  }
  /** Whether the language itself has a text for the key (the English fallback does not count). */
  const has = (key: string) => lookup(CATALOGS[locale], key) !== undefined || lookup(CATALOGS.en, key) !== undefined
  return { t: translate, has }
}

export type Translator = ReturnType<typeof translator>
