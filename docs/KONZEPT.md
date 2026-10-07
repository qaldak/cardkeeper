# YGO/TCG-Sammlungs-App – Konzept & Architektur

Oct 3, 2026 · @Qaldak

Empfehlung: Variante 1 (Raspberry Pi, rein intern/VPN, DB lokal), Nuxt 3 (Vue) + PostgreSQL in Docker Compose, Datenmodell von Beginn an multi-TCG-fähig über ein Adapter-Pattern pro Kartenspiel.

## Hosting-Varianten

| Kriterium | Variante 1 (Pi + DB lokal) | Variante 2 (Pi + Supabase) | Variante 3 (voll extern) |
| --- | --- | --- | --- |
| Datenhoheit | vollständig lokal | gemischt | vollständig extern |
| Angriffsfläche | keine (kein öffentlicher Zugriff) | DB-Zugriff hängt an Supabase-Konto | am größten, erfordert Auth/Hardening |
| Entspricht "kein Hacking von außen" | ja | bedingt | nein |
| Laufende Kosten | keine | Free-Tier auf Dauer riskant | abhängig von Plattform |
| Bei Heimnetz-Ausfall | App + DB gleichzeitig weg | App weg, DB separat erreichbar (nutzlos ohne App) | unabhängig vom Heimnetz |

Entscheidung: Variante 1. Der Stack (Docker Compose + PostgreSQL) ist portabel – ein späterer Umzug auf Variante 3 ist derselbe Container-Stack auf anderer Plattform plus DB-Dump, kein Rewrite.

## Architektur

Bestehende Infrastruktur wird wiederverwendet, keine neue Edge-Komponente nötig:

- unbound (eigener DNS-Server): löst `ygo.foo.bar` intern auf
- nginx (eigener Reverse Proxy): terminiert TLS, leitet an den App-Container weiter
- VPN-Tunnel (vorhanden): deckt Fernzugriff ins Heimnetz ab

Komponenten auf dem Raspberry Pi (Docker Compose):

| Komponente | Aufgabe |
| --- | --- |
| Web-App | CRUD-UI, Karten-Lookup on demand, Export (PDF/CSV/Markdown) |
| Scheduler | periodischer Preis-Refresh, ruft externe TCG-APIs auf |
| PostgreSQL | zentrale Datenhaltung inkl. Preis-/Status-Historie |

Datenfluss: Client → nginx → Web-App → PostgreSQL; Scheduler → externe TCG-APIs → PostgreSQL. Eine visuelle Architekturskizze dieser Struktur wurde im Chat gezeigt.

## Tech-Stack

| Bereich | Wahl | Begründung |
| --- | --- | --- |
| Frontend/Backend | Nuxt 3 (TypeScript, Vue 3) | ein Codebase für UI + API-Routen (Nitro), moderner Look, passt zu vorhandener Vue-Erfahrung |
| UI | Tailwind CSS + Nuxt UI | schnelle, konsistente, einsteigerfreundliche Komponenten statt Admin-Grid-Optik |
| ORM | Prisma | typsichere Zugriffe, einfache Migrationen, framework-unabhängig |
| Datenbank | PostgreSQL 16 | JSONB für spielspezifische Attribute, arm64-Support, zeitreihenfähig |
| Scheduler | eigener Node-Worker-Container mit node-cron | periodischer Preis-Refresh, unabhängig vom Web-App-Prozess |
| PDF-Export | pdfkit | reiner Node-Code, kein Headless-Chromium nötig, ARM-sicher |
| CSV-Export | eingebaute Node-Funktionen / csv-stringify | trivial, keine Zusatzabhängigkeit |
| Reverse Proxy | bestehender nginx (kein neuer Container) | bereits vorhanden, kein Doppelbetrieb |

Alles läuft über Docker Compose, keine Installation auf dem Client nötig.

## Datenmodell

| Tabelle | Zweck | Wichtige Felder |
| --- | --- | --- |
| games | Kartenspiele (ygo, pokemon, mtg, …) | id, slug, display\_name |
| cards | zentrale Kartendaten | id, game\_id (FK), external\_id, name, description, image\_url, game\_specific\_attributes (JSONB), manual\_overrides (JSONB), owner\_user\_id (FK), status, purchase\_date, created\_at, last\_fetched\_at, last\_modified\_at, last\_modified\_by |
| card\_sets | 1:n zu cards | card\_id (FK), set\_code, set\_name, rarity |
| price\_history | n:1 zu cards, Zeitreihe | card\_id (FK), source, price, currency, fetched\_at |
| status\_history | n:1 zu cards | card\_id (FK), status, date, person\_text, changed\_by |
| users | Benutzer mit Login (vormals players); Besitzer von Karten | id, name, contact, password\_hash (NULL = Initialpasswort) |
| api\_snapshots | unveränderliche Roh-API-Antworten | card\_id (FK), fetched\_at, raw\_json |
| audit\_log | generisches Änderungsprotokoll | entity, entity\_id, field, old\_value, new\_value, changed\_by, changed\_at |
| card\_images | n:1 zu cards, mehrere Bilder pro Karte möglich | id, card\_id (FK), file\_path, source (api\|manual), is\_primary, uploaded\_at, uploaded\_by |

