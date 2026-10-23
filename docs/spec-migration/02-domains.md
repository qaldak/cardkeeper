# Phase 2 – Domain-Schnitt und Zuordnung

Schnitt: eine Domain pro Bereich, über den ein Team spricht (Benutzer, Karten erfassen, Übersicht, Export, …). Querschnittsthemen mit überprüfbarem Verhalten (Sicherheit, Betrieb, Datenhaltung, Entwicklung/Release) haben eigene Domains. Reine Begründungen und Technologiewahl stehen in `docs/adr/`. Der Schnitt war nicht mehrdeutig genug für eine Rückfrage; Zweifelsfälle sind unten vermerkt.

| Domain (Ordner in `openspec/specs/`) | Inhalt | Inventar (R-xxx) |
|---|---|---|
| `benutzer-zugriff` | Login, Benutzer, Passwort, Sitzung, Besitzer-Rechte, Sperre bei Fehlversuchen, UI-Zugangsschutz | R-018, R-039–R-044, R-070–R-075, R-209 |
| `sicherheit` | Antwort-Header, Cross-Site-Schutz, erlaubte Hosts für Downloads | R-043 (Teil), R-083, R-106 |
| `kartenerfassung` | Suche beim Erfassen (Name, ID, Set-Code, Set+Nummer), ß/ss, Vorschaubilder, Druck- und Editionswahl, Anlegen | R-002, R-023–R-026, R-055–R-056, R-058, R-076, R-099, R-100 |
| `set-import` | Wizard „Ganzes Set“ für Yu-Gi-Oh! und Pokémon | R-020, R-021, R-098, R-215 |
| `karte-detail` | Detailseite: Sprachen, editierbare Felder, Aktualisieren, Löschen, Hinweis „geändert am“, Beschreibungsfeld | R-014, R-015, R-022, R-033 (Anzeige), R-077, R-079, R-080, R-091, R-207 |
| `kartenstatus` | Statuswerte, Datum/Person, Verlauf | R-017, R-064, R-078 |
| `bilder` | Speicherung, Upload, Hauptbild, Vergrösserung, Auslieferung | R-016, R-027, R-065, R-081, R-082 |
| `uebersicht` | Liste, Filter, Suche, Sortierung, Summen, Standardzustand und gemerkter Zustand | R-003, R-004, R-006–R-008, R-010–R-012, R-084–R-087, R-089 |
| `karten-blaettern` | Zurück/weiter auf der Detailseite in der Reihenfolge der Übersicht | R-009, R-088, R-090 |
| `export` | CSV-Export, Menü, geplante Funktionen | R-013, R-060 (Teil), R-092, R-093 |
| `preise` | Preisquellen, Preisverlauf, Listenpreis, geplanter Reload, Limit-Meldungen | R-019, R-028, R-030–R-032, R-054, R-094, R-216 |
| `waehrungsumrechnung` | Anzeigewährung und Wechselkurse | R-029, R-096, R-097 |
| `spiele-adapter` | Spielregistrierung, Adapter-Vertrag, Daten und Sprachen von Yu-Gi-Oh! und Pokémon, Verhalten bei API-Fehlern | R-001, R-053, R-057, R-059, R-109, R-213 |
| `datenhaltung` | Datenmodell-Invarianten, Audit-Log, Snapshots, Editions-Migration und -Startprüfung | R-033 (Audit), R-104 |
| `oberflaeche` | Hell/Dunkel, Sprache, Titel, Kopfzeile, Fehlerseite, Zahlen-/Datumsformate, Symbole | R-005, R-034, R-105, R-107, R-211, R-212, R-214 |
| `betrieb` | Container-Stack, Konfiguration, Prüfung der Konfiguration, Start, Health, Backup, Reverse Proxy | R-035 (Image), R-036–R-038, R-044, R-045, R-046, R-062, R-063, R-095, R-101–R-103 |
| `entwicklung-release` | Tests, CI, Releases, Dependabot, Branch-Test, Lizenz, Arbeitsabsprachen | R-047–R-052, R-061, R-201–R-206, R-210, R-217–R-219 |

Zweifelsfälle:
- R-018 (Karte übergeben) liegt in `benutzer-zugriff`, weil die Regel dort gilt; die Bedienung steht in `karte-detail`.
- R-043 ist geteilt: Sperre/Sitzung in `benutzer-zugriff`, Header/Cross-Site in `sicherheit`.
- R-099 (Set-API) liegt in `kartenerfassung`, wird aber vom Wizard mitgenutzt.
- Reine Konzept-Einträge (R-062–R-068, D-001–D-010) sind teils überholt; sie stehen in ADRs bzw. `history.md`. R-060 (Roadmap) ist im Export-Spec nur als geplanter Platzhalter geführt; die Pokémon-Roadmap-Punkte bleiben in der README (Q-006).
- Keine eigene Domain für die Roadmap: ein Spec beschreibt Verhalten, das gilt.
