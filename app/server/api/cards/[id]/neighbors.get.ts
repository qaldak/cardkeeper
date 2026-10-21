import { listQuerySchema } from '../../../lib/schemas'

// The same filters and sort order as the list; `pageSize` tells which page of the overview shows the card.
export default handle(async (event) => {
  const { page: _page, pageSize, sort, dir, ...filters } = listQuerySchema.parse(getQuery(event))
  return useServices().cards.neighbors(getIdParam(event), filters, { sort, dir }, pageSize)
})
