# Inventar der Anforderungs- und Entscheidungskandidaten

Format je Eintrag: ID – Kurzbeschreibung | Quelle(n) | Herkunft (`User-Vorgabe` / `Abgeleitet` / `Unklar`) | Zustand (`aktiv` / `später geändert` → Ersatz-ID / `verworfen`) | Konflikt?

- R-xxx = Anforderung, D-xxx = Entscheid.
- Quellen: `README` (Abschnitt), `Code` (Pfad), `Chat` (Thema, ungefährer Zeitpunkt; Zitate max. 15 Wörter), `Tests`, `Git` (Commit/PR).
- Chat-Auswertungsstand je Block steht unten im Abschnitt „Chat-Blöcke".

## Chat-Blöcke (Auswertungsstand)

| Block | Inhalt | Stand |
|---|---|---|
| A | README.md, docs/KONZEPT.md (Quellen a) | fertig, siehe Abschnitt „Block A" |
| B | Code, Tests, Konfiguration (Quelle b) | fertig, siehe Abschnitt „Block B“ |
| C1 | Chat 2026-10-04 bis 2026-10-05 19:57 (Turns 0–141) | fertig |
| C2 | Chat 2026-10-05 20:00 bis 2026-10-07 17:11 (Turns 142–245) | fertig |
| C3 | Chat 2026-10-07 17:18 bis 2026-10-08 19:13 (Turns 246–312) | fertig |
| C4 | Chat 2026-10-09 18:28 bis 2026-10-10 20:33 (Turns 313–343) | fertig |
| C5 | Chat ab Turn 344 (2026-10-10 20:39) | offen |

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


## Block B – Code, Tests, Konfiguration

Gelesen: `app/prisma/schema.prisma` und Migrationen, `docker-compose*.yml`, `app/Dockerfile`, `app/docker-entrypoint.sh`, `db/init/`, `.github/workflows/`, `.releaserc.json`, `server/api/**`, `server/services/**`, `server/lib/**`, `server/middleware`, `server/plugins`, `server/tcg/**` (Schnittstelle und Adapter-Köpfe), `shared/**`, `app/app/**` (Seiten, Komponenten, Composables, Middleware, Layouts), `app/nuxt.config.ts`, `app/package.json`, Testtitel in `app/tests/**`.

### Verifikation der Block-A-Einträge gegen den Code

Alle R-001…R-061 haben im Code eine Entsprechung (Module siehe Spalte „Quelle“ unten bzw. Tests mit sprechenden Titeln, z. B. `tests/integration/cards.test.ts`, `ownership.test.ts`, `users.test.ts`, `price-refresh.test.ts`, `export.test.ts`, `pokemon.test.ts`). Abweichungen und Lücken stehen im Abschnitt „Konflikte“.

### Zusätzliche, nur im Code belegte Anforderungen (Herkunft: Abgeleitet)

