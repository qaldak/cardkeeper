# ADR 0016: Multi-Arch-Image (amd64, arm64), Build-Stufen auf der Plattform des Builders

- **Status:** Akzeptiert
- **Datum:** 2026-10-04
- **Herkunft:** User-Vorgabe (GHCR multi-arch); Build-Aufbau: Abgeleitet (Fehlerbehebung des Assistenten, vom Benutzer akzeptiert).
- **Inventar:** D-033, R-035
- **Specs:** [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [`betrieb`](../../openspec/specs/betrieb/spec.md)

## Kontext

Die App läuft auf einem Raspberry Pi (arm64), entwickelt wird auf anderen Architekturen. Der erste Image-Job hing, weil der Build unter QEMU für arm64 emuliert lief (Chat 2026-10-04 14:09–14:41).

## Entscheid

Das Image wird für amd64 und arm64 nach GHCR veröffentlicht. Abhängigkeiten und Build laufen auf der Plattform des Builders (`$BUILDPLATFORM`), da das Nitro-Bündel reines JavaScript ist; das Laufzeit-Image enthält nur die Prisma-CLI für die Migrationen.

## Betrachtete Alternativen

- „Nein, nur Build-Check“ (Fragerunde 2026-10-04, nicht gewählt).
- Gesamter Build unter QEMU-Emulation: umgesetzt, hing und wurde ersetzt.

## Konsequenzen

- Schnelle Releases ohne Emulation.
- Das Laufzeit-Image ist klein.

## Quellen

- Chat 2026-10-04 10:00 (Fragerunde „Docker-Images“), 14:09–14:41 (Fix-PR des Assistenten)
- `app/Dockerfile` (Kommentare), `.github/workflows/release.yml`
