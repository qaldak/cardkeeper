import { z } from 'zod'
import { setsQuerySchema } from '../../lib/schemas'

// The cards of one set (number, name, image).
export default handle(async (event) => {
  const setId = z.string().trim().min(1).max(100).parse(getRouterParam(event, 'setId'))
  const { game, language } = setsQuerySchema.parse(getQuery(event))
  return useServices().catalog.setCards(game, setId, language)
})
