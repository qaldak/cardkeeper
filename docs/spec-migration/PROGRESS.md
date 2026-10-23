# Fortschritt: OpenSpec-Baseline für CardKeeper

Ziel: den Projektstand als Spec-Driven-Development-Baseline mit OpenSpec dokumentieren (WAS wurde gefordert, WARUM, WOHER stammt die Information).
Branch: `docs/openspec-baseline` (lokal, nicht gepusht). Basis: `origin/main` @ `611cfa9` (Release 0.23.3, inkl. CSV-Export).

## Phasen

| Phase | Inhalt | Status | Datum | Notizen |
|---|---|---|---|---|
| 0 | Vorprüfung, OpenSpec-Setup, Branch, Arbeitsverzeichnis | in Arbeit | 2026-10-23 | Node v22.22.0, npm 10.9.4, OpenSpec 1.14.3 (verlangt Node >=20.19.0). `openspec init --tools claude` lief nicht-interaktiv. |
| 1 | Quellen sichten, Inventar | offen | | |
| 2 | Domains festlegen | offen | | |
| 3 | Specs schreiben | offen | | |
| 4 | ADRs | offen | | |
| 5 | Projektkontext (`openspec/config.yaml`) | offen | | |
| 6 | Prüfung, `COVERAGE.md`, Zahlen | offen | | |

## So nimmst du die Arbeit nach einem Unterbruch wieder auf

1. Branch prüfen: `git branch --show-current` muss `docs/openspec-baseline` sein (`git log --oneline` zeigt die Phasen-Commits).
2. Diese Datei lesen: die erste Phase, die nicht „fertig" ist, ist der Einstieg.
3. `00-inventory.md` lesen (letzter Eintrag je Quellenblock zeigt, bis wohin der Chat bereits ausgewertet ist) und `OPEN-QUESTIONS.md`.
4. Offene Änderungen mit `git status` ansehen; angefangene Dateien weiterschreiben, nicht neu beginnen.
5. Nach jeder Phase: diese Tabelle aktualisieren und lokal committen. Nichts pushen.
6. Bei „mach bei den offenen Fragen weiter": `OPEN-QUESTIONS.md` lesen, Antworten in Spec/ADR einarbeiten (siehe Auftrag, Abschnitt „Nach Phase 6").

## Notizen zum Setup

- `openspec init` hat ausser `openspec/` auch `.claude/skills/openspec-*` und `.claude/commands/opsx/*` angelegt (OpenSpec-Werkzeugdateien, kein Anwendungscode). Sie liegen im eigenen Commit „docs: openspec init (claude)" und lassen sich bei Bedarf einzeln zurücknehmen.
- Telemetrie von OpenSpec wurde in der lokalen Konfiguration abgeschaltet (`openspec config set telemetry.enabled false`).
- Für die `/opsx:*`-Befehle muss Claude Code nach dem Setup neu gestartet werden. Für diese Migration werden sie nicht benötigt, die Dateien werden direkt geschrieben.
