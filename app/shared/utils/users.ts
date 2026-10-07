// Rules for users and passwords, shared by the server and the forms.

/** The password of every user who has not chosen one yet (or whose password was reset). It is public, so it must be changed. */
export const INITIAL_PASSWORD = 'cardkeeper'
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 200

/** What a user name may consist of; the same characters were already allowed for the names in the change log. */
export const USERNAME_PATTERN = /^[\p{L}\p{N} ._@+-]{1,100}$/u

export type PasswordProblem = 'too_short' | 'too_long' | 'initial'

/** Why a new password is not acceptable, or null. */
export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'too_short'
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'too_long'
  }
  return password.toLowerCase() === INITIAL_PASSWORD ? 'initial' : null
}
