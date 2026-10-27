# Users and Access Specification

## Purpose
Sign-in, user management through the configuration, password rules, sessions and ownership rights on cards. All signed-in users see all cards; only the owner changes a card. Headers and cross-site protection are in `security`. Decisions: [ADR 0008](../../../docs/adr/0008-own-login-sealed-cookie.md) (login with a sealed cookie), [ADR 0009](../../../docs/adr/0009-login-lock-per-username.md) (lock per user name).

## Requirements

### Requirement: Everything is behind the login
The system SHALL reject every request under `/api/` without a valid login with 401 `unauthenticated`, except `/api/health`, `/api/auth/login` and `/api/_nuxt_icon/`.
Source: User instruction 2026-10-07 14:46; README (7f3d955) §Users; code server/middleware/auth.ts | Origin: user requirement

#### Scenario: API without login
- GIVEN no login cookie
- WHEN `GET /api/cards` is called
- THEN the system answers with 401 and the code `unauthenticated`

#### Scenario: Health without login
- GIVEN no login cookie
- WHEN `GET /api/health` is called
- THEN no sign-in is needed

### Requirement: Pages lead to the sign-in without a login
The system SHALL redirect a page of the interface to `/login` without a login, and for pages other than `/` with the target in the parameter `next`.
Source: Code app/app/middleware/auth.global.ts; User instruction 2026-10-07 14:46 | Origin: derived

#### Scenario: Page without login
- GIVEN no login
- WHEN a page of the interface is opened
- THEN the system leads to `/login`, for `/cards/5` with `next=/cards/5`

### Requirement: Everybody sees all cards
The system SHALL show every signed-in user all cards, regardless of the owner.
Source: User instruction 2026-10-07 14:46; test ownership.test.ts | Origin: user requirement

#### Scenario: Reading another person's card
- GIVEN a card belongs to Anna
- WHEN Sven opens the overview and the card
- THEN Sven sees the card

### Requirement: Only the owner changes a card
The system SHALL allow changing, deleting, updating from the card API and changing the images of a card only to its owner and reject everybody else with 403 `not_card_owner`; whoever creates a card SHALL be its owner.
Source: User instruction 2026-10-07 14:46; README (7f3d955) §Users; test ownership.test.ts | Origin: user requirement

#### Scenario: Changing another person's card
- GIVEN a card belongs to Anna
- WHEN Sven changes, deletes, updates it or changes its images
- THEN the system rejects every action with 403 `not_card_owner`

#### Scenario: Creating an own card
- GIVEN Anna creates a card
- WHEN the card is saved
- THEN Anna is its owner

### Requirement: Handing a card over to another user
The system SHALL allow the owner to hand the card over to an existing other user; afterwards only the new owner may change it; the owner cannot be cleared.
Source: User instruction 2026-10-07 14:51 (question round: yes); code server/lib/schemas.ts; test cards.test.ts | Origin: user requirement

#### Scenario: Handover
- GIVEN Anna owns a card
- WHEN Anna hands it over to Sven
- THEN only Sven may change the card

#### Scenario: Unknown recipient
- GIVEN Anna owns a card
- WHEN it is handed over to a user ID that does not exist
- THEN the system rejects it

### Requirement: Cards without an owner are unchangeable
The system SHALL keep cards without an owner visible for everybody, but reject their change by any user with 403 `card_has_no_owner` until an owner is set in the database.
Source: User instruction 2026-10-07 14:47/14:51; README (7f3d955) §Users; test ownership.test.ts | Origin: user requirement

#### Scenario: Changing an ownerless card
- GIVEN a card without an owner
- WHEN any user wants to change it
- THEN the system rejects it with 403 `card_has_no_owner`

#### Scenario: Setting the owner
- GIVEN a card without an owner
- WHEN the operator sets the owner in the database
- THEN this user can change the card

### Requirement: A deleted user leaves the cards in place
The system SHALL keep the cards of a user who was removed in the database, without an owner.
Source: README (7f3d955) §Users; test ownership.test.ts; schema onDelete SetNull | Origin: derived

#### Scenario: User removed
- GIVEN Max owns cards
- WHEN Max is deleted in the database
- THEN his cards remain without an owner

### Requirement: Users come from the configuration
The system SHALL create at startup the users named in `USERS` that do not exist yet (case-insensitive), with the initial password `cardkeeper`.
Source: User instruction 2026-10-07 14:46/14:47; README (7f3d955) §Users; test users.test.ts | Origin: user requirement

#### Scenario: New user
- GIVEN `USERS=anna,max`, only `anna` exists
- WHEN the app starts
- THEN `max` is created and `anna` stays unchanged

#### Scenario: Different spelling
- GIVEN `Anna` exists
- WHEN `USERS=anna` is read
- THEN no second user is created

### Requirement: Removed names delete nothing
The system SHALL leave users who disappear from `USERS` unchanged, with their password and cards; an admin role and an admin interface SHALL NOT exist.
Source: README (7f3d955) §Users; User instruction 2026-10-07 14:46, 15:31; test users.test.ts | Origin: user requirement

#### Scenario: Name removed
- GIVEN `max` owns cards and is missing in `USERS`
- WHEN the app starts
- THEN the account, password and cards of `max` remain

### Requirement: The first login forces an own password
The system SHALL force a user without an own password to choose one after the login and until then allow only `/api/auth/me`, `/api/auth/password` and `/api/auth/logout` (otherwise 403 `password_change_required`).
Source: User instruction 2026-10-07 14:46, 14:51 (question round: forced); code server/middleware/auth.ts | Origin: user requirement

