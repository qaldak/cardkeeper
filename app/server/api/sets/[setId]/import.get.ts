import { z } from 'zod'
import { setsQuerySchema } from '../../../lib/schemas'

// The cards of a set with the prints of every card (codes and rarities, or variants), for adding a whole set.
export default handle(async (event) => {
  const setId = z.string().trim().min(1).max(100).parse(getRouterParam(event, 'setId'))
  const { game, language } = setsQuerySchema.parse(getQuery(event))
  return useServices().catalog.setImport(game, setId, language)
})
