import { ZodError } from 'zod'
import { HttpError } from './errors'

export interface ErrorResponse {
  status: number
  code: string
  message: string
  issues?: { path: string, message: string }[]
}

/** Maps any thrown value to a safe API error. Unknown errors never leak their message. */
export function toErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof HttpError) {
    return { status: error.status, code: error.code, message: error.message }
  }
  if (error instanceof ZodError) {
    return {
      status: 400,
      code: 'validation_error',
      message: 'Invalid request',
      issues: error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
    }
  }
  return { status: 500, code: 'internal_error', message: 'Internal server error' }
}

/** Prisma "unique constraint failed". */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'
}
