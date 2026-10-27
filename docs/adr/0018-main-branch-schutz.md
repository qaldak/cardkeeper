# ADR 0018: Schutz des Branches `main` mit Ausnahme für den Release-Workflow

- **Status:** Akzeptiert (Einstellung wie in der Chat-Anleitung bestätigt)
- **Datum:** 2026-10-06
- **Herkunft:** Abgeleitet (Empfehlung des Assistenten auf Frage des Benutzers); der Benutzer bestätigte am 2026-10-23, dass der Schutz wie in der Anleitung eingerichtet ist.
- **Specs:** [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md)

## Kontext

Am 2026-10-06 14:49 fragte der Benutzer nach dem Schutz des Branches `main`. Der Release-Workflow muss aber einen Release-Commit auf `main` pushen können.

## Entscheid

Ruleset „Protect main“: Löschen und Force-Push gesperrt, Änderungen nur per Pull Request (0 Freigaben), drei Statusprüfungen verlangt, Administratoren dürfen für den Release-Push umgehen; der Workflow nutzt das Secret `RELEASE_TOKEN` (Personal Access Token mit `contents: write`), sonst den Standard-`GITHUB_TOKEN`. Die Einstellung liegt in GitHub, nicht im Repository.

## Betrachtete Alternativen

nicht dokumentiert.

## Konsequenzen

- Änderungen laufen über Pull Requests mit der CI (Spec `entwicklung-release`).
- Die Einstellungen liegen in GitHub und sind aus dem Repository nicht prüfbar; der Benutzer hat sie am 2026-10-23 bestätigt.
- Der erste Release mit Branch-Schutz lief erfolgreich (Chat 2026-10-07 10:51).

## Quellen

- Chat 2026-10-06 14:49–14:50; 2026-10-07 10:51
- `README.md` §Releases (One-time repository setup)
- `.github/workflows/release.yml`
