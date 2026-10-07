import type { SessionUserDto } from '../../../shared/types/api'
import { changePasswordSchema } from '../../lib/schemas'
import { startSession } from '../../lib/session'

// Logs the user in again with the new password stamp, so this browser stays logged in while every other one is not.
export default handle(async (event): Promise<SessionUserDto> => {
  const user = await requireUser(event)
  const { currentPassword, newPassword } = changePasswordSchema.parse(await readBody(event))
  const { users, config } = useServices()
  const updated = await users.changePassword(user.id, currentPassword, newPassword)
  await startSession(event, config.sessionSecret, { uid: updated.id, stamp: updated.stamp })
  return { id: updated.id, name: updated.name, mustChangePassword: updated.mustChangePassword }
})
