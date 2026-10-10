import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { z } from 'zod'

// The small image of a card for the "add card" lookup, for games whose image host must not be hotlinked. It is
// downloaded once and then served from the app's own copy. The picture of a card id does not change, so it can be kept.
export default handle(async (event) => {
  const params = z.object({
    game: z.string().trim().min(1).max(40),
    externalId: z.string().trim().min(1).max(40),
  }).parse({ game: getRouterParam(event, 'game'), externalId: getRouterParam(event, 'externalId') })
  const file = await useServices().thumbnails.get(params.game, params.externalId)
  const info = await stat(file.path)
  setResponseHeaders(event, {
    'content-type': file.mime,
    'content-length': info.size,
    'cache-control': 'private, max-age=604800',
    'x-content-type-options': 'nosniff',
  })
  return sendStream(event, createReadStream(file.path))
})
