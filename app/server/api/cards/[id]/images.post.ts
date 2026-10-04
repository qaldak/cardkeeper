import { badRequest, HttpError } from '../../../lib/errors'

// Allowance for the multipart envelope around the file itself.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024

export default handle(async (event) => {
  const id = getIdParam(event)
  const services = useServices()

  const declaredLength = Number(getHeader(event, 'content-length') ?? 0)
  if (declaredLength > services.config.maxUploadBytes + MULTIPART_OVERHEAD_BYTES) {
    throw new HttpError(413, 'file_too_large', 'The uploaded file is too large')
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename !== undefined)
  if (!file) {
    throw badRequest('missing_file', 'No file uploaded')
  }

  const image = await services.images.addManual(id, file.data, getActor(event))
  setResponseStatus(event, 201)
  return image
})
