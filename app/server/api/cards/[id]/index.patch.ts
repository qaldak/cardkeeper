import { updateCardSchema } from '../../../lib/schemas'

export default handle(async (event) => {
  const id = getIdParam(event)
  const patch = updateCardSchema.parse(await readBody(event))
  return useServices().cards.update(id, patch, getActor(event))
})
