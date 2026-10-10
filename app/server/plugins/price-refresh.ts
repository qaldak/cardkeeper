// Reloads the prices of the cards on a schedule (see PRICE_REFRESH_* in the README). The app checks every ten minutes
// whether a tranche is due; the service decides, from the records in the database, so that a restart neither skips nor
// repeats a tranche.
const CHECK_EVERY_MS = 10 * 60_000
const FIRST_CHECK_AFTER_MS = 60_000

export default defineNitroPlugin((nitroApp) => {
  const services = useServices()
  console.info(`[prices] ${services.prices.describe()}`)
  if (!services.prices.enabled) {
    return
  }

  const check = async () => {
    try {
      const summary = await services.prices.runDue()
      if (summary) {
        console.info(`[prices] Tranche ${summary.status}: ${summary.due} cards due, ${summary.updated} reloaded, ${summary.failed} failed`)
      }
    }
    catch (error) {
      console.error('[prices] The scheduled price reload failed', error)
    }
  }

  const first = setTimeout(check, FIRST_CHECK_AFTER_MS)
  const timer = setInterval(check, CHECK_EVERY_MS)
  first.unref()
  timer.unref()
  nitroApp.hooks.hook('close', () => {
    clearTimeout(first)
    clearInterval(timer)
  })
})
