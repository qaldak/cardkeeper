# Working rules for Claude Code

Cardkeeper: self-hosted collection for Yu-Gi-Oh! and Pokémon cards. Overview and commands: `README.md`. Architecture: `docs/ARCHITECTURE.md`.

## Where things are

- `openspec/specs/<domain>/spec.md`: requirements, last valid state (SHALL, GIVEN/WHEN/THEN). Every requirement names its source and its origin (`user requirement` or `derived`).
- `docs/adr/`: architecture decision records (status, date, origin, context, decision, considered alternatives, consequences, sources).
- `docs/KONZEPT.md`: historical initial concept (German), no longer valid.

## Keep spec and code in step

- If a task changes a behaviour that a spec describes, adjust the affected spec in the same pull request (requirement and scenario, source line with the date of the instruction, origin `user requirement`). Then run `openspec validate --specs --strict`.
- Purely visual changes, text corrections and fixes without a change of behaviour need no spec entry.
- An architecture decision (new component, new dependency, changed flow) gets a new ADR with the next number and a link from the spec.
- Do not invent anything: every new statement in a spec or ADR needs a source (instruction of the user, code, README). Mark assumptions as assumptions and ask the user.

## Larger new requirements

For a real new function (e.g. a further export format) use the OpenSpec flow: `/opsx:propose <name>` → go through the draft with the user → `/opsx:apply` → `/opsx:archive`. For everything small, change directly and adjust the spec (see above).

## Conventions

- Code comments, README, specs, ADRs and docs in English (except the historical `docs/KONZEPT.md`).
- Conventional Commits; the pull request title determines the version on a squash merge (`feat:` minor, `fix:` patch). Major only for an explicit breaking change.
- Meaningful branch names. Ask before changing code.
- Interface texts in `app/i18n/locales/de.json` and `en.json`.
- Tests: unit tests for pure logic, integration tests with `TEST_DATABASE_URL` (never `DATABASE_URL`); `make test`, `make lint`, `make typecheck`.