| ID | Kurzbeschreibung | Quelle | Herkunft | Zustand | Notiz |
|---|---|---|---|---|---|
| R-070 | Login: Name wird ohne Beachtung von Gross-/Kleinschreibung und Leerzeichen gefunden; falscher Name und falsches Passwort liefern dieselbe Antwort (`invalid_credentials`, 401) und gleiche Rechenzeit (Dummy-Hash); Sperre pro Name (10 Fehlversuche/15 Min.) gilt auch beim Passwortwechsel | Code `server/services/users.ts`, `server/lib/login-throttle.ts`; Tests `users.test.ts`, `login-throttle.test.ts` | Abgeleitet | aktiv | |
| R-071 | Sitzung: versiegeltes (verschlüsselt+signiert) Cookie `cardkeeper-session`, httpOnly, SameSite=Lax, `secure` nach dem vom Proxy gemeldeten Protokoll, 30 Tage, kein Server-Sitzungsspeicher; gültig nur für den Passwortzustand (`passwordStamp`) des Logins | Code `server/lib/session.ts`, `server/lib/password.ts` | Abgeleitet | aktiv | |
| R-072 | API-Zugriff: alles unter `/api/` braucht ein Login (401 `unauthenticated`) ausser `/api/health`, `/api/auth/login`, `/api/_nuxt_icon/`; bei Pflicht-Passwortwechsel nur `/api/auth/me`, `/api/auth/password`, `/api/auth/logout` (sonst 403 `password_change_required`) | Code `server/middleware/auth.ts` | Abgeleitet | aktiv | |
| R-073 | Passwortregeln: 8–200 Zeichen, nicht (Gross-/Kleinschreibung egal) das Initialpasswort, nicht gleich dem aktuellen; Benutzername aus Buchstaben, Ziffern, Leerzeichen und `. _ @ + -` (1–100 Zeichen); scrypt N=16384, r=8, p=1, 64 Byte, selbstbeschreibender Hash | Code `shared/utils/users.ts`, `server/lib/password.ts`, `server/services/users.ts` | Abgeleitet | aktiv | |
| R-074 | UI-Zugangsschutz: ohne Login Weiterleitung auf `/login` (mit `next`, ausser bei `/`); bei Pflicht-Passwortwechsel nur `/account`; eingeloggt wird `/login` zu `/`; nach dem Login nur Pfade der App als Ziel (kein `//host`, kein `http:`); abgelaufene Sitzung führt beim nächsten API-Fehler zum Login | Code `app/app/middleware/auth.global.ts`, `app/app/pages/login.vue`, `app/app/composables/useApiError.ts` | Abgeleitet | aktiv | |
| R-075 | Besitzerregel: nur der Besitzer ändert/löscht/aktualisiert/bearbeitet Bilder (403 `not_card_owner`); Karten ohne Besitzer sind für niemanden änderbar (403 `card_has_no_owner`); Übergabe nur an einen bestehenden Benutzer, der Besitzer kann nicht geleert werden | Code `server/lib/actor.ts`, `server/lib/schemas.ts`, `server/services/cards.ts`, `images.ts`; Test `ownership.test.ts` | Abgeleitet | aktiv | |
| R-076 | Karte anlegen: Besitzer = Anlegender; Pflicht-Druck bei Pokémon (`printing_required`); gewählter Druck muss zur Karte gehören (`invalid_set`); gedruckter Set-Code muss zum Druck gehören (`invalid_set_code`); Karte nicht bei der Karten-DB (404 `upstream_card_not_found`); alles in einer DB-Transaktion (Karte, Übersetzungen, Druck, Preise, Snapshots, Statusverlauf `ACTIVE`, Audit „created“); Bild-Download-Fehler verhindert das Anlegen nicht | Code `server/services/cards.ts` (`create`); Tests `cards.test.ts` | Abgeleitet | aktiv | |
| R-077 | Karte ändern: nur Set-Code (nur wo `setCodeEditable`, sonst 400 `field_not_editable`), Edition/Variante (Pokémon: nur Varianten, die die Karte hat, sonst `invalid_variant`), Besitzer, Kaufdatum, Status, Statusdatum, Statusperson; jede Änderung als Audit-Zeile mit altem/neuem Wert; keine Audit-Zeile und kein „geändert am“ bei unveränderten Werten; auf einer Karte ohne Druck legt die erste Änderung den Druck an (Set-Code nötig) | Code `server/services/cards.ts` (`update`), `server/lib/schemas.ts`; Tests `cards.test.ts` | Abgeleitet | aktiv | |
| R-078 | Statusregeln: Statuswechsel hängt eine Verlaufszeile an; Korrektur von Datum/Person des aktuellen Status ändert die letzte Zeile; Datum standardmässig heute; Person nur bei verkauft/getauscht/verschenkt, sonst verworfen; verloren hat ein Datum, aber keine Person | Code `server/lib/status.ts`, `shared/utils/status.ts` | Abgeleitet | aktiv | Konzept nennt für „verloren“ nur „Person leer“ |
| R-079 | Karte löschen: nur Besitzer; entfernt Übersetzungen, Verläufe, Bilddateien und Bild-Verzeichnis; Audit „deleted“ mit Kartennamen | Code `server/services/cards.ts` (`remove`); Test `cards.test.ts` | Abgeleitet | aktiv | |
| R-080 | „Von API aktualisieren“: alle gespeicherten Sprachen neu geholt, Übersetzungen per Upsert, eine nicht mehr gelieferte Sprache bleibt, `cards.name` neu aus der bevorzugten Sprache, Preiszeilen und Snapshots angehängt, Audit „refreshed“ (zählt nicht als Benutzeränderung); Bild nur nachgeladen, wenn die Karte kein API-Bild hat; Karte ohne externe ID: 400 `no_external_id` | Code `server/services/cards.ts` (`refresh`); Tests `cards.test.ts` | Abgeleitet | aktiv | |
| R-081 | Bilder: Upload leer → 400 `empty_file`, grösser als `MAX_UPLOAD_MB` → 413 `file_too_large`, Typ an der Dateisignatur erkannt (nur PNG, JPEG, WebP; sonst `unsupported_image`); erstes Bild primär, späteres manuelles lässt ein API-Bild primär; Hauptbild wechselbar; Löschen befördert das älteste verbleibende zum Hauptbild; Bildänderungen zählen als Benutzeränderung | Code `server/services/images.ts`, `server/lib/image-files.ts`; Tests `images.test.ts` | Abgeleitet | aktiv | |
| R-082 | Bild-Auslieferung: ETag, `Cache-Control: private, no-cache`, `X-Content-Type-Options: nosniff`, `Content-Disposition: inline` mit dem Kartennamen als Dateiname; Pfad darf das Bildverzeichnis nicht verlassen | Code `server/api/images/[id]/index.get.ts`, `server/lib/image-files.ts` | Abgeleitet | aktiv | |
| R-083 | Bild-Download aus Karten-DBs: nur HTTPS, nur vom Adapter deklarierte Hosts, begrenzte Grösse | Code `server/lib/image-download.ts`, `server/lib/image-url.ts`; Test `image-download.test.ts` | Abgeleitet | aktiv | |
| R-084 | Listen-API: Seite (Standard 1), Seitengrösse (Standard 48, höchstens 200), Sortierung (Standard `created`), Zusammenfassung über alle Treffer (Anzahl, Anzahl aktiv, Total je Währung nur aktive Karten mit letztem Preis der `PRICE_SOURCE`) | Code `server/lib/schemas.ts` (`listQuerySchema`), `server/services/cards.ts` (`list`); Tests `cards.test.ts` | Abgeleitet | aktiv | |
| R-085 | Sortierregeln: deutsche Sortierung (Gross-/Kleinschreibung egal, „ä“ bei „a“, Zahlen nach Wert); Karten ohne Wert immer zuletzt; Gleichstand nach Name, dann ID (bei `created` nach ID) | Code `server/lib/card-sort.ts`; Tests `card-sort.test.ts` | Abgeleitet | aktiv | |
| R-086 | Filtersemantik: Spiel, Status, Besitzer (ID oder `none`), Freitext (Name in jeder Sprache, Stamm-Name, ID genau, Set-Code, Set-Name; ß/ss-Varianten), Kartentyp, Typ, Attribut, Seltenheit, Level-/KP-Bereich, Pokémon-Kategorie/-Typ/-Stufe/-Variante | Code `server/lib/card-filters.ts`; Tests `card-filters.test.ts` | Abgeleitet | aktiv | |
| R-087 | Facetten-Endpunkt: unterschiedliche Werte der Sammlung (YGO: Kartentyp, Monstertyp, Attribut; Pokémon: Kategorie, Typ, Stufe, Variante; Seltenheiten), optional pro Spiel | Code `server/api/facets.get.ts`, `server/services/cards.ts` (`facets`); Test `cards.test.ts` | Abgeleitet | aktiv | |
| R-088 | Nachbarn-Endpunkt `GET /api/cards/:id/neighbors`: gleiche Filter/Sortierung wie die Liste; Vorgänger/Nachfolger mit Umlauf (bei nur einer Karte keine); `position: null`, wenn die Karte nicht (mehr) in der Auswahl ist; liefert die Übersichtsseite der Karte | Code `server/api/cards/[id]/neighbors.get.ts`, `server/services/cards.ts`; Tests `cards.test.ts` | Abgeleitet | aktiv | |
| R-089 | Übersichts-URL-Zustand: ohne `owner` gilt der angemeldete Benutzer, `owner=all` alle, `owner=none` ohne Besitzer; ohne Parameter beim Aufruf von `/` wird die gemerkte Auswahl (Session-Cookie `cardkeeper-overview-query`, bei Login/Logout gelöscht) wiederhergestellt; Karten-Links tragen Filter/Sortierung und `nav=1` | Code `shared/utils/overview-query.ts`, `app/app/middleware/overview-query.global.ts`, `app/app/composables/useAuth.ts`, `app/app/pages/index.vue`; Tests `overview-query.test.ts` | Abgeleitet | aktiv | |
| R-090 | Detailseite beim Blättern: bei ungeänderten Daten direkt; bei ungespeicherten Änderungen Rückfrage (Speichern/Verwerfen/Abbrechen); Pfeiltasten blättern nur ohne Zoom, ohne Fokus in Feld/Liste/Dialog, ohne Zusatztaste und nur mit `nav=1`; bei offenem Bildzoom gehen sie durch die Bilder | Code `app/app/pages/cards/[id].vue` | Abgeleitet | aktiv | |
| R-091 | Beschreibungsfeld der Detailseite wächst mit dem Text von 3 bis höchstens 6 Zeilen, dann scrollt es | Code `app/app/pages/cards/[id].vue` (`autoresize`, `rows`, `maxrows`) | Abgeleitet | aktiv | |
| R-092 | CSV-Export im Detail: Spaltenreihenfolge (Spiel, Name, Set-Code, Edition/Variante, Set, Seltenheit, Externe ID, Herkunft, YGO-Attribute, Pokémon-Attribute, Texte, Beschreibung, Status, Statusdatum, Statusperson, Besitzer, Kaufdatum, Zeitstempel, Preis); Kopfzeile, Statuswerte, Editionen und Pokémon-Typen in der Sprache der Oberfläche (de/en), Englisch wenn die Sprache fehlt; Dateiname `cardkeeper-export-YYYY-MM-DD.csv`; Anführungszeichen-Regeln; Schutz gegen Formeln (`= + - @`); Preis nur der letzte der Preisquelle, Spalte „Preis in <Anzeigewährung>“ nur bei gesetzter `DISPLAY_CURRENCY`; Zeitstempel UTC `YYYY-MM-DD HH:MM` | Code `server/services/export.ts`, `server/lib/csv.ts`, `server/api/export/cards.get.ts`; Tests `export.test.ts`, `csv.test.ts` | Abgeleitet | aktiv | |
| R-093 | Export-Dialog in der Übersicht: Menü „Exportieren“ mit „CSV-Export“ (aktiv) und zwei deaktivierten Platzhaltern („Für KI kopieren (folgt)“, „Liste drucken (folgt)“); Dialog zeigt die Auswahl (Spiel, Besitzer, Status, Sortierung, Suche, weitere Filter, Textsprache, Anzahl); Hinweise hinter einem Info-Symbol als Klick-Popover; Knöpfe rechts: „Herunterladen“ vor „Abbrechen“; bei 0 Karten Download nicht möglich; Download als normaler Link, nicht als Router-Link | Code `app/app/pages/index.vue`, `app/app/components/ExportDialog.vue`, `app/i18n/locales/*.json` | Abgeleitet | aktiv | |
| R-094 | Preis-Reload-Umsetzung: Plugin prüft 60 s nach dem Start und danach alle 10 Minuten, ob eine Tranche fällig ist; Entscheidung aus den DB-Aufzeichnungen (`price_refresh_runs`: running/done/rate_limited/failed/interrupted); 3 fehlgeschlagene Anfragen in Folge = `failed`; YGO: 20 Karten pro Anfrage, TCGdex: eine pro Anfrage; `prices_checked_at` wird per Roh-SQL gesetzt, damit „geändert am“ unberührt bleibt | Code `server/plugins/price-refresh.ts`, `server/services/prices.ts`, `server/tcg/*/adapter.ts`; Tests `price-refresh.test.ts` | Abgeleitet | aktiv | |
| R-095 | Konfigurationsprüfung beim Start: `SESSION_SECRET` ≥ 32 Zeichen (sonst Abbruch), `USERS` mit gültigen Namen, `DISPLAY_CURRENCY` = 3 Buchstaben, positive Zahlen für Limits, `PRICE_REFRESH_DELAY_MS` ≥ 100, `PRICE_REFRESH_BATCH_EVERY` ≥ 1 h, Dauerformat `h|d|w|mo` | Code `server/lib/config.ts`, `server/lib/duration.ts`; Tests `config.test.ts` | Abgeleitet | aktiv | |
| R-096 | Wechselkurs-Dienst: ein Kurs je Währungspaar, beim ersten Bedarf, danach einmal je UTC-Tag, nur im Speicher (für alle Benutzer gemeinsam); gleichzeitige Anfragen teilen sich eine; nach einem Fehler 10 Minuten keine neue Anfrage; Zeitlimit 5 s; bei Ausfall Kurs eines früheren Tages, sonst keine Umrechnung; Basis-URL `EXCHANGE_RATE_API_URL` (Standard `https://api.frankfurter.dev/v1`) | Code `server/services/rates.ts`; Tests `rates.test.ts` | Abgeleitet | aktiv | |
| R-097 | Umrechnung in Listen/Details: Karten-Preis als `converted` (nur wo ein Kurs bekannt und die Währung abweicht); Totale je Originalwährung umgerechnet und in der Anzeigewährung zusammengefasst, Währungen ohne Kurs bleiben eigene Summanden; Preisverlauf mit dem heutigen Kurs | Code `server/services/cards.ts`, `server/services/mappers.ts`, `server/services/rates.ts`; Tests `cards.test.ts`, `pokemon.test.ts` | Abgeleitet | aktiv | |
| R-098 | Set-Import-Regeln (Wizard): Zeile bereit, wenn der Druck klar ist (nur ein Druck, oder die gewählte Variante kommt genau einmal vor); Konflikt = mehrere Drucke ohne klare Wahl; sichtbar standardmässig nur Konflikte; Hinzufügen erst, wenn nichts offen ist; Anfragen-Body je Spiel (Pokémon: Karten-ID + Variante; YGO: Set-Code, Seltenheit, Edition, gedruckter Code in der Sprache des Sets) | Code `shared/utils/set-import.ts`, `app/app/components/SetImportWizard.vue`; Tests `set-import.test.ts` | Abgeleitet | aktiv | |
| R-099 | Set-Browser-API: `GET /api/sets`, `GET /api/sets/:id`, `GET /api/sets/:id/import`; Antworten sechs Stunden zwischengespeichert; Logo-URLs nur von erlaubten Hosts; Spiel ohne Set-Browser: 400 `sets_not_supported`; unbekanntes Set: 404 `set_not_found` | Code `server/services/catalog.ts`, `server/api/sets/**`; Test `catalog.test.ts` | Abgeleitet | aktiv | |
| R-100 | Vorschaubilder für YGO: eigener Download einmal pro Karte (nur numerische Passcodes), höchstens 4 gleichzeitig, bei Fehler 60 s keine neue Anfrage, ausgeliefert unter `/api/thumbnails/<spiel>/<id>`; nur für Spiele, die es nutzen | Code `server/services/thumbnails.ts`, `server/api/thumbnails/**`; Test `thumbnails.test.ts` | Abgeleitet | aktiv | |
| R-101 | Start des Containers: Banner im Log (Version aus dem Build, „Release image“ bzw. „Local build“, Node-Version, Architektur, Startzeit UTC), danach Migrationen (`SKIP_MIGRATIONS=1` überspringt), dann Start des Servers | Code `app/docker-entrypoint.sh`, `app/Dockerfile` (`BUILD_KIND`), `.github/workflows/release.yml` | Abgeleitet | aktiv | nicht in der README |
| R-102 | Health-Endpunkt `GET /api/health` (nur mit erreichbarer Datenbank 200) und Docker-`HEALTHCHECK` | Code `server/api/health.get.ts`, `app/Dockerfile` | Abgeleitet | aktiv | |
| R-103 | Container-Härtung und Ressourcen: App als Benutzer `node`, `no-new-privileges`, alle Capabilities entfernt, Datenbank ohne veröffentlichten Port, `NODE_OPTIONS=--max-old-space-size=256`, PostgreSQL `shared_buffers=128MB`, `max_connections=30` | Code `docker-compose.yml`, `app/Dockerfile` | Abgeleitet | aktiv | |
| R-104 | Beim Start wird gemeldet, welche Editionswerte keiner bekannten Taste entsprechen (`[editions] …` mit SQL-Vorschlag) | Code `server/plugins/editions.ts`; README §Data model | Abgeleitet | aktiv | |
| R-105 | Oberfläche: Standardsprache Deutsch, Sprachwahl in der Kopfzeile, Cookie `cardkeeper_locale`, keine Sprachpräfixe in der URL; Zahlen/Daten nach `de-CH` bzw. `en-GB`; Seitentitel `Cardkeeper - <Seite>`; Fusszeile „Cardkeeper v<Version>“; Fehlerseite mit Zurück-Knopf; Übersetzungstexte in beiden Sprachen vollständig und mit gleichen Platzhaltern | Code `app/nuxt.config.ts`, `app/app/composables/useFormat.ts`, `app/app/app.vue`, `app/app/layouts/default.vue`, `app/app/error.vue`; Test `locales.test.ts` | Abgeleitet | aktiv | |
| R-106 | Sicherheit der Antworten: jede Antwort mit `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`; schreibende Anfragen an `/api` mit `Sec-Fetch-Site: cross-site` oder `same-site` werden mit 403 `cross_site_request` abgelehnt | Code `app/nuxt.config.ts` (`routeRules`), `server/lib/cross-site.ts`, `server/middleware/cross-site.ts`; Test `cross-site.test.ts` | Abgeleitet | aktiv | |
| R-107 | Fehlerübersetzung: API-Fehler tragen einen stabilen Code; die UI übersetzt ihn (`errors.<code>`), unbekannt = allgemeine Meldung; Rate-Limit der Karten-DB (429 `upstream_rate_limited`) mit eigenem Text | Code `server/lib/errors.ts`, `server/lib/api-errors.ts`, `app/app/composables/useApiError.ts`; Test `api-errors.test.ts` | Abgeleitet | aktiv | |
| R-108 | Plugin-Architektur: Dienste zentral (`createServices`), Abhängigkeiten injiziert (Datenbank, Registry, Konfiguration, `fetch`, Uhr), damit sie testbar sind; Datenbank-Verbindungen werden beim Beenden geschlossen | Code `server/services/index.ts`, `server/utils/services.ts`, `server/plugins/shutdown.ts` | Abgeleitet | aktiv | |
| R-109 | Sprache der Adapter: YGO speichert Deutsch+Englisch (Standard `en`), Pokémon Deutsch+Englisch+Japanisch; Anzeigename = erste vorhandene Sprache in der Reihenfolge de, en, ja | Code `server/tcg/ygo/adapter.ts`, `server/tcg/tcgdex/adapter.ts`, `shared/utils/languages.ts`, `shared/utils/game-config.ts` | Abgeleitet | aktiv | |

