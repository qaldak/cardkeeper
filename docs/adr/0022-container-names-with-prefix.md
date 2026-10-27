# ADR 0022: Fixed container names with a configurable prefix

- **Status:** Accepted
- **Date:** 2026-10-06
- **Origin:** User requirement (fixed names, User instruction 2026-10-06 13:08); the prefix variable is a decision of the assistant (13:12), not objected to by the user.
- **Specs:** [`operations`](../../openspec/specs/operations/spec.md), [`development-release`](../../openspec/specs/development-release/spec.md)

## Context

The user wanted to give a container name in Docker Compose (e.g. `cardkeeper_app`, `cardkeeper_db`). Fixed names are unique per Docker host and would have prevented testing a branch next to the real installation (`-p cardkeeper-test`).

## Decision

The names are `${CONTAINER_PREFIX:-cardkeeper}_app` and `…_db`; the prefix can be changed through `CONTAINER_PREFIX`.

## Considered alternatives

- Automatic names of Compose (`cardkeeper-app-1`, starting point; replaced).
- Fixed names without a prefix (rejected by the assistant, because they block the branch test).

## Consequences

- A second stack (branch test) can run in parallel.
- Commands in the documentation name the containers (`docker logs cardkeeper_app`).

## Sources

- User instruction 2026-10-06 13:08, 13:12
- `README.md` §Configuration, §Trying out a branch
