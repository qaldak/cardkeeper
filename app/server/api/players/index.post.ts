import { playerSchema } from '../../lib/schemas'

export default handle(async (event) => {
  const player = await useServices().players.create(playerSchema.parse(await readBody(event)))
  setResponseStatus(event, 201)
  return player
})
