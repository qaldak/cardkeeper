# ADR 0015: Automatic releases with semantic-release; only minor and patch

- **Status:** Accepted
- **Date:** 2026-10-04
- **Origin:** Derived (README §Releases; the user pointed to own repositories as a template for workflows, User instruction 2026-10-04 09:59). The rule "major only for a breaking change" rests on the question of 2026-10-10 20:58.
- **Specs:** [`development-release`](../../openspec/specs/development-release/spec.md)

## Context

The user wanted releases and Docker images (question round "Docker images": "Yes, GHCR multi-arch") and pointed to own repositories (docker-volume-backup, unbound-publisher) as a reference. On 2026-10-10 20:58 he asked about a new function whether it was "a feature or a breaking change?".

## Decision

On every push to `main` semantic-release determines the version from Conventional Commits, creates `CHANGELOG.md`, tag and GitHub release and publishes the image. Normally only minor/patch, major only for an explicit breaking change, start at 0.1.0. With a squash merge the pull request title counts.

## Considered alternatives

Not documented.

## Consequences

- The commit type in the PR title determines the version (`feat:` = minor, `fix:` = patch).
- Dependabot updates are `chore:` (patch) or `build:` (no release).

## Sources

- User instruction 2026-10-04 09:59, 10:00, 10:57–14:41; 2026-10-05 17:18; 2026-10-10 20:58
- `README.md` §Releases, §Dependency updates
- `.github/workflows/release.yml`, `.github/dependabot.yml`
