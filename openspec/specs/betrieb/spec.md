# Betrieb Specification

## Purpose
Betrieb der Anwendung: Container-Stack, Konfiguration, Prüfung beim Start, Health-Endpunkt, Härtung, Reverse Proxy und Backup. Entscheide: [ADR 0001](../../../docs/adr/0001-hosting-selbst-gehostet.md), [ADR 0016](../../../docs/adr/0016-multi-arch-image-nativer-build.md), [ADR 0018](../../../docs/adr/0018-main-branch-schutz.md), [ADR 0022](../../../docs/adr/0022-container-namen-mit-prefix.md). Verlauf: H-07. Offene Fragen: Q-009.

## Requirements

### Requirement: Selbst gehostet in Containern
Das System MUSS vollständig in Containern laufen, auf dem Host MUSS nur Docker nötig sein; der Stack besteht aus `db` (PostgreSQL 16, kein veröffentlichter Port) und `app` mit den Volumes `db-data` und `card-images`.
Quelle: Chat 2026-10-04 09:59 („alles via docker/container“); README §Intro, §Quick start; KONZEPT §Hosting-Varianten | Herkunft: User-Vorgabe | Inventar: R-036, R-062 | MUSS=SHALL

#### Scenario: Start
- GIVEN Docker mit Compose v2.24 oder neuer
- WHEN `docker compose up -d --build` läuft
- THEN laufen `db` und `app` ohne weitere Installation auf dem Host

### Requirement: Migrationen bei jedem Start
Das System MUSS Datenbankmigrationen bei jedem Start anwenden; `SKIP_MIGRATIONS=1` überspringt sie.
Quelle: README §Quick start; Code app/docker-entrypoint.sh | Herkunft: Abgeleitet | Inventar: R-036, R-101 | MUSS=SHALL

#### Scenario: Neue Version
- GIVEN eine neue Migration liegt vor
- WHEN der Container startet
- THEN wird sie angewendet

