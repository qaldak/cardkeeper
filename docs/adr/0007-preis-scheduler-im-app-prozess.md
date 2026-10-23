# ADR 0007: Preis-Reload als Plugin im App-Prozess, Zustand in der Datenbank

- **Status:** Akzeptiert als gültiger Stand; Bestätigung durch den Benutzer offen (Q-002)
- **Datum:** 2026-10-10
- **Herkunft:** Abgeleitet: Der Benutzer verlangte den gestaffelten Preis-Reload (Chat 2026-10-10 20:40), den Ort der Ausführung wählte der Assistent; der Benutzer hat ihn nicht beanstandet. Das Konzept sah einen eigenen Scheduler-Container vor.
- **Inventar:** D-026, R-030, R-031, R-094, K-002
- **Specs:** [`preise`](../../openspec/specs/preise/spec.md), [`betrieb`](../../openspec/specs/betrieb/spec.md)

## Kontext

Das Konzept nennt einen eigenen Scheduler-Container mit node-cron und `CRON_SCHEDULE`, unabhängig vom Web-App-Prozess (Konzept §Tech-Stack, §Deployment). Der Benutzer verlangte am 2026-10-10 20:40 den Reload der Preise „via API… gestaffelt“, ohne den Ort festzulegen, und: „Die Konfiguration muss nicht im UI passieren. Das kann im .env gemacht werden.“

## Entscheid

Ein Nitro-Plugin im App-Prozess prüft 60 Sekunden nach dem Start und danach alle 10 Minuten, ob eine Tranche fällig ist. Der Zustand steht in `price_refresh_runs`; es gibt keinen zweiten Container. Konfiguration über `PRICE_REFRESH_*` in `.env`.

## Betrachtete Alternativen

- Eigener Scheduler-Container mit node-cron (Konzept); im Chat nicht verworfen oder besprochen, aber nicht umgesetzt (K-002, Q-002).

## Konsequenzen

- Weniger Container und Konfiguration; docker-compose.yml enthält nur `db` und `app`.
- Läuft die App nicht, läuft auch der Preis-Reload nicht; ein Neustart unterbricht eine laufende Tranche (Zustand `interrupted`).

## Quellen

- `docs/KONZEPT.md` §Architektur, §Tech-Stack, §Deployment
- Chat 2026-10-10 20:40, 20:58, 21:10–21:19
- `app/server/plugins/price-refresh.ts`, `app/server/services/prices.ts`
- `docker-compose.yml`
