import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { notFound } from '../../../lib/errors'
import { inlineDisposition } from '../../../lib/image-files'

// Serves a stored card image. An image id never changes its content, so it can be cached forever.
export default handle(async (event) => {
  const file = await useServices().images.getFile(getIdParam(event))
  const info = await stat(file.path).catch(() => null)
  if (!info?.isFile()) {
    throw notFound('image_file_missing', 'Image file not found')
  }
  setResponseHeaders(event, {
    'content-type': file.mime,
    'content-disposition': inlineDisposition(file.fileName),
    'content-length': info.size,
    'cache-control': 'private, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
  })
  return sendStream(event, createReadStream(file.path))
})
