# ADR 0009: In-memory login lock per user name instead of per address

- **Status:** Accepted
- **Date:** Not documented (probably created with the login on 2026-10-07; assumption)
- **Origin:** Derived (code comment and README; not documented as a separate decision in the user instructions).
- **Specs:** [`users-access`](../../openspec/specs/users-access/spec.md)

## Context

The initial password `cardkeeper` is public; without a limit it could "simply be guessed for every other name". Behind the reverse proxy all requests come from the same address (code comment in `login-throttle.ts`).

## Decision

After 10 failed attempts within 15 minutes the user name is locked for the rest of the window (429). The counters are kept in memory only. The lock also applies to the password change; a wrong name and a wrong password give the same answer (`invalid_credentials`) and take the same computing time.

## Considered alternatives

- Lock per address: named in the code comment and rejected, because behind the proxy everybody comes from the same address.

## Consequences

- A restart resets the counters.

## Sources

- `app/server/lib/login-throttle.ts` (comment)
- `README.md` (7f3d955) §Users and passwords (safeguards)
- Tests `login-throttle.test.ts`, `users.test.ts`
