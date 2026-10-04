import { facetsQuerySchema } from '../lib/schemas'

// Distinct card types, monster types, attributes and rarities for the overview's filters.
export default handle(async (event) => {
  const { game } = facetsQuerySchema.parse(getQuery(event))
  return useServices().cards.facets(game)
})