### Zusätzliche Entscheide aus dem Code (Herkunft: Abgeleitet)

| ID | Kurzbeschreibung | Quelle | Herkunft | Zustand | Notiz |
|---|---|---|---|---|---|
| D-021 | Dienste sind framework-unabhängige Fabriken (`createXService(deps)`); die Nitro-Schicht ist dünn | Code `server/services/*`, `server/api/*`; README §Architecture | Abgeleitet | aktiv | |
| D-022 | Sitzung als versiegeltes Cookie (h3), nicht in der Datenbank | Code `server/lib/session.ts` | Abgeleitet | aktiv | |
| D-023 | Passwort-Hash mit `node:crypto` scrypt, selbstbeschreibendes Format | Code `server/lib/password.ts` | Abgeleitet | aktiv | |
| D-024 | Login-Sperre in-memory pro Benutzername statt pro IP (hinter Proxy kommen alle von derselben Adresse) | Code `server/lib/login-throttle.ts` (Kommentar) | Abgeleitet | aktiv | |
| D-025 | Wechselkurse nur im Speicher gehalten, nicht in der Datenbank | Code `server/services/rates.ts` | Abgeleitet | aktiv | |
| D-026 | Preis-Scheduler als Nitro-Plugin im App-Prozess, Zustand in der Datenbank | Code `server/plugins/price-refresh.ts`, `schema.prisma` (`PriceRefreshRun`) | Abgeleitet | aktiv | ersetzt Konzept-Scheduler-Container, siehe K-002 |
| D-027 | CSV mit Semikolon, UTF-8+BOM, `\r\n`; Zahlen mit Punkt | Code `server/lib/csv.ts`, `server/services/export.ts` | Abgeleitet | aktiv | |
| D-028 | Export serverseitig (alle Seiten, gleiche Filterlogik wie Liste) statt im Browser | Code `server/api/export/cards.get.ts`, `server/services/cards.ts` (`orderedIds`) | Abgeleitet | aktiv | |
| D-029 | Filterung und Sortierung der Übersicht im Speicher über alle Treffer (Level/Preis nicht per DB sortierbar; Sammlung klein) | Code `server/services/cards.ts` (Kommentar in `list`) | Abgeleitet | aktiv | |
| D-030 | Roh-SQL für `prices_checked_at`, damit `last_modified_at` unberührt bleibt | Code `server/services/prices.ts` | Abgeleitet | aktiv | |
| D-031 | Schriften lokal (`@fontsource/ibm-plex-sans`), keine Google-Fonts-Aufrufe | Code `app/package.json`; Chat 2026-10-04 (Erstauftrag, Assistent-Zwischentext) | Abgeleitet | aktiv | |
| D-032 | Kein Telemetrie/Update-Check in Containern (`CHECKPOINT_DISABLE`, `PRISMA_HIDE_UPDATE_MESSAGE`, `NUXT_TELEMETRY_DISABLED`) | Code `app/Dockerfile` | Abgeleitet | aktiv | |
| D-033 | Multi-Stage-Build: Abhängigkeiten und Build auf der Plattform des Builders (`$BUILDPLATFORM`), da das Nitro-Bündel reines JavaScript ist; Laufzeit-Image nur mit Prisma-CLI für Migrationen | Code `app/Dockerfile` (Kommentare) | Abgeleitet | aktiv | |
| D-034 | Adapter melden Preise in der Währung der Quelle; Umrechnung nur bei Anzeige | Code `server/tcg/types.ts` (Kommentar zu `CommonCardPrice`) | Abgeleitet | aktiv | siehe D-015 |

