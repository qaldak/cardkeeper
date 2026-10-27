# Entwicklung und Release Specification

## Purpose
Entwicklung und Veröffentlichung: lokale Entwicklung in Containern, Tests, CI, automatische Releases, Abhängigkeits-Updates, Lizenz und Arbeitsabsprachen des Benutzers. Entscheide: [ADR 0015](../../../docs/adr/0015-semantic-release-und-versionen.md), [ADR 0016](../../../docs/adr/0016-multi-arch-image-nativer-build.md), [ADR 0017](../../../docs/adr/0017-lizenz-polyform-noncommercial.md), [ADR 0018](../../../docs/adr/0018-main-branch-schutz.md), [ADR 0024](../../../docs/adr/0024-englisch-fuer-code-und-doku.md).

## Requirements

### Requirement: Entwicklung ohne Host-Installation
Das System MUSS die Entwicklung in Containern ermöglichen (Quellen als Bind-Mount, `node_modules` im Volume), gesteuert über `make dev`, `test`, `lint`, `typecheck`, `migration` und `shell`.
Quelle: Chat 2026-10-04 09:59 („keine lokale Installation auf dem Host“); README §Development | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Dev
- GIVEN nur Docker auf dem Host
- WHEN `make dev` läuft
- THEN startet die Entwicklungsumgebung

### Requirement: Branch neben der Installation testen
Das System MUSS erlauben, einen Branch neben der echten Installation unter einem anderen Projektnamen zu testen (eigene Container und Volumes, `CONTAINER_PREFIX`).
Quelle: Chat 2026-10-05 18:57; 2026-10-06 13:12 (Präfix); README §Trying out a branch | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Zweiter Stack
- GIVEN eine laufende Installation
- WHEN ein Branch mit `-p cardkeeper-test` gestartet wird
- THEN kollidieren Container- und Volumenamen nicht

### Requirement: Tests
Das System MUSS Unit-Tests für reine Logik und Integrationstests gegen eine echte PostgreSQL mit Fake-Karten-API führen; Integrationstests MÜSSEN `TEST_DATABASE_URL` verwenden und nie `DATABASE_URL`; ein Coverage-Skript (`npm run test:coverage`, v8, ohne Schwelle) SOLL vorhanden sein.
Quelle: README §Tests; Chat 2026-10-21 (Review, Coverage) | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Testdatenbank
- GIVEN `TEST_DATABASE_URL` zeigt auf `cardkeeper_test`
- WHEN Integrationstests laufen
- THEN bleibt die Entwicklungsdatenbank unberührt

### Requirement: Continuous Integration
Das System MUSS in der CI (`tests.yml`) Lint, Typecheck (auch für Tests), alle Tests mit PostgreSQL, den Docker-Build und die Compose-Validierung bei jedem Pull Request und als erste Stufe jedes Releases ausführen.
Quelle: README §Tests; Chat 2026-10-10 22:40 (TS7053 im CI) | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Typfehler
- GIVEN ein Typfehler in einem Test
- WHEN die CI läuft
- THEN schlägt der Typecheck fehl

### Requirement: Automatische Releases
Das System MUSS bei einem Push auf `main` mit semantic-release die Version aus Conventional Commits bestimmen, `CHANGELOG.md`, `app/package.json`, Tag und GitHub-Release erzeugen und das Image als `X.Y.Z`, `X.Y`, `X` und `latest` veröffentlichen.
Quelle: Chat 2026-10-04 10:00 (Fragerunde „Docker-Images“); README §Releases | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Feature
- GIVEN ein Commit `feat: …` auf `main`
- WHEN der Release-Workflow läuft
- THEN entsteht eine neue Minor-Version mit Tag

### Requirement: Nur Minor und Patch
Das System SOLL im Normalfall nur Minor- und Patch-Versionen erzeugen und eine Major-Version nur bei ausdrücklichem Breaking Change; die Zählung beginnt bei 0.1.0.
Quelle: Chat 2026-10-10 20:58 („feature oder breaking change?“); README §Releases | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Neue Einstellung
- GIVEN eine optionale neue Einstellung
- WHEN released wird
- THEN ist es ein Minor-Release

### Requirement: Squash-Merge bestimmt die Version
Das System MUSS bei Squash-Merge den Pull-Request-Titel (`feat: …`) als Commit-Nachricht für die Versionierung verwenden.
Quelle: Chat 2026-10-04 10:57–14:41; README §Releases | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Titel
- GIVEN ein PR mit Titel `fix: …`
- WHEN er gemerged wird
- THEN entsteht ein Patch-Release

### Requirement: Abhängigkeits-Updates
Das System MUSS Dependabot wöchentlich für npm, Dockerfile, Compose und Actions laufen lassen; Produktions-Updates MÜSSEN `chore:` (Patch-Release), die übrigen `build:` (kein Release) tragen, Prisma wird gruppiert, Major-Updates von Node, PostgreSQL und TypeScript werden ignoriert.
Quelle: README §Dependency updates; Code .github/dependabot.yml | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Dev-Update
- GIVEN ein Dev-Abhängigkeits-Update
- WHEN es gemerged wird
- THEN entsteht kein Release

### Requirement: Lizenz
Das System MUSS unter der PolyForm Noncommercial License 1.0.0 stehen (frühere Versionen unter AGPL v3), ohne Beitragshinweis oder CLA.
Quelle: Chat 2026-10-07 15:31, 15:51–15:53; README §License | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Lizenztext
- GIVEN das Repository
- WHEN die Lizenzdatei gelesen wird
- THEN ist es PolyForm Noncommercial 1.0.0

### Requirement: Code und Dokumentation auf Englisch
Das System MUSS Code-Kommentare und die README auf Englisch führen.
Quelle: Chat 2026-10-04 09:59 („ausschliesslich englisch… auch für das Readme“) | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Kommentar
- GIVEN neuer Code
- WHEN ein Kommentar geschrieben wird
- THEN ist er englisch

### Requirement: Arbeitsabsprachen
Die Entwicklung MUSS Rückfragen vor der Ausführung stellen und sprechende Branch-Namen verwenden; die Review-Punkte Soft-Delete, Aufteilen von `cards.ts` und Scans werden nicht umgesetzt.
Quelle: Chat 2026-10-04 09:59; 2026-10-06 08:00; 2026-10-21 14:37 | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Branch
- GIVEN eine neue Änderung
- WHEN ein Branch angelegt wird
- THEN hat er einen sprechenden Namen
