# Inventar der Anforderungs- und Entscheidungskandidaten

Format je Eintrag: ID – Kurzbeschreibung | Quelle(n) | Herkunft (`User-Vorgabe` / `Abgeleitet` / `Unklar`) | Zustand (`aktiv` / `später geändert` → Ersatz-ID / `verworfen`) | Konflikt?

- R-xxx = Anforderung, D-xxx = Entscheid.
- Quellen: `README` (Abschnitt), `Code` (Pfad), `Chat` (Thema, ungefährer Zeitpunkt; Zitate max. 15 Wörter), `Tests`, `Git` (Commit/PR).
- Chat-Auswertungsstand je Block steht unten im Abschnitt „Chat-Blöcke".

## Chat-Blöcke (Auswertungsstand)

| Block | Inhalt | Stand |
|---|---|---|
| A | README.md, docs/KONZEPT.md (Quellen a) | fertig, siehe Abschnitt „Block A" |
| B | Code, Tests, Konfiguration (Quelle b) | offen |
| C | Chat-Transkript (Quelle c) | offen |

Herkunft in Block A ist vorläufig `Abgeleitet` (README/Konzept); der Chat-Abgleich (Block C) hebt Einträge auf `User-Vorgabe`, wo der Chat die Forderung belegt.

## Block A – README und Konzept

Tabellenformat: ID | Kurzbeschreibung | Quelle | Herkunft | Zustand | Konflikt/Notiz

### Anforderungen (R) aus der README

