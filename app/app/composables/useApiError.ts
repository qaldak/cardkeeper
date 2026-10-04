/** Turns a failed API call into a translated, user facing message based on the error `code`. */
export function useApiError() {
  const { t, te } = useI18n()

  return (error: unknown): string => {
    const code = (error as { data?: { data?: { code?: string } } })?.data?.data?.code
    return code && te(`errors.${code}`) ? t(`errors.${code}`) : t('errors.unknown')
  }
}