### Konflikte und Lücken (nicht aufgelöst)

| ID | Beschreibung | Quellen | Status |
|---|---|---|---|
| K-001 | Konzept nennt „Nuxt 3“, README und `package.json` (`nuxt ^4.6.2`) „Nuxt 4“; Dockerfile-Kommentar „Nuxt 3/4“ | KONZEPT §Tech-Stack, README §Architecture, `app/package.json`, `app/Dockerfile` | offen (siehe Chat-Abgleich) |
| K-002 | Konzept: Preis-Scheduler als eigener Node-Worker-Container mit node-cron (`scheduler`-Service, `CRON_SCHEDULE`); Code: Nitro-Plugin im App-Container, DB-gestützte Tranchen, `PRICE_REFRESH_*`; `docker-compose.yml` kennt keinen `scheduler`-Service | KONZEPT §Komponenten/§Deployment, Code `server/plugins/price-refresh.ts`, `docker-compose.yml` | offen (siehe Chat-Abgleich) |
| K-003 | Konzept: Node 20; Code: Node 24 (`ARG NODE_VERSION=24`, CI Node 24), `engines.node >=22`, README „Node 24“ | KONZEPT §Deployment, `app/Dockerfile`, `app/package.json`, `.github/workflows/*.yml` | erklärt im Chat (Node 20 EOL, Assistent-Abweichung vom 2026-10-04) |
| K-004 | Konzept: „Login-Mechanismus: vorerst weglassen … Entscheidung steht aus“ (§Offene Punkte) widerspricht dem Absatz „Anmeldung (ab 0.5)“ im selben Dokument und dem Code | KONZEPT §Offene Punkte/§Sicherheitskonzept | durch Chat 2026-10-07 überholt (siehe Block C) |
| K-005 | Schema-Kommentar zu `CardSet.edition` nennt „FIRST_EDITION, UNLIMITED, LIMITED_EDITION“; Migration `unlimited_is_empty` und `shared/utils/editions.ts` machen Unlimited zu NULL | `app/prisma/schema.prisma`, `app/prisma/migrations/20261008100000_unlimited_is_empty`, `shared/utils/editions.ts` | Kommentar veraltet |
| K-006 | Konzept sieht PDF/CSV/Markdown-Export vor; umgesetzt ist nur CSV, KI-Kopie und Druckliste stehen auf der Roadmap | KONZEPT, README §Roadmap, Code | bekannt (Roadmap) |
| K-007 | README-Konfigurationstabelle und `.env.example` nennen nicht: `IMAGE_DIR`, `YGOPRODECK_API_URL`, `TCGDEX_API_URL`, `EXCHANGE_RATE_API_URL` (Code `server/lib/config.ts`), `SKIP_MIGRATIONS`, `BUILD_KIND` (Entrypoint/Dockerfile) | README §Configuration, `.env.example`, Code | Lücke in der Doku |
| K-008 | README §Tests nennt „manual override tracking“; es gibt keine manuellen Überschreibungen mehr (`manual_overrides` entfernt) | README §Tests, §Data model | README veraltet (zu prüfen) |
| K-009 | Konzept: regelmässiges `pg_dump`-Backup per Cron an zweitem Ort; README dokumentiert nur manuelle Befehle, nichts ist automatisiert | KONZEPT §Sicherheitskonzept, README §Backup | nicht umgesetzt |
| K-010 | Feature-Zeile der README nennt für die Detailseite „German and English“; Pokémon speichert zusätzlich Japanisch | README §Features vs. §Pokémon, `shared/utils/game-config.ts` | README unvollständig |
| K-011 | Konzept-Datenmodell (`cards.description`, `cards.image_url`, `manual_overrides`, `players`) weicht vom Schema ab (Übersetzungstabelle, `users`, keine Overrides); die README listet die Abweichungen | KONZEPT §Datenmodell, `schema.prisma`, README §Data model | dokumentiert |

