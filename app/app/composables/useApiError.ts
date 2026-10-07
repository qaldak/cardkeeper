/** Turns a failed API call into a translated, user facing message based on the error `code`. */
export function useApiError() {
  const { t, te } = useI18n()
  const user = useState('auth-user')

  return (error: unknown): string => {
    const code = (error as { data?: { data?: { code?: string } } })?.data?.data?.code
    // An expired session: the next page leads to the login.
    if (code === 'unauthenticated' && import.meta.client) {
      user.value = null
      void navigateTo('/login')
    }
    return code && te(`errors.${code}`) ? t(`errors.${code}`, { min: 8 }) : t('errors.unknown')
  }
}
