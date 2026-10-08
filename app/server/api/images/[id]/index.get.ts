import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { notFound } from '../../../lib/errors'
import { etagMatches, imageEtag, inlineDisposition } from '../../../lib/image-files'

// Serves a stored card image. The browser may keep it, but has to ask whether it is still the same file: an image id
// can belong to another image later (a database that was set up again or restored starts counting from 1 once more),
// and a cache that never asks would show the old picture for the new card.
export default handle(async (event) => {
  const file = await useServices().images.getFile(getIdParam(event))
  const info = await stat(file.path).catch(() => null)
  if (!info?.isFile()) {
    throw notFound('image_file_missing', 'Image file not found')
  }
  const etag = imageEtag(file.path)
  setResponseHeaders(event, {
    etag,
    'cache-control': 'private, no-cache',
    'x-content-type-options': 'nosniff',
  })
  if (etagMatches(getRequestHeader(event, 'if-none-match'), etag)) {
    return sendNoContent(event, 304)
  }
  setResponseHeaders(event, {
    'content-type': file.mime,
    'content-disposition': inlineDisposition(file.fileName),
    'content-length': info.size,
  })
  return sendStream(event, createReadStream(file.path))
})
