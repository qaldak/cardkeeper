# ADR 0015: Automatische Releases mit semantic-release; nur Minor und Patch

- **Status:** Akzeptiert
- **Datum:** 2026-10-04
- **Herkunft:** Abgeleitet (README §Releases; der Benutzer verwies auf eigene Repositories als Vorlage für Workflows, Chat 2026-10-04 09:59). Die Regel „Major nur bei Breaking Change“ stützt sich auf die Rückfrage vom 2026-10-10 20:58.
- **Specs:** [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md)

## Kontext

Der Benutzer wollte Releases und Docker-Images (Fragerunde „Docker-Images“: „Ja, GHCR multi-arch“) und verwies auf eigene Repositories (docker-volume-backup, unbound-publisher) als Referenz. Am 2026-10-10 20:58 fragte er bei einer neuen Funktion, ob das „ein Feature oder ein breaking change?“ sei.

## Entscheid

Bei jedem Push auf `main` bestimmt semantic-release die Version aus Conventional Commits, erzeugt `CHANGELOG.md`, Tag und GitHub-Release und veröffentlicht das Image. Im Normalfall nur Minor/Patch, Major nur bei ausdrücklichem Breaking Change, Start bei 0.1.0. Bei Squash-Merge zählt der Pull-Request-Titel.

## Betrachtete Alternativen

nicht dokumentiert.

## Konsequenzen

- Der Commit-Typ im PR-Titel bestimmt die Version (`feat:` = Minor, `fix:` = Patch).
- Dependabot-Updates sind `chore:` (Patch) oder `build:` (kein Release).

## Quellen

- Chat 2026-10-04 09:59, 10:00, 10:57–14:41; 2026-10-05 17:18; 2026-10-10 20:58
- `README.md` §Releases, §Dependency updates
- `.github/workflows/release.yml`, `.github/dependabot.yml`
