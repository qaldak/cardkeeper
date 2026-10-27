# ADR 0008: Own login with a sealed session cookie, users from the configuration

- **Status:** Accepted
- **Date:** 2026-10-07
- **Origin:** User requirement (requirements and question rounds of 2026-10-07 14:46–14:51); technical implementation (h3 session, scrypt): derived, not objected to by the user.
- **Specs:** [`users-access`](../../openspec/specs/users-access/spec.md), [`security`](../../openspec/specs/security/spec.md)

## Context

The concept provided no login; the open points said "Login mechanism: leave out for now … or a simple shared-secret login? Decision pending", a `/admin` path with nginx basic auth and a header `X-Remote-User` were considered. On 2026-10-07 14:46 the user demanded: users may only create, change or delete their own cards and see all cards; initial password `cardkeeper`, changeable by the user; reset by a database script by the app operator.

## Decision

The app has its own login. Users are listed in `USERS` of the `.env` and created at startup; `players` and `users` are one table; initial password with a forced change at the first login; reset by SQL (`password_hash = NULL`); there is no admin role. The session is a sealed (encrypted and signed) cookie (h3), passwords are scrypt hashes. nginx basic auth and `X-Remote-User` are dropped.

## Considered alternatives

- `nuxt-auth-utils` and an `is_admin` column (proposal of the user, User instruction 2026-10-07 14:46); the assistant chose the built-in h3 session and `scrypt` without an admin role instead (15:18), the user did not object and later removed the "Admin area" item from the roadmap (15:31).
- Question round "create users": list in the `.env` (chosen), admin user with an interface, script only.
- Question round "password reset": SQL, hash to NULL (chosen), script in the container.
- Question round "players/users": merge (chosen) or keep separate.
- Question round "nginx auth": remove (chosen) or keep as a fallback.
- Concept: no login, shared-secret login, `/admin` with basic auth (not implemented).

## Consequences

- All signed-in users see all cards, only the owner may change them; cards without an owner can be changed by nobody.
- No server-side session store; a password change ends other logins through the password state.
- Changing `SESSION_SECRET` signs everybody out.
- Removing a name from `USERS` deletes nothing.

## Sources

- User instruction 2026-10-07 14:46, question rounds 14:47 and 14:51, 15:18, 15:31
- `docs/KONZEPT.md` §Sicherheitskonzept, §Offene Punkte
- `README.md` §Users and passwords
- `app/server/lib/session.ts`, `app/server/lib/password.ts`
