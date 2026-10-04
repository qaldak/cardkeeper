import { z } from 'zod'

// One card with the data of all languages (in particular every known printing) for the "add card" form.
export default handle(async (event) => {
  const externalId = z.string().trim().min(1).max(40).parse(getRouterParam(event, 'externalId'))
  const { game } = z.object({ game: z.string().trim().min(1).max(40) }).parse(getQuery(event))
  return useServices().cards.lookupDetails(game, externalId)
})
