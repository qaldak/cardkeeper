/** Error with an HTTP status and a stable machine readable code, translated to a response by the API layer. */
export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message?: string, options?: ErrorOptions) {
    super(message ?? code, options)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

export const notFound = (code: string, message?: string) => new HttpError(404, code, message)
export const badRequest = (code: string, message?: string) => new HttpError(400, code, message)
