import { playerSchema } from '../../lib/schemas'

export default handle(async (event) => {
  const id = getIdParam(event)
  return useServices().players.update(id, playerSchema.parse(await readBody(event)))
})
