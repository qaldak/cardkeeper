import type { SessionUserDto } from '../../../shared/types/api'

export default handle(async (event): Promise<SessionUserDto> => {
  const user = await requireUser(event)
  return { id: user.id, name: user.name, mustChangePassword: user.mustChangePassword }
})