## Block C – Chat

Quelle: Session-Transkript `~/.claude/projects/-home-user-cardkeeper/8bedf9ba-7343-59cc-8b34-0d701a3efbd5.jsonl` (2026-10-04 bis 2026-10-23, eine durchgehende Session). Ausgewertet werden die Nachrichten des Benutzers, die Fragerunden (AskUserQuestion) und die Antworten/Vorschläge des Assistenten, soweit der Benutzer sie bestätigt hat. Zeitangaben: UTC-Zeitstempel des Transkripts. „Turn“ = laufende Nummer der Textbeiträge in der ausgewerteten Datei (nur zur Orientierung beim Wiederaufnehmen).

Format der Bestätigungen: `ID | Chat-Beleg (Zeitpunkt, Zitat ≤ 15 Wörter) | Wirkung` (Wirkung: Herkunft → `User-Vorgabe`, neuer Eintrag, Zustandsänderung).

### C1 – 2026-10-04 (Erstauftrag bis erste Erweiterungen) bis 2026-10-05 19:57 (Pokémon, Set-Browser-Idee)

| ID | Chat-Beleg | Wirkung |
|---|---|---|
| R-001, D-006 | 2026-10-04 09:59 Erstauftrag: „Wir starten mal rein mit yu-gi-oh… andere tcg games können später folgen“ | → User-Vorgabe |
| R-036 | 2026-10-04 09:59: „keine lokale Installation auf dem Host sondern alles via docker/container“ | → User-Vorgabe |
| R-051, D-018 | 2026-10-04 09:59: nur minor/patch, „ausser wenn breaking changes mittels feat! … major“ | → User-Vorgabe |
| R-052, R-035 | 2026-10-04 09:59: „github workflows für die automatischen updates von abhängigkeiten“ und semantic-release | → User-Vorgabe |
| R-049, R-050 | 2026-10-04 09:59: Unit-Tests „bei einem neuen pr und release“ | → User-Vorgabe |
| R-034 | 2026-10-04 10:00 Fragerunde „UI-Sprache“: Antwort „i18n Deutsch + Englisch“ | → User-Vorgabe |
| R-035 | 2026-10-04 10:00 Fragerunde „Docker-Images“: Antwort „Ja, GHCR multi-arch“ | → User-Vorgabe |
| R-028 | 2026-10-04 10:00 Fragerunde „Währung“: Antwort „Quelle + Originalwährung“ | → User-Vorgabe; später ergänzt durch R-029 (2026-10-10), siehe history |
| R-201 (neu) | 2026-10-04 09:59: „Bitte verwende für kommentare ausschliesslich englisch. auch für das readme.“ | Anforderung: Code-Kommentare und README auf Englisch (User-Vorgabe, aktiv) |
| R-202 (neu) | 2026-10-04 09:59: „Falls du fragen hast, stelle die fragen vorzeitig, bevor du code ausführst.“ | Arbeitsweise: Rückfragen vor der Ausführung (User-Vorgabe, aktiv) |
| R-203 (neu) | 2026-10-04 09:59: „du kannst meine anderen repo (… docker-volume-backup … unbound-publisher) verwenden“ | Hinweis auf Referenz-Repos für Workflows/Release (User-Vorgabe; nur Quelle für D-018/D-035) |
| R-204 (neu) | 2026-10-04 10:00 Fragerunde „Scope“: Antwort „Kern-MVP“ (ohne Scheduler, Export, `/admin`, Login) | Umfang der ersten Version (User-Vorgabe); später erweitert, siehe history |
| D-035 (neu) | 2026-10-04 10:43 Assistent: Abweichungen vom Konzept (Node 24 statt 20, Nuxt 4 statt 3, Status-Enum, Tag `v0.0.0`) | Entscheid des Assistenten, vom Benutzer nicht beanstandet (Herkunft: Abgeleitet); erklärt K-001/K-003 |
| D-033 | 2026-10-04 14:09–14:41: Image-Job hing (QEMU-Build arm64), Fix-PR #4 des Assistenten; Benutzer: „alles geklappt“ | Entscheid: Build-Stufen auf der Plattform des Builders; Herkunft Abgeleitet (vom Benutzer akzeptiert) |
| R-205 (neu) | 2026-10-04 10:57–14:41: PR-Squash-Merge mit Titel `feat: …` bestimmt die Version; Image-Paket entsteht erst beim ersten Release | Betriebswissen (Abgeleitet), siehe README §Releases |
| (kein Eintrag) | 2026-10-04 14:55–15:06: Docker-Container ohne Internet auf Fedora 44 (firewalld) | Umgebungsproblem des Benutzers, keine Anforderung |
| R-023 | 2026-10-04 19:40 (1): „Beim Erfassen einer neuen Karte soll die Sprache nicht mehr gewählt werden… primär DE“ | → User-Vorgabe |
| D-012, R-025 | 2026-10-04 19:40 (2): „Die erfassten Daten sollen in DE und EN runtergeladen und gespeichert werden.“ | → User-Vorgabe |
| R-014 | 2026-10-04 19:40 (3): Sprache umstellbar, „primär DE… nicht verfügbar… nicht ausgewählt werden“ | → User-Vorgabe |
| R-033 | 2026-10-04 19:40 (4): „Aktuell steht ‚von API übernommen‘. Dahinter soll dann ‚geändert am‘ + Datum stehen.“ | → User-Vorgabe |
| R-015, D-013 | 2026-10-04 19:40 (5): „nur der SET-Code und die Edition geändert werden können… in allen Sprachen“ | → User-Vorgabe |
| R-022 | 2026-10-04 19:40 (6): Daten neu abrufen, Ausnahmen „Edition und Set Code sowie die Status und Zuweisungsinformationen“ | → User-Vorgabe |
| R-004, R-006, R-010 | 2026-10-04 19:40 (7): Übersicht nach Kartentyp, Typ, Set, Attribut, Seltenheit, Set-Code, Level einschränken; „Genaue Umsetzung ist freigestellt“ | → User-Vorgabe |
| R-206 (neu) | 2026-10-06 08:00: „Verwende immer sprechende Namen für einen Branch.“ (auch 2026-10-04 19:40) | Arbeitsweise: sprechende Branch-Namen (User-Vorgabe, aktiv) |
| R-059 | 2026-10-04 20:47: Fehlerabfang gem. YGOPRODeck-API (HTTP 400 mit Fehler) prüfen | → User-Vorgabe; Assistent: nur „No card matching“ = leer, andere 400 als 502 mit Text |
| R-207 (neu) | 2026-10-05 17:18: Hinweis „änderbar“ an Set-Code/Edition entfernen („bereits durch das beschreibbare Feld ersichtlich“) | UI: keine Textmarke „änderbar“ an editierbaren Feldern (User-Vorgabe, aktiv) |
| R-011 | 2026-10-05 17:18: Sortierung Name, Level, Kaufdatum, Preis, auf-/absteigend | → User-Vorgabe |
| R-208 (neu) | 2026-10-05 17:18: Kartentyp/Typ/Attribut sollen „immer der gleiche Wert“ sein, unabhängig von der Sprache | Anforderung: sprachunabhängige, einheitliche Filterwerte (User-Vorgabe); Umsetzung: Attribute stets aus der englischen Antwort (Assistent 17:22) |
| R-011 (Detail) | 2026-10-05 17:18: „Ein Patch sollte dafür ausreichen.“ → Assistent wählt `fix:`, weist auf `feat:` hin | Release-Wahl pro Änderung liegt beim Benutzer (PR-Titel) |
| R-001, D-036 (neu) | 2026-10-05 18:57: Pokémon über TCGdex (kostenlos, kein API-Key, REST) als neuer Adapter, vom Benutzer mit Recherche-Text vorgegeben | Entscheid TCGdex als Pokémon-Quelle (User-Vorgabe) |
| R-002 | 2026-10-05 18:57: „beim Hinzufügen… vorauswählen, ob Yu-Gi-Oh oder Pokemon“ | → User-Vorgabe |
| R-053 | 2026-10-05 18:57: „Explizites Datenmodell für Pokemon Karten“ | → User-Vorgabe |
| R-025 (Pokémon) | 2026-10-05 18:57: „SST ruft sowohl DE als auch EN ab. Falls eine Sprache nicht verfügbar… weggelassen“ | → User-Vorgabe |
| R-003, R-014 | 2026-10-05 18:57: Sprache umstellbar; „zwischen YGO und Pokemon unterschieden“ | → User-Vorgabe |
| R-004 | 2026-10-05 18:57: „Filter und Sortierung soll ähnlich YGO umgesetzt werden“; Fragerunde 18:58: Filter/Sort „Standard“ | → User-Vorgabe |
| R-053 | 2026-10-05 18:58 Fragerunde „Variante“: „Variante, beim Hinzufügen wählbar“ (Gegenstück zu Edition) | → User-Vorgabe |
| R-055 | 2026-10-05 18:58 Fragerunde „Suche“: Trefferliste „Mit Vorschaubildern“ | → User-Vorgabe |
| R-048 | 2026-10-05 18:57: „ist es möglich die Version eines Branches zu testen?“ → README §Trying out a branch | → User-Vorgabe (Frage), Antwort als Doku |
| R-056 | 2026-10-05 19:48: Set vorab wählen, Japanisch nicht tippbar; 19:54: „hippoterus“ 040/088 muss `me03-040` ergeben | → User-Vorgabe |
| R-057 | 2026-10-05 19:48: japanische Karten nicht über Text suchbar → Set-Auswahl; Vorschlag des Assistenten: Japanisch als dritte gespeicherte Sprache | → User-Vorgabe (Bedarf), Lösung vom Benutzer bestätigt mit „Ich nehme Ihre Bedingung als Anforderung“ (19:55) |

