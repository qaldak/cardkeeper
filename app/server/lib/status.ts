import { isCardStatus, statusNeedsPerson, type CardStatusValue } from '../../shared/utils/status'
import { parseDateOnly, utcToday } from './dates'
import { badRequest } from './errors'

export interface StatusChangeInput {
  status: CardStatusValue
  date?: string | null
  person?: string | null
}

export interface NormalizedStatusChange {
  status: CardStatusValue
  date: Date
  person: string | null
}

/**
 * Applies the status rules: the date defaults to today, a person is only kept for statuses where
 * the card went to someone else (sold, traded, gifted) and is dropped otherwise.
 */
export function normalizeStatusChange(input: StatusChangeInput, now: Date = new Date()): NormalizedStatusChange {
  if (!isCardStatus(input.status)) {
    throw badRequest('invalid_status', `Unknown status "${String(input.status)}"`)
  }
  const date = input.status !== 'ACTIVE' && input.date ? parseDateOnly(input.date) : utcToday(now)
  const trimmedPerson = input.person?.trim() ?? ''
  const person = statusNeedsPerson(input.status) && trimmedPerson !== '' ? trimmedPerson : null
  return { status: input.status, date, person }
}
