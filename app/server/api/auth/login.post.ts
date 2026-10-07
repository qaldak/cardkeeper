import { loginSchema } from '../../lib/schemas'
import { startSession } from '../../lib/session'

export default handle(async (event) => {
  const { name, password } = loginSchema.parse(await readBody(event))
  const { users, config } = useServices()
  const user = await users.login(name, password)
  await startSession(event, config.sessionSecret, { uid: user.id, stamp: user.stamp })
  return { id: user.id, name: user.name, mustChangePassword: user.mustChangePassword }
})
