# Development and Release Specification

## Purpose
Development and publishing: local development in containers, tests, CI, automatic releases, dependency updates, license and working agreements of the user. Decisions: [ADR 0015](../../../docs/adr/0015-semantic-release-and-versions.md), [ADR 0016](../../../docs/adr/0016-multi-arch-image-native-build.md), [ADR 0017](../../../docs/adr/0017-license-polyform-noncommercial.md), [ADR 0018](../../../docs/adr/0018-main-branch-protection.md), [ADR 0024](../../../docs/adr/0024-english-for-code-and-docs.md).

## Requirements

### Requirement: Development without a host installation
The system SHALL allow development in containers (sources as a bind mount, `node_modules` in a volume), controlled through `make dev`, `test`, `lint`, `typecheck`, `migration` and `shell`.
Source: User instruction 2026-10-04 09:59 ("no local installation on the host"); README §Development | Origin: user requirement

#### Scenario: Dev
- GIVEN only Docker on the host
- WHEN `make dev` runs
- THEN the development environment starts

### Requirement: Testing a branch next to the installation
The system SHALL allow testing a branch next to the real installation under another project name (own containers and volumes, `CONTAINER_PREFIX`).
Source: User instruction 2026-10-05 18:57; 2026-10-06 13:12 (prefix); docs/development.md | Origin: user requirement

#### Scenario: Second stack
- GIVEN a running installation
- WHEN a branch is started with `-p cardkeeper-test`
- THEN container and volume names do not collide

### Requirement: Tests
The system SHALL run unit tests for pure logic and integration tests against a real PostgreSQL with a fake card API; integration tests SHALL use `TEST_DATABASE_URL` and never `DATABASE_URL`; a coverage script (`npm run test:coverage`, v8, without a threshold) SHALL be present.
Source: README (7f3d955) §Tests; User instruction 2026-10-21 (review, coverage) | Origin: derived

#### Scenario: Test database
- GIVEN `TEST_DATABASE_URL` points to `cardkeeper_test`
- WHEN integration tests run
- THEN the development database is untouched

### Requirement: Continuous integration
The system SHALL run in the CI (`tests.yml`) lint, type check (also for tests), all tests with PostgreSQL, the Docker build and the Compose validation on every pull request and as the first stage of every release.
Source: README (7f3d955) §Tests; User instruction 2026-10-10 22:40 (TS7053 in the CI) | Origin: derived

#### Scenario: Type error
- GIVEN a type error in a test
- WHEN the CI runs
- THEN the type check fails

### Requirement: Automatic releases
The system SHALL determine on a push to `main` with semantic-release the version from Conventional Commits, create `CHANGELOG.md`, `app/package.json`, tag and GitHub release, and publish the image as `X.Y.Z`, `X.Y`, `X` and `latest`.
Source: User instruction 2026-10-04 10:00 (question round "Docker images"); README §Releases | Origin: user requirement

#### Scenario: Feature
- GIVEN a commit `feat: …` on `main`
- WHEN the release workflow runs
- THEN a new minor version with a tag is created

### Requirement: Only minor and patch
The system SHALL by default produce only minor and patch versions and a major version only for an explicit breaking change; the count starts at 0.1.0.
Source: User instruction 2026-10-10 20:58 ("feature or breaking change?"); README §Releases | Origin: user requirement

#### Scenario: New setting
- GIVEN an optional new setting
- WHEN it is released
- THEN it is a minor release

### Requirement: Squash merge determines the version
The system SHALL use on a squash merge the pull request title (`feat: …`) as the commit message for the versioning.
Source: User instruction 2026-10-04 10:57–14:41; README §Releases | Origin: derived

#### Scenario: Title
- GIVEN a PR with the title `fix: …`
- WHEN it is merged
- THEN a patch release is created

### Requirement: Dependency updates
The system SHALL run Dependabot weekly for npm, Dockerfile, Compose and Actions; production updates SHALL carry `chore:` (patch release), the others `build:` (no release), Prisma is grouped, major updates of Node, PostgreSQL and TypeScript are ignored.
Source: README §Releases; code .github/dependabot.yml | Origin: derived

#### Scenario: Dev update
- GIVEN a dev dependency update
- WHEN it is merged
- THEN no release is created

### Requirement: License
The system SHALL be under the PolyForm Noncommercial License 1.0.0 (earlier versions under AGPL v3), without a contribution notice or CLA.
Source: User instruction 2026-10-07 15:31, 15:51–15:53; README §License | Origin: user requirement

#### Scenario: License text
- GIVEN the repository
- WHEN the license file is read
- THEN it is PolyForm Noncommercial 1.0.0

### Requirement: Code and documentation in English
The system SHALL keep code comments, the README, the specifications, the decision records and the architecture overview in English; the historical initial concept `docs/KONZEPT.md` stays in German.
Source: User instruction 2026-10-04 09:59 ("exclusively English… also for the README"); User instruction 2026-10-27 (specifications and decision records also in English) | Origin: user requirement

#### Scenario: Comment
- GIVEN new code
- WHEN a comment is written
- THEN it is in English

### Requirement: Working agreements
The development SHALL ask questions before executing and use meaningful branch names; the review points soft delete, splitting `cards.ts` and scans are not implemented.
Source: User instruction 2026-10-04 09:59; 2026-10-06 08:00; 2026-10-21 14:37 | Origin: user requirement

#### Scenario: Branch
- GIVEN a new change
- WHEN a branch is created
- THEN it has a meaningful name