### C2 – 2026-10-05 20:00 bis 2026-10-07 17:11 (Set-Browser, Spielwahl merken, Login, Lizenz, Darkmode)

| ID | Chat-Beleg | Wirkung |
|---|---|---|
| R-056, R-057 | 2026-10-05 20:07 Assistent: Set-Browser + Japanisch umgesetzt (Branch `feature/pokemon-set-browser-and-japanese`); 20:47 Frage nach Branch-Beziehung (Info) | bestätigt Umsetzung der Anforderung von 19:48 |
| R-002 | 2026-10-06 07:31: „soll das vom user zuletzt gewählte Spiel beibehalten werden… default ist User (Browser Session) abhängig“ | → User-Vorgabe; Umsetzung Cookie `cardkeeper-last-game` (1 Jahr), Assistent 07:35 |
| R-206 | 2026-10-06 08:00: „Verwende immer sprechende Namen für einen Branch.“ | bestätigt |
| R-056 (Detail) | 2026-10-06 13:08 (1): Set-Symbol im Set-Picker streichen, Logo bleibt und lädt verzögert („verschwendet nur ressourcen“) | → User-Vorgabe; Symbol aus API/Typen entfernt (Assistent 13:12) |
| R-003 | 2026-10-06 13:08 (2): Übersicht „soll der Default ‚Alle Spiele‘ sein… letzte Einstellung… (cookie)“ | → User-Vorgabe; Cookie `cardkeeper-overview-game` (Assistent 13:12) |
| R-037 (CONTAINER_PREFIX) | 2026-10-06 13:08 (3): „im Docker compose jeweils einen container-namen angeben“ (`cardkeeper_app`, `cardkeeper_db`) | → User-Vorgabe; später Präfix per `CONTAINER_PREFIX` (siehe history) |
| D-037 (neu) | 2026-10-06 14:49–14:50: Frage nach Schutz des `main`-Branches; Assistent: Ruleset „Protect main“ (Löschen sperren, Force-Push sperren, PR nötig mit 0 Freigaben, drei Statusprüfungen, Admin-Bypass für den Release-Push mit `RELEASE_TOKEN`); 2026-10-07 10:51: Release lief „auch mit dem neuen Branch-Schutz“ | Entscheid: `main` geschützt mit Admin-Ausnahme für den Release-Workflow (Herkunft: Abgeleitet; Benutzer hat umgesetzt, Detail der Einstellungen nur in der Chat-Anleitung belegt); in GitHub konfiguriert, nicht im Repo |
| R-056 (Detail) | 2026-10-07 10:47: „Bei der Pokemon SST ist defaultmässig Englisch… auf Deutsch ändern (default)“ | → User-Vorgabe; Standardsprache Deutsch, Wahl wird nicht gemerkt (Assistent 10:51) |
| R-056 (Detail) | 2026-10-07 11:02: Kartennummer mit oder ohne Schrägstrich; `040088` → `040/088`, Slash spätestens beim Verlassen des Feldes | → User-Vorgabe; nur Ziffernzahlen 3+3 oder 4+4 werden geteilt (Assistent 11:05) |
| R-045 | 2026-10-07 13:47: Frage zur nginx-Einstellung (https/http, Cache, WebSocket); „muss nicht ins Git“ | Information; Antwort: Scheme http, Cache Assets aus, WebSockets aus, `client_max_body_size`; README-Abschnitt später auf wenige Sätze gekürzt (2026-10-07 15:31–15:32) |
| R-039 | 2026-10-07 14:46: „User dürfen nur die eigenen Karten erfassen, ändern oder löschen“; „alle Karten einsehen“; „nicht die Karte eines anderen“ | → User-Vorgabe |
| R-039 | 2026-10-07 14:46: Zuweisung Pflicht, default angemeldeter User | → User-Vorgabe |
| R-040 | 2026-10-07 14:46: „initiales Password ‚cardkeeper‘… der User kann das ändern“; Fragerunde 14:51: Änderung beim ersten Login „Ja, erzwungen“ | → User-Vorgabe |
| R-041 | 2026-10-07 14:46: „via DB Script kann der App Admin das Passwort… zurücksetzen“; Fragerunde 14:47: „SQL: Hash auf NULL“ | → User-Vorgabe |
| R-040 (USERS) | Fragerunde 2026-10-07 14:47: „Wer legt Benutzer an?“ → „Liste in der .env“; „Spieler und Benutzer zusammenführen“ | → User-Vorgabe; D-038 (neu): `players` und `users` zu einer Tabelle |
| R-042 | Fragerunde 2026-10-07 14:47: unzugewiesene Karten „einfach übersprungen… nachträglich manuell gesetzt“; 14:51: ohne Besitzer ändert „Niemand“ | → User-Vorgabe |
| R-018 | Fragerunde 2026-10-07 14:51: Besitzer darf Karte an einen anderen Benutzer übergeben „Ja“ | → User-Vorgabe |
| R-045, D-008 | Fragerunde 2026-10-07 14:51: nginx-Basic-Auth und Header `X-Remote-User` „Entfernen“ | → User-Vorgabe; ersetzt die Idee `/admin` mit nginx-Basic-Auth |
| D-039 (neu) | 2026-10-07 14:46 Benutzer schlägt `nuxt-auth-utils` und `is_admin` vor; Assistent 15:18: eigene Session mit eingebautem h3 und `scrypt`, kein `is_admin` | Abweichung vom Vorschlag des Benutzers, nicht beanstandet (Herkunft: Abgeleitet); siehe D-022, D-023 |
| R-209 (neu) | 2026-10-07 15:31: README „Admin area“ aus der Roadmap entfernen („User werden im .env verwaltet“) | Es gibt keinen Admin-Bereich in der App (User-Vorgabe, aktiv) |
| R-045 | 2026-10-07 15:31: Reverse-Proxy-Abschnitt der README auf das Nötigste kürzen | → User-Vorgabe (Dokumentationsumfang), Assistent 15:32: vier Sätze |
| D-020 | 2026-10-07 15:31: „Lizenz… nachträglich auf PolyForm Noncommercial 1.0.0 ändern… korrekte Texte“; 15:53: „Aktuell ist polyform-noncommercial wohl das richtige.“ | → User-Vorgabe; eigener Branch (Assistent 15:32) |
| R-210 (neu) | 2026-10-07 15:51–15:53: Frage nach „contribution welcome“; Benutzer: „dann lassen wir’s mal weg“ | Entscheid: kein Beitragshinweis/CLA in der Lizenz-Änderung (verworfen); Herkunft User-Vorgabe |
| R-040 (SESSION_SECRET) | 2026-10-07 15:43: Frage, ob `SESSION_SECRET` aufbewahrt werden muss; Antwort: darf neu gesetzt werden, beendet nur alle Logins | Information (Doku in README) |
| R-005 | 2026-10-07 16:46: „Die App soll zusätzlich in einem Darkmode verfügbar sein… zeige zuerst ein Muster“; 17:06: „Design passt. Voreinstellungen: System folgt dem Gerät, wenn nicht erkannt: hell. Einstellungen merken.“ | → User-Vorgabe; Muster-Artefakt vor der Umsetzung |
| D-040 (neu) | 2026-10-07 17:11 Assistent: Farben aus Nuxt UI, eigene Variablen in `main.css`; Text auf Blau mit `text-inverted` wegen Kontrast | Entscheid des Assistenten (Abgeleitet) |

