import { setsQuerySchema } from '../../lib/schemas'

// Sets of a game with logo and size, for choosing the set of a card before entering its number.
export default handle(async (event) => {
  const { game, language } = setsQuerySchema.parse(getQuery(event))
  return useServices().catalog.sets(game, language)
})
