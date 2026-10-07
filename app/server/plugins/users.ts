// Creates the users of the USERS list that do not exist yet. The configuration is read first, outside the try block,
// so that a missing SESSION_SECRET stops the start with a clear message instead of failing every request later.
export default defineNitroPlugin(async () => {
  const services = useServices()
  try {
    const created = await services.users.ensure(services.config.users)
    if (created.length > 0) {
      console.info(`Created users with the initial password: ${created.join(', ')}`)
    }
    if (await services.users.count() === 0) {
      console.warn('There is no user yet, so nobody can log in. Set USERS in the .env file (e.g. USERS=anna,max).')
    }
  }
  catch (error) {
    console.error('Could not create the users from USERS', error)
  }
})