| ID | Kurzbeschreibung | Quelle | Herkunft | Zustand | Notiz |
|---|---|---|---|---|---|
| R-001 | Eine Sammlung für Yu-Gi-Oh! und Pokémon; weitere Spiele über ein Adapter-Interface ohne Kernschema-/UI-Änderung | README §Intro, §Features, §Adding a game; KONZEPT §Multi-TCG | Abgeleitet | aktiv | |
| R-002 | Beim Erfassen wird das Spiel gewählt; die letzte Wahl wird pro Browser per Cookie gemerkt | README §Features | Abgeleitet | aktiv | |
| R-003 | Übersicht zeigt ein Spiel oder alle; beim ersten Besuch alle, danach die letzte Wahl des Browsers | README §Features | Abgeleitet | aktiv | |
| R-004 | Spielspezifische Filter (YGO: Kartentyp, Typ, Attribut, Seltenheit, Level-Bereich; Pokémon: Kategorie, Typ, Stufe, Seltenheit, Variante, KP-Bereich) und Sortierungen (Level für YGO, KP für Pokémon) | README §Features | Abgeleitet | aktiv | |
| R-005 | Hell/Dunkel: folgt dem Gerät (hell, wenn das Gerät nichts sagt); Umschalter hell/dunkel/System im Header, im Browser gemerkt | README §Features | Abgeleitet | aktiv | |
| R-006 | Übersicht mit Filtern für Status, Besitzer, Kartentyp, Monstertyp, Attribut, Seltenheit, Level-Bereich; Dropdowns aus der Sammlung gefüllt | README §Features | Abgeleitet | aktiv | |
| R-007 | Nach dem Login steht der Besitzerfilter auf dem angemeldeten Benutzer (Standard); „Alle Besitzer“ steht als `owner=all` in der URL | README §Features | Abgeleitet | aktiv | |
| R-008 | Filter, Sortierung und Seite bleiben beim Wechsel in eine Karte und zurück erhalten, bis zum nächsten Login/Logout | README §Features | Abgeleitet | aktiv | |
| R-009 | Aus der Übersicht geöffnete Karte lässt sich in der Reihenfolge der Übersicht durchblättern (zurück/weiter, Umlauf, Pfeiltasten); „Zur Übersicht“ führt auf die Seite der Karte | README §Features | Abgeleitet | aktiv | |
| R-010 | Suchfeld findet Namen in jeder Sprache, Set-Code und Set-Name | README §Features | Abgeleitet | aktiv | |
| R-011 | Sortierung nach zuletzt hinzugefügt, Name, Level, Kaufdatum, Preis (auf-/absteigend); Karten ohne Wert immer zuletzt | README §Features | Abgeleitet | aktiv | |
| R-012 | Gesamtwert der aktiven Karten in der Übersicht | README §Features | Abgeleitet | aktiv | |
| R-013 | CSV-Export der Auswahl der Übersicht (alle Treffer, Sortierung, beliebiger Besitzer/Status), alle Daten ohne Bilder in der Reihenfolge der Kartenseite, Sprache der Oberfläche (Englisch als Rückfall), letzter Preis (+ Anzeigewährung), Semikolon, UTF-8 mit BOM; `GET /api/export/cards` | README §Features | Abgeleitet | aktiv | |
| R-014 | Detailseite: Texte in Deutsch/Englisch (Pokémon auch Japanisch) mit Sprachumschalter, Deutsch zuerst, nicht vorhandene Sprache deaktiviert | README §Features | Abgeleitet | aktiv | |
| R-015 | Set-Code (immer Grossbuchstaben) und Edition sind korrigierbar und gelten für alle Sprachen; Namen, Texte und Attribute sind schreibgeschützt | README §Features, §Data model | Abgeleitet | aktiv | |
| R-016 | Manueller Bild-Upload; Bild vergrössern (Klick schliesst, Seitenbereiche und Pfeiltasten blättern, Download-Knopf, „Bild speichern unter“ schlägt Kartennamen vor) | README §Features | Abgeleitet | aktiv | |
| R-017 | Statusverwaltung (aktiv, verkauft, getauscht, verschenkt, verloren) mit Datum und Gegenpartei | README §Features; KONZEPT §Datenmodell | Abgeleitet | aktiv | |
| R-018 | Der Besitzer kann die Karte an einen anderen Benutzer übergeben | README §Features, §Users | Abgeleitet | aktiv | |
| R-019 | Preisverlauf auf der Detailseite | README §Features | Abgeleitet | aktiv | |
| R-020 | YGO „Ganzes Set“: Wizard (Set wählen, Sprache der Karten wählen, prüfen, hinzufügen); nur unklare Karten müssen gewählt werden; Edition einmal pro Set, pro Karte änderbar; drei Karten gleichzeitig (Rate-Limit); Fehler gelistet und wiederholbar; keine Mengenangabe | README §Features | Abgeleitet | aktiv | |
| R-021 | Pokémon „Ganzes Set“: gleicher Ablauf; unklar ist nur die Variante; eine Variante für das ganze Set wählbar; Varianten pro Karte per Einzelanfrage, einige Stunden zwischengespeichert | README §Features | Abgeleitet | aktiv | |
| R-022 | „Von API aktualisieren“ erneuert Texte, Attribute und Preise; Set-Code, Edition, Status, Besitzer, Kaufdatum, Bilder bleiben unberührt | README §Features | Abgeleitet | aktiv | |
| R-023 | „Karte hinzufügen“: Suche nach Name oder Passcode inkl. genauem Druck (Set, Seltenheit); keine Sprachwahl: erst Deutsch, Rückfall Englisch, beide Sprachen gespeichert | README §Features | Abgeleitet | aktiv | |
| R-024 | YGO: Suche nach Set-Code eines Drucks (`LOB-EN005`); Code anderer Sprache ohne Treffer wird mit englischem Code gesucht; Druck vorgewählt, wenn eindeutig; der getippte Code wird gespeichert | README §Features | Abgeleitet | aktiv | |
| R-025 | YGO Edition (1. Auflage, Limitierte Auflage) als Ein-Klick-Wahl neben dem Druck; nichts gewählt = Unlimited (nicht aufgedruckt); auf der Kartenseite ein Dropdown | README §Features, §Data model | Abgeleitet | aktiv | |
| R-026 | „ß“/„ss“-Äquivalenz in Suche (YGO/Pokémon-Namenssuche, Pokémon-Set-Filter, Suche in der Sammlung) | README §Features | Abgeleitet | aktiv | |
| R-027 | Kartenbilder werden einmal heruntergeladen und lokal auf einem Volume gespeichert, nie gehotlinkt | README §Features, §Notes on the card API | Abgeleitet | aktiv | |
| R-028 | Preise pro Marktplatz in dessen Währung gespeichert (Cardmarket EUR, TCGplayer/eBay/Amazon/CoolStuffInc USD); Liste nutzt `PRICE_SOURCE` | README §Features | Abgeleitet | aktiv | |
| R-029 | `DISPLAY_CURRENCY`: Übersicht (Karten, Total) in dieser Währung, Detailseite beides (`CHF 0.08 (EUR 0.09)`); EZB-Kurse von Frankfurter, bei erstem Bedarf, danach einmal täglich; ohne Kurs Originalpreis; Parameter optional | README §Features, §Configuration, §Data model | Abgeleitet | aktiv | |
| R-030 | Geplanter Preis-Reload in kleinen Tranchen; jeder Reload erzeugt eine Preiszeile (auch bei gleichem Preis); Detailseite zeigt „Preise zuletzt geprüft am“ | README §Features, §Scheduled price reload | Abgeleitet | aktiv | |
| R-031 | Preis-Reload-Regeln: fällig nach `PRICE_REFRESH_AFTER` (`h|d|w|mo`, `off`), nur aktive Karten, ≤ `PRICE_REFRESH_BATCH_SIZE` pro Tranche, älteste zuerst, ein Set zusammen, nächste Tranche frühestens `PRICE_REFRESH_BATCH_EVERY` (≥ 1 h) später, Pause `PRICE_REFRESH_DELAY_MS` (≥ 100), Tranche in DB aufgezeichnet | README §Scheduled price reload, §Configuration | Abgeleitet | aktiv | |
| R-032 | Verweigert eine Karten-DB weitere Anfragen, stoppt die Tranche, der Rest folgt in der nächsten; Fehlgeschlagene Karten nach `PRICE_REFRESH_BATCH_EVERY` erneut; dem Benutzer wird das Limit gemeldet | README §Scheduled price reload | Abgeleitet | aktiv | |
| R-033 | Änderungen von Benutzern kommen ins Audit-Log; die Kartenseite zeigt „geändert am“ erst, wenn ein Benutzer etwas geändert hat (ein Refresh zählt nicht) | README §Features | Abgeleitet | aktiv | |
| R-034 | Oberfläche in Deutsch und Englisch | README §Features | Abgeleitet | aktiv | |
| R-035 | Semantische Releases, Multi-Arch-Images (amd64+arm64), automatische Abhängigkeits-Updates | README §Features, §Releases, §Dependency updates | Abgeleitet | aktiv | |
| R-036 | Alles läuft in Containern; auf dem Host ist nur Docker nötig; Stack aus `db` (PostgreSQL 16, kein veröffentlichter Port) und `app`; zwei Volumes `db-data`, `card-images`; Migrationen werden bei jedem Start angewendet | README §Intro, §Quick start | Abgeleitet | aktiv | |
| R-037 | Konfiguration über Umgebungsvariablen in `.env` (Tabelle: `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `APP_DB_NAME/USER`, `APP_PORT`, `APP_BIND_ADDRESS`, `PRICE_SOURCE`, `DISPLAY_CURRENCY`, `MAX_UPLOAD_MB`, `SESSION_SECRET`, `USERS`, `PRICE_REFRESH_*`, `CONTAINER_PREFIX`, `APP_IMAGE`) | README §Configuration | Abgeleitet | aktiv | |
| R-038 | Die App-DB-Rolle (kein Superuser) wird beim ersten Initialisieren des Datenverzeichnisses angelegt; spätere Passwortänderung ändert eine bestehende DB nicht | README §Configuration; KONZEPT §Sicherheitskonzept | Abgeleitet | aktiv | |
| R-039 | Eigenes Login: alle sehen alle Karten, Ändern (Daten, Status, Bilder, Refresh, Löschen) nur durch den Besitzer; wer eine Karte anlegt, ist Besitzer | README §Users and passwords | Abgeleitet | aktiv | |
| R-040 | Benutzer über `USERS` angelegt (beim Start), Initialpasswort `cardkeeper`, erzwungene Passwortwahl beim ersten Login (≥ 8 Zeichen, nicht `cardkeeper`); keine Admin-Rolle; Entfernen aus `USERS` löscht nichts; scrypt-Hashes | README §Users and passwords | Abgeleitet | aktiv | |
| R-041 | Passwort-Reset durch den Betreiber per SQL (`password_hash = NULL`); alle Logins mit dem alten Passwort enden | README §Users and passwords | Abgeleitet | aktiv | |
| R-042 | Karten ohne Besitzer (aus der Zeit vor den Logins) sind für alle sichtbar, aber von niemandem änderbar, bis ein Besitzer gesetzt ist | README §Users and passwords | Abgeleitet | aktiv | |
| R-043 | Schutzmassnahmen: Name 15 Min. gesperrt nach 10 Fehlversuchen; Login 30 Tage; Passwortwechsel/-reset beendet andere Browser-Sitzungen; Cookie `SameSite=Lax`; schreibende Cross-Site-Anfragen abgelehnt; Sicherheits-Header | README §Users and passwords | Abgeleitet | aktiv | |
| R-044 | Upgrade von einer Version ohne Logins: `SESSION_SECRET` und `USERS` ergänzen, bisherige „Spieler“ werden Benutzer mit Initialpasswort und behalten ihre Karten | README §Users and passwords | Abgeleitet | aktiv | |
| R-045 | Reverse Proxy leitet nur weiter (TLS); `client_max_body_size` etwas über `MAX_UPLOAD_MB`; `X-Forwarded-Proto` für das Secure-Flag des Cookies | README §Reverse proxy | Abgeleitet | aktiv | |
| R-046 | Backup von Datenbank (`pg_dump`) und Bild-Volume dokumentiert | README §Backup; KONZEPT §Sicherheitskonzept | Abgeleitet | aktiv | |
| R-047 | Entwicklung ohne Host-Installation (Quellen als Bind-Mount, `node_modules` im Volume); `make dev/test/lint/typecheck/migration/shell` | README §Development | Abgeleitet | aktiv | |
| R-048 | Ein Branch kann neben der echten Installation unter anderem Projektnamen getestet werden (eigene Container/Volumes, `CONTAINER_PREFIX`) | README §Trying out a branch | Abgeleitet | aktiv | |
| R-049 | Tests: Unit-Tests (reine Logik), Integrationstests (echte PostgreSQL, Fake-Karten-API, `TEST_DATABASE_URL`, nie `DATABASE_URL`), Coverage-Skript | README §Tests | Abgeleitet | aktiv | |
| R-050 | CI `tests.yml`: Lint, Typecheck, alle Tests (mit PostgreSQL), Docker-Build, Compose-Validierung bei jedem PR und als erste Stufe jedes Releases | README §Tests | Abgeleitet | aktiv | |
| R-051 | Releases vollautomatisch bei Push auf `main` (semantic-release): Version aus Conventional Commits, `CHANGELOG.md`, `app/package.json`, Tag, GitHub-Release, Image als `X.Y.Z`, `X.Y`, `X`, `latest`; nur Minor/Patch im Normalfall, Major nur bei ausdrücklichem Breaking Change; Start bei `0.1.0` | README §Releases | Abgeleitet | aktiv | |
| R-052 | Dependabot wöchentlich (npm, Dockerfile, Compose, Actions); Produktions-Updates `chore:` (Patch-Release), Dev/Docker/Compose/Actions `build:` (kein Release); Prisma gruppiert; Major von Node, PostgreSQL, TypeScript ignoriert | README §Dependency updates | Abgeleitet | aktiv | |
| R-053 | Pokémon-Datenmodell (`PokemonAttributes` sprachunabhängig aus der englischen Antwort, `PokemonDetails` sprachabhängig), Druck = Karten-ID, Edition = Variante (`normal`, `reverse`, `holo`, `firstEdition`, `wPromo`), Variante wählbar unter den vorhandenen, Karten-ID nicht änderbar | README §Pokémon | Abgeleitet | aktiv | |
| R-054 | Pokémon-Preise: `cardmarket` (EUR), `cardmarket-holo`, `tcgplayer-<variante>` (USD); Liste/Total nutzen `PRICE_SOURCE` für beide Spiele | README §Pokémon | Abgeleitet | aktiv | Roadmap: variantenabhängiger Listenpreis fehlt |
| R-055 | Pokémon-Suche nach Name (Deutsch zuerst, dann Englisch) oder Karten-ID; Bilder der Trefferliste von `assets.tcgdex.net` | README §Pokémon | Abgeleitet | aktiv | |
| R-056 | Pokémon „Nach Set und Nummer“: Sprache der Datenbank (Deutsch Standard), Nummer wie gedruckt, Set per Name/Logo; Teil nach dem Schrägstrich = gedruckte Setgrösse; Schrägstrich optional (`040088` → `040/088`); Nummer ohne führende Nullen verglichen; Set-Liste/-Karten über `GET /api/sets`, `GET /api/sets/<id>` für sechs Stunden gecacht | README §Pokémon | Abgeleitet | aktiv | |
| R-057 | Japanische Karten: eigene TCGdex-Datenbank und IDs, dritte gespeicherte Sprache, nur über Set und Nummer oder ID auffindbar; Kategorien/Typen/Stufen auf englische Schreibweise abgebildet | README §Pokémon | Abgeleitet | aktiv | |
| R-058 | YGO-Vorschaubild in der Suche über eigene Kopie (`/api/thumbnails/ygo/<passcode>`, höchstens 4 gleichzeitig); Pokémon-Bilder direkt von TCGdex | README §Notes on the card API | Abgeleitet | aktiv | |
| R-059 | Karten-API-Verhalten: eine Anfrage pro Abfrage; Bilder nur von den vom Adapter deklarierten Hosts; unerwartete YGO-Feldwerte werden ausgelassen und einmal geloggt (nur Karte ohne ID/Name wird abgelehnt); API-Fehler (HTTP 400) nur bei „No card matching“ = leer, sonst 502; unübersetzte Karte (englische Kopie auf Deutsch-Anfrage) wird erkannt und nicht als Übersetzung gespeichert | README §Notes on the card API | Abgeleitet | aktiv | |
| R-060 | Roadmap: Export als KI-Prompt-Kopie und druckbare Liste (PDF/Word); Pokémon: variantenabhängiger Listenpreis, Blättern in den Suchergebnissen, mehr Filter | README §Roadmap | Abgeleitet | aktiv | Zukunft, nicht implementiert |
| R-061 | Lizenz PolyForm Noncommercial 1.0.0 (frühere Versionen AGPL v3) | README §License | Abgeleitet | aktiv | |

### Anforderungen (R) aus dem Konzept (docs/KONZEPT.md)

| ID | Kurzbeschreibung | Quelle | Herkunft | Zustand | Notiz |
|---|---|---|---|---|---|
| R-062 | Hosting: selbstgehostet auf Raspberry Pi, intern/VPN, DB lokal (Variante 1) | KONZEPT §Hosting-Varianten | Abgeleitet | aktiv | siehe D-001 |
| R-063 | Ressourcenbudget Pi 4: Nitro `node-server`, kein Cluster, `--max-old-space-size=256`, Postgres `shared_buffers` ~128 MB | KONZEPT §Deployment | Abgeleitet | später geändert (teilweise) | prüfen in Block B |
| R-064 | Statuswerte `aktiv`, `verkauft`, `getauscht`, `verschenkt`, `verloren`; Datum/Person nur bei verkauft/getauscht/verschenkt, bei verloren nur Datum | KONZEPT §Datenmodell | Abgeleitet | aktiv | Konflikt prüfen mit Code: README sagt „date and counterpart“ |
| R-065 | Mehrere Bilder pro Karte, lokales Volume, kein DB-Blob | KONZEPT §Datenmodell | Abgeleitet | aktiv | |
| R-066 | Konzept: Scheduler als eigener Node-Worker-Container (node-cron) | KONZEPT §Tech-Stack, §Deployment | Abgeleitet | prüfen | Konflikt: README beschreibt Nitro-Plugin/DB-Aufzeichnung (Block B prüfen) |
| R-067 | Konzept: Export PDF (pdfkit), CSV, Markdown | KONZEPT §Tech-Stack, §Komponenten | Abgeleitet | später geändert | siehe R-013/R-060 |
| R-068 | Konzept: regelmässiges `pg_dump`-Backup per Cron, zweiter Ort | KONZEPT §Sicherheitskonzept | Abgeleitet | prüfen | README dokumentiert nur Befehle |

### Entscheide (D) aus README und Konzept

| ID | Kurzbeschreibung | Quelle | Herkunft | Zustand | Notiz |
|---|---|---|---|---|---|
| D-001 | Hosting Variante 1 (Pi, intern/VPN, DB lokal) statt Supabase/extern | KONZEPT §Hosting-Varianten | Abgeleitet | aktiv | |
| D-002 | Nuxt (TypeScript, Vue, Nitro) als eine Codebasis für UI und API | KONZEPT §Tech-Stack | Abgeleitet | aktiv (Nuxt 4 statt 3) | Konflikt: Konzept „Nuxt 3“, README „Nuxt 4“ |
| D-003 | Tailwind CSS + Nuxt UI | KONZEPT §Tech-Stack | Abgeleitet | aktiv | |
| D-004 | Prisma als ORM | KONZEPT §Tech-Stack | Abgeleitet | aktiv | |
| D-005 | PostgreSQL 16 (JSONB, arm64) | KONZEPT §Tech-Stack | Abgeleitet | aktiv | |
| D-006 | Adapter-Pattern pro Kartenspiel mit Registry | KONZEPT §Multi-TCG; README §Adding a game | Abgeleitet | aktiv | |
| D-007 | Spielspezifische Attribute als JSONB in `cards.game_specific_attributes` | KONZEPT §Datenmodell; README §Data model | Abgeleitet | aktiv | |
| D-008 | Eigenes Login mit Session-Cookie ersetzt die frühere Idee eines `/admin`-Pfads mit nginx-Basic-Auth | KONZEPT §Sicherheitskonzept | Abgeleitet | später geändert | Konzept §Offene Punkte nennt „Login: vorerst weglassen“ als offen → Konflikt innerhalb des Konzepts |
| D-009 | PDF-Export mit pdfkit (kein Headless-Chromium) | KONZEPT §Tech-Stack | Abgeleitet | unklar (nicht umgesetzt) | |
| D-010 | Bestehenden nginx weiterverwenden (kein neuer Proxy-Container) | KONZEPT §Tech-Stack | Abgeleitet | aktiv | |
| D-011 | Status als sprachneutrales Enum, in der UI übersetzt | README §Data model | Abgeleitet | aktiv | |
| D-012 | Sprachabhängige Texte in `card_translations` (Zeile je Karte+Sprache), `cards.name` = Anzeigename | README §Data model | Abgeleitet | aktiv | |
| D-013 | Namen/Texte/Attribute schreibgeschützt; `manual_overrides` entfernt; `card_sets` Set-Code+Edition als einzige editierbare Kartendaten | README §Data model | Abgeleitet | aktiv | |
| D-014 | Editionen als Schlüssel (`FIRST_EDITION`, `LIMITED_EDITION`), Unlimited = NULL | README §Data model | Abgeleitet | aktiv | |
| D-015 | Preise in Quellwährung gespeichert, Umrechnung beim Lesen | README §Data model | Abgeleitet | aktiv | |
| D-016 | Nuxt-4-Standardlayout (`app/app/`) | README §Data model | Abgeleitet | aktiv | |
| D-017 | Spielverhalten pro Druck in `shared/utils/game-config.ts` konfiguriert | README §Pokémon | Abgeleitet | aktiv | |
| D-018 | Releases: nur Minor/Patch, Major nur bei ausdrücklichem Breaking Change; Start bei 0.1.0 | README §Releases | Abgeleitet | aktiv | |
| D-019 | Major-Updates von Node/PostgreSQL/TypeScript bewusst ignoriert | README §Dependency updates | Abgeleitet | aktiv | |
| D-020 | Lizenzwechsel von AGPL v3 auf PolyForm Noncommercial 1.0.0 | README §License | Abgeleitet | aktiv | |


## Block B – Code

_noch nicht begonnen_

## Block C – Chat

_noch nicht begonnen_