Spielspezifische Attribute (ATK/DEF/Level bei YGO, HP/Typen bei Pokémon, Mana-Kosten bei Magic) liegen in `cards.game_specific_attributes` als JSONB – kein Schema-Change pro neuem Spiel nötig.

Status-Werte für `cards.status` (Dropdown): `aktiv`, `verkauft`, `getauscht`, `verschenkt`, `verloren`. Datum und Person (`status_history.date`, `status_history.person_text`) werden nur bei einem Wechsel zu `verkauft`, `getauscht` oder `verschenkt` erfasst – bei `verloren` bleibt `person_text` leer (kein Empfänger), bei `aktiv` sind beide Felder nicht relevant. Bilder: `card_images.file_path` verweist auf ein lokales Docker-Volume (`/data/card-images/`), kein DB-Blob.

## Multi-TCG-Konzept

Jedes Spiel bekommt einen Adapter mit einheitlicher Schnittstelle:

- `fetchCardById(externalId)`
- `fetchCardByName(name)`
- `mapToCommonSchema(rawResponse)` → füllt die gemeinsamen Felder in `cards` plus `game_specific_attributes`

Ein Adapter-Registry wählt den passenden Adapter anhand von `cards.game_id`. Der YGO-Adapter (YGOPRODeck) wird zuerst implementiert. Spätere Kandidaten: Pokémon TCG API (pokemontcg.io) für Pokémon, Scryfall für Magic – jeweils ein neuer Adapter, ohne Eingriff ins Kernschema oder die UI.

## Sicherheitskonzept

- Keine öffentliche Exposition: Zugriff ausschließlich im Heimnetz oder über bestehenden VPN-Tunnel
- TLS-Terminierung über vorhandenen nginx-Proxy
- Secrets (DB-Passwort, API-Keys falls nötig) in `.env` auf dem Pi, nicht im Git-Repo
- Least-Privilege-DB-User für die App (kein Superuser)
- Regelmäßiges `pg_dump`-Backup via Cron, Ablage an einem zweiten Ort (NAS/externe Platte)
- Anmeldung (ab 0.5): eigenes Login mit Session-Cookie (users, scrypt-Hash, Initialpasswort `cardkeeper` mit erzwungener Änderung); Karten gehören dem Benutzer, der sie erfasst hat, und nur dieser darf sie ändern. Benutzer werden über `USERS` in der `.env` angelegt, Passwort-Reset per SQL (`password_hash = NULL`). Die frühere Idee eines `/admin`-Pfads mit nginx-Basic-Auth ist damit ersetzt.

## Deployment

Docker-Compose-Services:

| Service | Image/Basis | Zweck |
| --- | --- | --- |
| app | Nuxt 3 (eigenes Dockerfile, node:20-alpine) | Web-UI + API |
| scheduler | Node-Worker (eigenes Dockerfile) | periodischer Preis-Refresh |
| db | postgres:16 (arm64) | Datenhaltung |

Volumes: `db-data` (Postgres-Datenverzeichnis), `card-images` (manuell ergänzte Bilder). Netzwerk: internes Docker-Bridge-Netz, nur `app` exponiert einen Port zum Host, den der vorhandene nginx-Proxy anspricht – kein Port geht direkt ins Internet. Benötigte Env-Variablen: `DATABASE_URL`, `CRON_SCHEDULE`, `NODE_OPTIONS=--max-old-space-size=256`.

Ressourcen-Zielbudget auf dem Pi 4 (1–2 GB RAM gesamt): Nitro-Preset `node-server` (kein Cluster-Modus), `NODE_OPTIONS=--max-old-space-size=256` für den App-Container, Postgres `shared_buffers` auf ca. 128 MB begrenzen, Scheduler als schlankes Einzel-Script statt eigenes Framework.

## Offene Punkte & nächste Schritte

- Backup-Zielort (NAS, externe Platte, Cloud) noch nicht festgelegt
- Login-Mechanismus: vorerst ganz weglassen (Zugriff ist bereits durch VPN/Heimnetz gesichert) oder einfacher Shared-Secret-Login? Entscheidung steht aus
- Raspberry-Pi-Modell/RAM zur Dimensionierung bestätigen (empfohlen: Pi 4/5 mit mind. 4 GB RAM, SSD statt SD-Karte)
- Genaue Felder für zukünftige Spiele (Pokémon/Magic) erst bei Bedarf detaillieren
- GitHub-Repo-Struktur: Monorepo mit `/app`, `/scheduler`, `/docker-compose.yml`, `/docs` (dieses Konzept als Referenz)
