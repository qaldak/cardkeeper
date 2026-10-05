import { listQuerySchema } from '../../lib/schemas'

export default handle(async (event) => {
  const { page, pageSize, sort, dir, ...filters } = listQuerySchema.parse(getQuery(event))
  return useServices().cards.list(filters, { page, pageSize }, { sort, dir })
})
