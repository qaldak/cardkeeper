import { describeUnknownEditions } from '../lib/editions'

// Reports editions that are none of the known keys (older free text) in the log at every start. They are left as they
// are, so that the owner can fix them with SQL.
export default defineNitroPlugin(async () => {
  try {
    const lines = describeUnknownEditions(await useServices().cards.unknownEditions())
    if (lines) {
      console.warn(`[editions] ${lines.join('\n')}`)
    }
  }
  catch (error) {
    console.error('Could not check the editions', error)
  }
})
