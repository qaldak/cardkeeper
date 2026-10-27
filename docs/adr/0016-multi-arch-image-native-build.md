# ADR 0016: Multi-arch image (amd64, arm64), build stages on the platform of the builder

- **Status:** Accepted
- **Date:** 2026-10-04
- **Origin:** User requirement (GHCR multi-arch); build layout: derived (fix by the assistant, accepted by the user).
- **Specs:** [`development-release`](../../openspec/specs/development-release/spec.md), [`operations`](../../openspec/specs/operations/spec.md)

## Context

The app runs on a Raspberry Pi (arm64), development happens on other architectures. The first image job hung because the build was emulated under QEMU for arm64 (User instruction 2026-10-04 14:09–14:41).

## Decision

The image is published for amd64 and arm64 to GHCR. Dependencies and build run on the platform of the builder (`$BUILDPLATFORM`), because the Nitro bundle is plain JavaScript; the runtime image contains only the Prisma CLI for the migrations.

## Considered alternatives

- "No, only a build check" (question round 2026-10-04, not chosen).
- Whole build under QEMU emulation: implemented, hung and was replaced.

## Consequences

- Fast releases without emulation.
- The runtime image is small.

## Sources

- User instruction 2026-10-04 10:00 (question round "Docker images"), 14:09–14:41 (fix PR of the assistant)
- `app/Dockerfile` (comments), `.github/workflows/release.yml`
