# Fortschritt: OpenSpec-Baseline für CardKeeper

Ziel: den Projektstand als Spec-Driven-Development-Baseline mit OpenSpec dokumentieren (WAS wurde gefordert, WARUM, WOHER stammt die Information).
Branch: `docs/openspec-baseline` (lokal, nicht gepusht). Basis: `origin/main` @ `611cfa9` (Release 0.23.3, inkl. CSV-Export).

## Phasen

| Phase | Inhalt | Status | Datum | Notizen |
|---|---|---|---|---|
| 0 | Vorprüfung, OpenSpec-Setup, Branch, Arbeitsverzeichnis | fertig | 2026-10-23 | Node v22.22.0, npm 10.9.4, OpenSpec 1.14.3 (verlangt Node >=20.19.0). `openspec init --tools claude` lief nicht-interaktiv. |
| 1 | Quellen sichten, Inventar | fertig | 2026-10-23 | README + Konzept (Block A), Code/Tests/Konfiguration (Block B), Chat-Transkript vollständig vorhanden und in 5 Blöcken ausgewertet (C1–C5). Details: `00-inventory.md`, `history.md` (21 Einträge), `OPEN-QUESTIONS.md` (10 offene Fragen). |
| 2 | Domains festlegen | fertig | 2026-10-23 | 17 Domains, Zuordnung der R-IDs und Zweifelsfälle in `02-domains.md`. Kein eigener Roadmap-Bereich (Roadmap-Punkte stehen als „Geplante Funktionen“ bzw. in `OPEN-QUESTIONS.md`). Aufteilung nach fachlichem Thema statt nach Code-Schicht, damit eine Anforderung genau einer Spec gehört und Specs unabhängig änderbar sind. |
| 3 | Specs schreiben | fertig | 2026-10-23 | 17 Specs in `openspec/specs/<domain>/spec.md`, alle bestehen `openspec validate --specs --strict`. Jede Anforderung trägt eine Zeile `Quelle: … \| Herkunft: … \| Inventar: … \| MUSS=SHALL`. Abweichungen vom vorgegebenen Format, durch den Validator erzwungen: (1) Abschnitt `## Purpose` (≥ 50 Zeichen) ergänzt; (2) der Validator verlangt das englische Wort SHALL/MUST, daher steht `MUSS=SHALL` am Ende der Quelle-Zeile; (3) Anforderungstext inkl. Quelle-Zeile ≤ 500 Zeichen, längere Anforderungen wurden gekürzt oder aufgeteilt. |
| 4 | ADRs | fertig | 2026-10-23 | 24 ADRs in `docs/adr/` (0001–0024), je mit Status, Datum, Herkunft, Kontext, Entscheid, Alternativen („nicht dokumentiert“, wo die Quellen keine nennen), Konsequenzen, Quellen. Specs verlinken die ADRs im Abschnitt Purpose. Neue Inventar-IDs D-042…D-046 am Ende von `00-inventory.md`. Entscheide aus dem Konzept (ADR 0001–0006, 0019, 0023) tragen die Herkunft „Abgeleitet“; ob der Benutzer sie als eigene Vorgabe versteht, ist Q-007. |
| 5 | Projektkontext (`openspec/config.yaml`) | fertig | 2026-10-23 | `context:` mit Stack, Prinzipien, Konventionen und Verweisen auf `docs/adr/` und `docs/spec-migration/`; dazu `rules.specs` für das Anforderungsformat. Jede Zeile ist durch README, ADR oder Spec belegt. |
| 6 | Prüfung, `COVERAGE.md`, Zahlen | fertig | 2026-10-23 | `openspec validate --specs --strict`: 17 von 17 Specs bestanden. `COVERAGE.md` (README-Features, Verzeichnisse, 171 Inventareinträge). Zahlen unten. Danach: offene Fragen in Runden klären. |

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


## Zahlen nach Phase 6 (2026-10-23)

| Grösse | Wert |
|---|---|
| Specs (Domains) | 17, alle mit `openspec validate --specs --strict` gültig |
| Requirements gesamt | 188 (260 Szenarien) |
| davon Herkunft `User-Vorgabe` | 103 |
| davon Herkunft `Abgeleitet` | 85 |
| davon Herkunft `Unklar` | 0 |
| Requirements mit offener Frage (`[OFFEN Q-…]`) | 7 |
| ADRs | 24 (`docs/adr/0001`–`0024`) |
| Inventareinträge mit R-/D-Nummer | 171; abgedeckt 166, mit Begründung nicht oder teilweise abgedeckt 5 (siehe `COVERAGE.md`) |
| Konflikte (Konzept/README/Code/Chat) | K-001…K-021 in `00-inventory.md`, nicht selbst aufgelöst |
| Offene Fragen | 10 (Q-001…Q-010), alle `OFFEN`; Arbeitsannahmen stehen in den Specs |

Requirements je Spec (Requirements/Szenarien): benutzer-zugriff 19/29, betrieb 13/13, bilder 10/15, datenhaltung 10/11, entwicklung-release 11/11, export 10/15, karte-detail 15/23, karten-blaettern 6/11, kartenerfassung 19/35, kartenstatus 6/8, oberflaeche 11/12, preise 11/14, set-import 11/13, sicherheit 4/7, spiele-adapter 11/12, uebersicht 14/23, waehrungsumrechnung 7/8.

Hinweis zur Herkunft: Die Specs führen `Abgeleitet`, wenn der Chat die Forderung nicht ausdrücklich belegt (z. B. reine README- oder Code-Fakten, Entscheide des Assistenten ohne Beanstandung). Entscheide aus dem Konzept des Benutzers sind `Abgeleitet`, bis Q-007 beantwortet ist.