### Requirement: Konfiguration über Umgebungsvariablen
Das System MUSS seine Einstellungen über Umgebungsvariablen in `.env` beziehen, nicht über die Oberfläche; Pflicht sind `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `SESSION_SECRET` und `USERS`.
Quelle: Chat 2026-10-10 20:40 („nicht im UI, im .env“); README §Configuration | Herkunft: User-Vorgabe | Inventar: R-037 | MUSS=SHALL

#### Scenario: Fehlt Pflichtwert
- GIVEN `SESSION_SECRET` fehlt
- WHEN die Anwendung startet
- THEN bricht sie ab

### Requirement: Standardwerte
Das System MUSS diese Standardwerte verwenden: `APP_PORT` 3000, `APP_BIND_ADDRESS` 127.0.0.1, `PRICE_SOURCE` cardmarket, `MAX_UPLOAD_MB` 5, `CONTAINER_PREFIX` cardkeeper, `APP_DB_NAME` und `APP_DB_USER` cardkeeper.
Quelle: README §Configuration | Herkunft: Abgeleitet | Inventar: R-037 | MUSS=SHALL

#### Scenario: Port
- GIVEN `APP_PORT` ist nicht gesetzt
- WHEN der Stack startet
- THEN lauscht die App auf Port 3000 an 127.0.0.1

### Requirement: Prüfung der Konfiguration beim Start
Das System MUSS beim Start `SESSION_SECRET` (mindestens 32 Zeichen), `USERS`, `DISPLAY_CURRENCY` (3 Buchstaben), positive Zahlen der Limits und die `PRICE_REFRESH_*`-Werte prüfen und bei Fehlern mit einer Meldung abbrechen.
Quelle: Code app/server/lib/config.ts, duration.ts; Test config.test.ts; README §Configuration | Herkunft: Abgeleitet | Inventar: R-095 | MUSS=SHALL

#### Scenario: Zu kurz
- GIVEN `SESSION_SECRET` hat 10 Zeichen
- WHEN die Anwendung startet
- THEN bricht sie mit einer Meldung ab

### Requirement: Datenbankrolle ohne Superuser
Das System MUSS beim ersten Initialisieren des Datenverzeichnisses eine eigene Datenbankrolle der App (kein Superuser) anlegen; eine spätere Passwortänderung ändert eine bestehende Datenbank nicht.
Quelle: README §Configuration; KONZEPT §Sicherheitskonzept; db/init/10-create-app-role.sh | Herkunft: Abgeleitet | Inventar: R-038 | MUSS=SHALL

#### Scenario: Passwort geändert
- GIVEN die Datenbank besteht
- WHEN `APP_DB_PASSWORD` geändert wird
- THEN bleibt das Passwort der Rolle unverändert

### Requirement: Startbanner
Das System MUSS beim Start des Containers ein Banner (Version, „Release image“ oder „Local build“, Node-Version, Architektur, Startzeit UTC) auf Englisch ins Log schreiben; es SOLL nicht in der README stehen.
Quelle: Chat 2026-10-10 21:38, 21:42; Code app/docker-entrypoint.sh | Herkunft: User-Vorgabe | Inventar: R-101 | MUSS=SHALL

#### Scenario: Start
- GIVEN ein Release-Image
- WHEN der Container startet
- THEN steht im Log das Banner mit „Release image“

### Requirement: Health-Endpunkt
Das System MUSS unter `GET /api/health` nur bei erreichbarer Datenbank 200 liefern; das Image MUSS einen Docker-`HEALTHCHECK` enthalten.
Quelle: Code app/server/api/health.get.ts, app/Dockerfile | Herkunft: Abgeleitet | Inventar: R-102 | MUSS=SHALL

#### Scenario: Datenbank aus
- GIVEN die Datenbank ist nicht erreichbar
- WHEN `/api/health` aufgerufen wird
- THEN ist die Antwort kein 200

### Requirement: Härtung und Ressourcen
Das System MUSS die App als Benutzer `node` mit `no-new-privileges` und ohne Capabilities starten, mit `--max-old-space-size=256`, und PostgreSQL mit `shared_buffers=128MB` und `max_connections=30`.
Quelle: Code docker-compose.yml, app/Dockerfile; KONZEPT §Deployment (teilweise geändert) | Herkunft: Abgeleitet | Inventar: R-103, R-063 | MUSS=SHALL

#### Scenario: Rechte
- GIVEN der App-Container läuft
- WHEN sein Benutzer geprüft wird
- THEN ist er `node`

### Requirement: Reverse Proxy
Das System SOLL hinter einem Reverse Proxy betrieben werden, der nur weiterleitet und TLS beendet; `client_max_body_size` MUSS etwas über `MAX_UPLOAD_MB` liegen, `X-Forwarded-Proto` MUSS gesetzt sein.
Quelle: Chat 2026-10-07 13:47, 15:31; README §Reverse proxy | Herkunft: User-Vorgabe | Inventar: R-045, D-010 | MUSS=SHALL

#### Scenario: HTTPS
- GIVEN TLS am Proxy mit `X-Forwarded-Proto https`
- WHEN ein Login erfolgt
- THEN ist das Sitzungs-Cookie `secure`

### Requirement: Keine Telemetrie in den Containern
Das System SOLL in den Containern Telemetrie und Update-Hinweise der Werkzeuge abschalten (`CHECKPOINT_DISABLE`, `PRISMA_HIDE_UPDATE_MESSAGE`, `NUXT_TELEMETRY_DISABLED`).
Quelle: Code app/Dockerfile | Herkunft: Abgeleitet | Inventar: D-032 | MUSS=SHALL

#### Scenario: Image
- GIVEN das gebaute Image
- WHEN seine Umgebungsvariablen gelesen werden
- THEN sind alle drei Variablen gesetzt

### Requirement: Upgrade ohne Logins
Das System MUSS beim Upgrade einer Version ohne Logins nach Ergänzen von `SESSION_SECRET` und `USERS` die bisherigen „Spieler“ als Benutzer mit Initialpasswort übernehmen, die ihre Karten behalten.
Quelle: README §Users and passwords | Herkunft: Abgeleitet | Inventar: R-044 | MUSS=SHALL

#### Scenario: Upgrade
- GIVEN Spieler Anna mit 5 Karten
- WHEN die neue Version startet
- THEN ist Anna Benutzerin mit ihren 5 Karten

### Requirement: Backup
Das System MUSS in der README Datenbank (`pg_dump`) und Bild-Volume als zu sichernde Daten dokumentieren. [OFFEN Q-009] Annahme: Ein automatisches Backup ist nicht Teil der Anforderungen.
Quelle: README §Backup; KONZEPT §Sicherheitskonzept | Herkunft: Abgeleitet | Inventar: R-046 | MUSS=SHALL

#### Scenario: Anleitung
- GIVEN die README
- WHEN §Backup gelesen wird
- THEN nennt sie `pg_dump` und den Bild-Volume
