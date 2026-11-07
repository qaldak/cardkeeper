import { createManualCardSchema } from '../../lib/schemas'

// A card that the card database does not know, entered by hand (Yu-Gi-Oh! only for now).
export default handle(async (event) => {
  const input = createManualCardSchema.parse(await readBody(event))
  const card = await useServices().cards.createManual(input, getActor(event))
  setResponseStatus(event, 201)
  return card
})