#### Scenario: First login
- GIVEN a user without an own password
- WHEN they sign in with `cardkeeper`
- THEN the interface leads to the page "Choose a new password" and other API calls return 403 `password_change_required`

### Requirement: Password rules
The system SHALL require a new password of 8 to 200 characters that is neither `cardkeeper` (case-insensitive) nor the current one, and allow the change only with the correct current password (otherwise 400 `current_password_wrong`).
Source: README (7f3d955) §Users; code shared/utils/users.ts; tests users.test.ts, password.test.ts | Origin: derived

#### Scenario: Too short
- GIVEN a user changes their password
- WHEN the new password is shorter than 8 characters
- THEN the system rejects it with a fitting error code

#### Scenario: Wrong current password
- GIVEN a signed-in user
- WHEN they set a new password with a wrong current one
- THEN the system rejects it with 400 `current_password_wrong`

### Requirement: Password reset by the operator
The system SHALL reset a password when the operator sets `password_hash` of the user to NULL in the database; afterwards `cardkeeper` applies again with a forced password choice, and all earlier sessions of the user SHALL end.
Source: User instruction 2026-10-07 14:46, 14:47 (SQL: hash to NULL); README (7f3d955) §Users; test users.test.ts | Origin: user requirement

#### Scenario: Reset
- GIVEN Anna's hash is set to NULL
- WHEN Anna signs in with `cardkeeper`
- THEN she has to choose a new password and her earlier session is invalid

### Requirement: Sign-in does not reveal names
The system SHALL give the same answer for an unknown name and a wrong password (401 `invalid_credentials`), look up the name regardless of case and surrounding spaces, and spend the same computing time for an unknown name.
Source: Code server/services/users.ts; test users.test.ts | Origin: derived

#### Scenario: Unknown name
- GIVEN no user "xyz"
- WHEN a login with "xyz" is tried
- THEN the answer is the same as for a wrong password

#### Scenario: Spelling
- GIVEN a user `Anna`
- WHEN they sign in with ` anna `
- THEN they are found

### Requirement: Lock after failed attempts
The system SHALL lock a user name after 10 failed sign-in or password checks within 15 minutes until the end of this window (429 `too_many_attempts`), also for the correct password, per user name and not per address.
Source: README (7f3d955) §Users (safeguards); code server/lib/login-throttle.ts; tests login-throttle.test.ts | Origin: derived

#### Scenario: Locked
- GIVEN 10 failed attempts for `anna` within 15 minutes
- WHEN `anna` signs in with the correct password
- THEN the system rejects it with 429

#### Scenario: Counter reset
- GIVEN fewer than 10 failed attempts
- WHEN the login succeeds
- THEN the counter of the name is reset

### Requirement: Session as a sealed cookie
The system SHALL keep the session as an encrypted and signed cookie `cardkeeper-session` (httpOnly, SameSite=Lax, 30 days, `secure` according to the protocol reported by the reverse proxy), without a session store on the server.
Source: README (7f3d955) §Users; code server/lib/session.ts | Origin: derived

#### Scenario: Cookie after login
- GIVEN a login over https behind a proxy with `X-Forwarded-Proto`
- WHEN the answer is sent
- THEN the cookie `cardkeeper-session` carries the flags httpOnly, SameSite=Lax and secure

### Requirement: A password change ends other sessions
The system SHALL let a session apply only to the password state in which it was created; after a change or reset the changing browser SHALL stay signed in and other browsers SHALL be signed out.
Source: README (7f3d955) §Users; code server/lib/password.ts, server/api/auth/password.put.ts; test users.test.ts | Origin: derived

#### Scenario: Change
- GIVEN Anna is signed in in two browsers
- WHEN she changes her password in the first browser
- THEN the first stays signed in and the second is signed out at the next call

### Requirement: A new session secret signs everybody out
The system SHALL treat all earlier sessions as invalid when `SESSION_SECRET` changes, without changing passwords or data.
Source: User instruction 2026-10-07 15:43; README §Configuration | Origin: derived

#### Scenario: Secret changed
- GIVEN `SESSION_SECRET` is changed
- WHEN the app restarts
- THEN everybody has to sign in again, and the passwords remain valid

### Requirement: Redirect after the login only to own paths
The system SHALL redirect after the login only to paths of the own app (not to `//host` or `http:`), to `/account` when a password change is forced, and lead a signed-in person from `/login` to `/`.
Source: Code app/app/pages/login.vue, app/app/middleware/auth.global.ts | Origin: derived

#### Scenario: Foreign target
- GIVEN `/login?next=//evil.example`
- WHEN the login succeeds
- THEN the system leads to `/`

#### Scenario: Expired session
- GIVEN a session has expired
- WHEN an API answer reports `unauthenticated`
- THEN the interface leads to the sign-in page

### Requirement: Switch from a version without logins
The system SHALL refuse to start without `SESSION_SECRET` or `USERS`, take over existing "players" as users with the initial password and their cards, and ignore a header `X-Remote-User`.
Source: README (7f3d955) §Users (upgrading); docker-compose.yml; User instruction 2026-10-07 14:47/14:51 | Origin: user requirement

#### Scenario: Configuration missing
- GIVEN `.env` without `SESSION_SECRET` or `USERS`
- WHEN the stack is started with Compose
- THEN the start aborts with a message

#### Scenario: Existing player
- GIVEN player "Anna" with cards before the migration
- WHEN the migration runs
- THEN "Anna" is a user without an own password with the same cards
