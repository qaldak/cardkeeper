# ADR 0001: Selbst gehostet auf dem Raspberry Pi mit lokaler Datenbank

- **Status:** Akzeptiert
- **Datum:** 2026-10-03 (Datum des Konzepts)
- **Herkunft:** Abgeleitet (Konzept des Benutzers, `docs/KONZEPT.md`); ob der Benutzer die Entscheide des Konzepts als eigene Vorgabe versteht, ist offen (Q-007). Die Containerisierung geht auf eine Vorgabe des Benutzers zurück (Chat 2026-10-04 09:59).
- **Inventar:** D-001, D-010, R-036, R-062
- **Specs:** [`betrieb`](../../openspec/specs/betrieb/spec.md)

## Kontext

Das Konzept vergleicht drei Hosting-Varianten nach Datenhoheit, Angriffsfläche, Passung zu „kein Hacking von aussen“, laufenden Kosten und Verhalten bei Heimnetz-Ausfall.

## Entscheid

Variante 1: Raspberry Pi, rein intern bzw. über VPN, Datenbank lokal. Alles läuft in Containern (Docker Compose), auf dem Host ist nur Docker nötig.

## Betrachtete Alternativen

- Variante 2: Raspberry Pi mit Supabase (Datenhoheit „gemischt“, Zugriff hängt am Supabase-Konto, Free-Tier „auf Dauer riskant“).
- Variante 3: voll extern (Angriffsfläche „am grössten, erfordert Auth/Hardening“, unabhängig vom Heimnetz).

## Konsequenzen

- Bei einem Ausfall des Heimnetzes sind App und Datenbank gleichzeitig nicht erreichbar (Konzept).
- Der Container-Stack ist portabel; ein späterer Umzug auf Variante 3 wäre „derselbe Container-Stack auf anderer Plattform plus DB-Dump“ (Konzept).
- Das Ressourcenbudget des Pi (Pi 4, 1–2 GB RAM) beeinflusst die Konfiguration (Spec `betrieb`, Requirement „Härtung und Ressourcen“).

## Quellen

- `docs/KONZEPT.md` §Hosting-Varianten, §Deployment
- Chat 2026-10-04 09:59 („keine lokale Installation auf dem Host sondern alles via docker/container“)
- `README.md` §Quick start