### C3 – 2026-10-07 17:18 bis 2026-10-08 19:13 (Bildzoom, Kopfzeile, Titel, Editionen, tolerantes Parsen)

| ID | Chat-Beleg | Wirkung |
|---|---|---|
| R-016 | 2026-10-07 17:18: „Bei Klick auf ein heruntergeladenes Bild soll das vergrössert (evtl. als Modal) angezeigt werden… Qualität gross genug“ | → User-Vorgabe; grösste Standardvariante der Karten-DB (Assistent 17:24) |
| R-211 (neu) | 2026-10-07 17:18: Umschaltung „Karten“/„Benutzer“ soll immer an der gleichen Stelle sein, „Suche… nur in der Kartenübersicht“ | Kopfzeile bleibt beim Seitenwechsel stabil; Suchfeld nur in der Übersicht (User-Vorgabe, aktiv) |
| R-212 (neu) | 2026-10-07 17:40: „immer wenn ich ein Dropdown öffne, verschiebt sich der Rand… Prüfe und korrigiere“ | Kein Layout-Sprung beim Öffnen von Dropdowns/Dialogen (User-Vorgabe, aktiv); Ursache doppelter Scrollbalken-Ausgleich (Assistent 17:45) |
| R-016 | 2026-10-07 17:48: Klick auf das Bild schliesst den Dialog; grössere Blätter-Flächen; „Rechte Maustaste… Das Bild soll runtergeladen werden können“ | → User-Vorgabe; Kartenname als Dateiname, Download-Knopf (Assistent 17:58) |
| R-081 | 2026-10-07 18:51: Frage, ob Bild-Upload/Hauptbild extra gespeichert werden muss; Antwort: sofort gespeichert | Information; Bild-Aktionen wirken sofort, mit Audit-Eintrag |
| R-105 | 2026-10-07 19:16: „Der Titel soll ‚Cardkeeper - {Seite}‘ (z.B. Cardkeeper - Übersicht) heissen.“ | → User-Vorgabe |
| R-025 | 2026-10-07 19:37: „Edition ‚1. Auflage‘… als Erfassungshilfe… Dropdown oder sonst relativ einfach“ | → User-Vorgabe (Ausgangspunkt) |
| R-025, D-014 | 2026-10-07 21:15 (Benutzer, englischer Auftrag): Schlüssel statt Text für die Voreinstellungen von `card_sets.edition`, übersetzte Labels wie `status.<KEY>`, Migration mit Abgleich (ohne Gross-/Kleinschreibung), eigener Text bleibt unverändert; Tests für Migration und Label | → User-Vorgabe |
| R-025 | 2026-10-07 21:37/21:39: Migration auch für „1. Auflage“ und „1.Auflage“; „Rest gibt es aktuell nicht.“ | → User-Vorgabe |
| R-025, D-014 | 2026-10-08 17:42/17:52: nur zwei aufgedruckte Editionen („1st Edition“, „Limited Edition“); „Unlimited = leer“ (NULL); Buttons bei der Erfassung bleiben; Kartenseite Dropdown (übersetzt); „Freitext weg“; unbekannter bestehender Text bleibt sichtbar | → User-Vorgabe; ersetzt den Zwischenstand mit dem Schlüssel `UNLIMITED` (siehe history) |
| R-025 | 2026-10-08 18:13: Kein Listeneintrag „Ohne Aufdruck (unlimitiert)“ im Dropdown der Detailansicht | → User-Vorgabe; Assistent: ✕-Knopf zum Leeren, Platzhalter „Keine Edition“ (18:18) |
| R-104 | 2026-10-08 18:18: Migration: alles mit „1st“ oder „1.“ → `FIRST_EDITION`; „Andere Werte bleiben… und schreiben einen Logeintrag im Docker Container“ | → User-Vorgabe; Startprüfung im App-Container (Assistent 18:22) |
| R-015 | 2026-10-08 18:18: „bei SET_CODE soll immer UPPERCASE eingegeben werden… auf dem UI so veranlassen“ | → User-Vorgabe |
| R-046/R-104 (Info) | 2026-10-08 18:24: Benutzer fragt SQL-Vorkontrolle und wie der DB-Container zu öffnen ist (`docker compose exec db psql …`) | Information, nur im Chat (nichts ins Repository) |
| R-213 (neu) | 2026-10-08 17:52: „bei der Erfassung… immer ein Pokemon Bild geholt statt das korrekte Yu-Gi-Oh“ (Testumgebung); „Sicherstellen, dass die SST-Aufrufe weiterhin korrekt funktionieren“ | Anforderung: ein YGO-Treffer lädt nur YGO-Bilder, ein Pokémon-Treffer nur TCGdex-Bilder (User-Vorgabe); Ursache war ein Browser-Cache (Benutzer 18:08), Test `api-calls.test.ts` ergänzt |
| R-027 | 2026-10-08 18:08: Bild erschien nach Strg+Umschalt+R korrekt („Es war der Cache“) | Anlass für ETag-Auslieferung (R-082) |
| R-059 | 2026-10-08 19:03/19:13: YGO-Link-Karte („Hieratic Seal…“, `def: null`) → 502 `upstream_invalid_response`; Benutzer liefert die API-Antwort | → User-Vorgabe (Fehlerbehebung); Entscheid: unerwartete Feldwerte weglassen und loggen, nur Karte ohne ID/Name ablehnen (Assistent 19:07) |
| R-025 (Pokémon) | 2026-10-08 19:10: Frage zu vorhandenen Werten `holo`, `normal`, `reverse` in `card_sets.edition` bei der Migration; Antwort: bleiben unverändert, Migration betrifft nur Yu-Gi-Oh! | Information; Migration spielbezogen (Test `edition-migration.test.ts`) |

