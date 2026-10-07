import { endSession } from '../../lib/session'

export default handle(async (event) => {
  await endSession(event, useServices().config.sessionSecret)
  return { ok: true }
})
