# ADR 0018: Protection of the branch `main` with an exception for the release workflow

- **Status:** Accepted (setting confirmed as in the instructions of the chat)
- **Date:** 2026-10-06
- **Origin:** Derived (recommendation of the assistant on a question of the user); the user confirmed on 2026-10-23 that the protection is set up as in the instructions.
- **Specs:** [`development-release`](../../openspec/specs/development-release/spec.md)

## Context

On 2026-10-06 14:49 the user asked about protecting the branch `main`. The release workflow, however, must be able to push a release commit to `main`.

## Decision

Ruleset "Protect main": deletion and force push blocked, changes only through pull requests (0 approvals), three status checks required, administrators may bypass for the release push; the workflow uses the secret `RELEASE_TOKEN` (personal access token with `contents: write`), otherwise the default `GITHUB_TOKEN`. The setting lives in GitHub, not in the repository.

## Considered alternatives

Not documented.

## Consequences

- Changes go through pull requests with the CI (spec `development-release`).
- The settings live in GitHub and cannot be checked from the repository; the user confirmed them on 2026-10-23.
- The first release with branch protection ran successfully (User instruction 2026-10-07 10:51).

## Sources

- User instruction 2026-10-06 14:49–14:50; 2026-10-07 10:51
- `README.md` §Releases (one-time repository setup)
- `.github/workflows/release.yml`
