import { lookupQuerySchema } from '../lib/schemas'

export default handle(async (event) => {
  const query = lookupQuerySchema.parse(getQuery(event))
  return useServices().cards.lookup(query.game, query.q, query.language)
})
