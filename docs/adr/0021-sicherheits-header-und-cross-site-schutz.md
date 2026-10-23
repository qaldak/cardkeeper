# ADR 0021: Sicherheits-Header und Schutz vor schreibenden Cross-Site-Anfragen

- **Status:** Akzeptiert
- **Datum:** 2026-10-21
- **Herkunft:** User-Vorgabe (Auftrag, ein externes Review zu prüfen und die notwendigen Anpassungen umzusetzen, Chat 2026-10-21 14:27); konkrete Massnahmen: Abgeleitet.
- **Inventar:** D-043, R-106, R-218, R-219
- **Specs:** [`sicherheit`](../../openspec/specs/sicherheit/spec.md)

## Kontext

Der Benutzer legte ein externes Review (Sicherheit, Architektur) vor mit dem Auftrag „Prüfe die Inputs/Reviewkommentare, validiere das und stelle sicher, dass die notwendigen Anpassungen umgesetzt werden.“ Viele Behauptungen des Reviews erwiesen sich als nicht zutreffend (Assistent 14:37 ff.).

## Entscheid

Jede Antwort trägt `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` und `Referrer-Policy: same-origin`. Schreibende Anfragen an `/api` mit `Sec-Fetch-Site: cross-site` oder `same-site` werden mit 403 `cross_site_request` abgelehnt; das Sitzungs-Cookie ist `SameSite=Lax`. HTTPS, HSTS und Content-Security-Policy sind dem Reverse Proxy überlassen (README).

## Betrachtete Alternativen

nicht dokumentiert. Zurückgestellt bzw. nicht umgesetzt wurden die Review-Punkte Soft-Delete, Aufteilen von `cards.ts` und Scans (Benutzer: „ok. keine weiteren aktivitäten nötig.“, 14:37).

## Konsequenzen

- Browser senden den Header nur an https und localhost; über reines http im Heimnetz greift die Prüfung nicht, dort bleibt `SameSite=Lax` (Code-Kommentar in `cross-site.ts`). Programme ohne Header (curl, Skripte) tragen kein Browser-Login und sind nicht betroffen.
- Transportsicherheit liegt ausserhalb der App.

## Quellen

- Chat 2026-10-21 14:27, 14:37 ff.
- `README.md` §Users and passwords (Safeguards)
- `app/nuxt.config.ts`, `app/server/lib/cross-site.ts`, `app/server/middleware/cross-site.ts`
