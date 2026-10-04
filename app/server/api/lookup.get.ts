import { lookupQuerySchema } from '../lib/schemas'

// Search for cards to add: German first, English if there is no German match.
export default handle(async (event) => {
  const query = lookupQuerySchema.parse(getQuery(event))
  return useServices().cards.lookup(query.game, query.q)
})
