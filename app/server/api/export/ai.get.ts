import { aiExportQuerySchema } from '../../lib/schemas'

// The text of the selection of the overview for an AI prompt. The dialog shows the text and copies or saves it, so the
// answer is JSON, not a download.
export default handle(async (event) => {
  const { page: _page, pageSize: _pageSize, sort, dir, onlyActive, withText, intro, wish, ...filters } = aiExportQuerySchema.parse(getQuery(event))
  const result = await useServices().export.cardsAiText(filters, { sort, dir }, { onlyActive, withText, intro, wish })
  setResponseHeaders(event, { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
  return result
})
