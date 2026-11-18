/**
 * The fields that a failed save marks: the API answers a rejected input with the path of every wrong field
 * (`data.data.issues`, e.g. `set.setCode`). A field is marked with a short message ("Required" when it is empty,
 * otherwise "Invalid value") and unmarked as soon as it is changed.
 */
// Errors that have a code of their own and belong to one field: the field is marked with the text of the error.
const FIELD_OF_CODE: Record<string, string> = { purchase_date_in_future: 'purchaseDate' }

export function useFormIssues() {
  const { t } = useI18n()
  const messages = ref<Record<string, string>>({})

  /** Marks the fields of a rejected input; `valueOf` gives the current text of the field of a path. Returns whether any was marked. */
  function fromError(error: unknown, valueOf: (path: string) => string | undefined): boolean {
    const issues = (error as { data?: { data?: { issues?: { path?: string }[] } } })?.data?.data?.issues ?? []
    const next: Record<string, string> = {}
    for (const { path } of issues) {
      if (path) {
        next[path] = (valueOf(path) ?? '').trim() === '' ? t('errors.fieldRequired') : t('errors.fieldInvalid')
      }
    }
    const code = (error as { data?: { data?: { code?: string } } })?.data?.data?.code
    if (code && FIELD_OF_CODE[code]) {
      next[FIELD_OF_CODE[code]] = t(`errors.${code}`)
    }
    messages.value = next
    return Object.keys(next).length > 0
  }

  /** The message of the first marked path, for the field (`UFormField :error`). */
  const errorOf = (...paths: string[]): string | undefined => paths.map(path => messages.value[path]).find(Boolean)

  function clear(path: string) {
    if (path in messages.value) {
      const { [path]: _removed, ...rest } = messages.value
      messages.value = rest
    }
  }

  const reset = () => {
    messages.value = {}
  }

  return { fromError, errorOf, clear, reset }
}
