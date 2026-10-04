import { closeServices } from '../utils/services'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    await closeServices()
  })
})
