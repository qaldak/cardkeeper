import { z } from 'zod'
import { listQuerySchema } from '../../lib/schemas'

// The table export of the selection of the overview: the same filters and sort order as the list (every page), plus the
// language of the interface. It is a download, not a page: the browser saves the file.
const exportQuerySchema = listQuerySchema.extend({ lang: z.enum(['de', 'en']).default('en') })

export default handle(async (event) => {
  const { page: _page, pageSize: _pageSize, sort, dir, lang, ...filters } = exportQuerySchema.parse(getQuery(event))
  const { fileName, csv } = await useServices().export.cardsCsv(filters, { sort, dir }, lang)
  setResponseHeaders(event, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="${fileName}"`,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  return csv
})
