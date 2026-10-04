import type { H3Event } from 'h3'
import { toErrorResponse, resolveActor } from '../lib/api-errors'
import { idParamSchema } from '../lib/schemas'

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  429: 'Too Many Requests',
  502: 'Bad Gateway',
}

/** Wraps a handler so every thrown error becomes a JSON error response with a stable `data.code`. */
export function handle<T>(fn: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    try {
      return await fn(event)
    }
    catch (error) {
      const response = toErrorResponse(error)
      if (response.status >= 500) {
        console.error(error)
      }
      throw createError({
        statusCode: response.status,
        statusMessage: STATUS_TEXT[response.status] ?? 'Internal Server Error',
        message: response.message,
        data: { code: response.code, issues: response.issues },
      })
    }
  })
}

/** Name of the user the reverse proxy authenticated, used for `changed_by` fields. */
export function getActor(event: H3Event): string {
  return resolveActor(getHeader(event, useServices().config.userHeader))
}

export function getIdParam(event: H3Event, name = 'id'): number {
  return idParamSchema.parse(getRouterParam(event, name))
}
