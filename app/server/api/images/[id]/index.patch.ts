import { z } from 'zod'

// The only supported change is promoting an image to primary.
export default handle(async (event) => {
  const id = getIdParam(event)
  z.object({ isPrimary: z.literal(true) }).parse(await readBody(event))
  await useServices().images.setPrimary(id, getActor(event))
  setResponseStatus(event, 204)
  return null
})
