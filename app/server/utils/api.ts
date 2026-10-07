import type { H3Event } from 'h3'
import { toErrorResponse } from '../lib/api-errors'
import type { Actor } from '../lib/actor'
import { unauthorized } from '../lib/errors'
import { idParamSchema } from '../lib/schemas'

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  429: 'Too Many Requests',
  502: 'Bad Gateway',
}

/** The error an API response carries: a stable `data.code` and a safe message. */
export function toH3Error(error: unknown) {
  const response = toErrorResponse(error)
  if (response.status >= 500) {
    console.error(error)
  }
  return createError({
    statusCode: response.status,
    statusMessage: STATUS_TEXT[response.status] ?? 'Internal Server Error',
    message: response.message,
    data: { code: response.code, issues: response.issues },
  })
}

/** Wraps a handler so every thrown error becomes a JSON error response with a stable `data.code`. */
export function handle<T>(fn: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    try {
      return await fn(event)
    }
    catch (error) {
      throw toH3Error(error)
    }
  })
}

/** The logged in user, set by the auth middleware before any API handler runs. */
export function getActor(event: H3Event): Actor {
  const user = event.context.user
  if (!user) {
    throw unauthorized('unauthenticated', 'Login required')
  }
  return { id: user.id, name: user.name }
}

export function getIdParam(event: H3Event, name = 'id'): number {
  return idParamSchema.parse(getRouterParam(event, name))
}