### C4 – 2026-10-09 18:28 bis 2026-10-10 20:33 (Favicon, ß/ss, Vorschaubilder, Set-Code-Suche, Set-Wizards)

| ID | Chat-Beleg | Wirkung |
|---|---|---|
| R-214 (neu) | 2026-10-09 18:28: „bislang gab es kein Favicon für die app… Installiere das Favicon gemäss Anhang“; 18:32 „verkleinern auf benötigte ideale Grösse“; 18:33 „der weisse Rahmen soll entfernt werden“ | App-Symbole (`favicon.ico` 16/32/48, 16er/32er PNG, Apple-Touch-Icon 180) im Verzeichnis `public/`, ohne weissen Rahmen, ohne Login erreichbar (User-Vorgabe); Quelle: hochgeladenes Asset-Paket |
| R-026 | 2026-10-09 19:19: „ß Eszett… auch gefunden wird, wenn ss eingegeben wird“ (in der CH wird ss geschrieben); 20:41: „funktioniert das in allen schnittstellen? … Pokemon und … YGO?“ | → User-Vorgabe; gilt für beide Adapter, den Abruf nach Namen und die Suche in der eigenen Sammlung (Assistent 20:44) |
| R-058 | 2026-10-09 20:52: Bild der Karte schon bei Suche und Auswahl, auch bei YGO („nicht erst im Detail“) | → User-Vorgabe; Umsetzung über eigene Kopie wegen „nicht hotlinken“ von YGOPRODeck (Assistent 20:58) |
| R-024 | 2026-10-10 12:04: Einzelkarten auch über Set-Code („L5DD-ENA15“) einlesen; bei Code „L5DD-DEA15“ ohne Treffer erneut mit „L5DD-ENA15“ | → User-Vorgabe |
| R-024 | 2026-10-10 12:29: bei Fund über die englische Version soll der eingegebene Code übernommen werden; Set englisch vorbelegen, „bei mehreren keine Auswahl. bei eindeutigem Treffer aber auswählen. und den DE Code speichern“ | → User-Vorgabe; Code wird nur ersetzt, wenn er zum gewählten Druck gehört (Assistent 12:33) |
| R-020 | 2026-10-10 12:56: „alle Karten eines Sets hinzufügen“; Set wählen, Sprache wählen (DE, EN, JA; Set-Codes in dieser Sprache); bei unklarem Druck „wie in einem Wizard“; 1. Auflage/Limited Edition „pro Karte gespeichert“; „nur bei Unklarheiten soll der User eingreifen“ | → User-Vorgabe |
| R-020 | 2026-10-10 13:24: nach der Setwahl standardmässig nur Karten mit Konflikt zeigen; zum Abwählen einzelner Karten die Liste aufklappen | → User-Vorgabe |
| R-215 (neu) | 2026-10-10 18:42: Prozessschritte als Fortschrittsanzeige, nicht als Buttons („verleitet zum draufklicken“); 19:56: „Status der Prozessanzeige ist so okay“ | UI: Schrittanzeige des Wizards als nicht klickbare Liste mit nummerierten Kreisen, Haken und Hervorhebung (User-Vorgabe, aktiv) |
| R-021 | 2026-10-10 19:56: „Set-Wizard soll auch für Pokemon Sets möglich werden… analog YGO“; falls nicht möglich: Info | → User-Vorgabe; Variante ist das „Unklare“, Ladezeit durch Varianten-Einzelanfragen (Assistent 20:09) |
| R-053 | 2026-10-10 20:26: Bug-Verdacht: Pokémon-Edition in der Detailansicht änderbar, obwohl keine andere Variante zur Wahl; 20:33: „Nein, in diesem fall keine Änderung. lass das feld wie's ist“ | verworfen: Variantenfeld bleibt wie es ist (aktiv, mit nur den vorhandenen Varianten); `sv08-249` zeigt nur Holo, wenn die API nur Holo meldet |

### C5 – (wird fortgesetzt ab Turn 344)

_noch nicht ausgewertet_
