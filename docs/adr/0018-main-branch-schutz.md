# ADR 0018: Schutz des Branches `main` mit Ausnahme für den Release-Workflow

- **Status:** Akzeptiert; Einzelheiten der Einstellung nur in der Chat-Anleitung belegt (Q-003)
- **Datum:** 2026-10-06
- **Herkunft:** Abgeleitet (Empfehlung des Assistenten auf Frage des Benutzers; vom Benutzer in GitHub umgesetzt).
- **Inventar:** D-037
- **Specs:** [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md)

## Kontext

Am 2026-10-06 14:49 fragte der Benutzer nach dem Schutz des Branches `main`. Der Release-Workflow muss aber einen Release-Commit auf `main` pushen können.

## Entscheid

Ruleset „Protect main“: Löschen und Force-Push gesperrt, Änderungen nur per Pull Request (0 Freigaben), drei Statusprüfungen verlangt, Administratoren dürfen für den Release-Push umgehen; der Workflow nutzt das Secret `RELEASE_TOKEN` (Personal Access Token mit `contents: write`), sonst den Standard-`GITHUB_TOKEN`. Die Einstellung liegt in GitHub, nicht im Repository.

## Betrachtete Alternativen

nicht dokumentiert.

## Konsequenzen

- Änderungen laufen über Pull Requests mit der CI (Spec `entwicklung-release`).
- Die tatsächlichen Einstellungen in GitHub sind aus dem Repository nicht prüfbar (Q-003).
- Der erste Release mit Branch-Schutz lief erfolgreich (Chat 2026-10-07 10:51).

## Quellen

- Chat 2026-10-06 14:49–14:50; 2026-10-07 10:51
- `README.md` §Releases (One-time repository setup)
- `.github/workflows/release.yml`
