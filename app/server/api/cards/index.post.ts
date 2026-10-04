import { createCardSchema } from '../../lib/schemas'

export default handle(async (event) => {
  const input = createCardSchema.parse(await readBody(event))
  const card = await useServices().cards.create(input, getActor(event))
  setResponseStatus(event, 201)
  return card
})
