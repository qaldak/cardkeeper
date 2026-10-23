# Sicherheit Specification

## Purpose
Härtung der Antworten und Downloads: Sicherheits-Header, Schutz vor schreibenden Cross-Site-Anfragen und Beschränkung der Hosts, von denen Bilder geladen werden. Anmeldung und Besitzer-Rechte stehen in `benutzer-zugriff`. HTTPS, HSTS und eine Content-Security-Policy überlässt das System dem Reverse Proxy. Entscheid: ADR 0021.

## Requirements

### Requirement: Sicherheits-Header an jeder Antwort
Das System MUSS jede Antwort (Seiten, API, Bilder) mit `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` und `Referrer-Policy: same-origin` ausliefern.
Quelle: README §Users (Safeguards); Code app/nuxt.config.ts (routeRules); Chat 2026-10-21 14:27 (Review-Auftrag) | Herkunft: Abgeleitet | Inventar: R-106, R-218 | MUSS=SHALL

#### Scenario: Header an Seite und API
- GIVEN die App läuft
- WHEN die Anmeldeseite und `GET /api/health` abgerufen werden
- THEN tragen beide Antworten die drei Header

### Requirement: Schreibende Cross-Site-Anfragen werden abgelehnt
Das System MUSS Anfragen mit POST, PUT, PATCH oder DELETE an `/api/`, die der Browser mit `Sec-Fetch-Site: cross-site` oder `same-site` kennzeichnet, mit 403 `cross_site_request` ablehnen; `same-origin`, `none` und fehlender Header sowie Lesezugriffe bleiben erlaubt.
Quelle: README §Users (Safeguards); Code server/lib/cross-site.ts; Test cross-site.test.ts; Chat 2026-10-21 14:27 | Herkunft: Abgeleitet | Inventar: R-106, R-218 | MUSS=SHALL

#### Scenario: Fremde Seite
- GIVEN eine Anfrage trägt `Sec-Fetch-Site: cross-site`
- WHEN sie als POST an `/api/auth/login` gesendet wird
- THEN antwortet das System mit 403 `cross_site_request`

#### Scenario: Eigene Seite und Skripte
- GIVEN `Sec-Fetch-Site: same-origin` oder kein Header
- WHEN ein POST gesendet wird
- THEN wird er wie üblich verarbeitet

#### Scenario: Lesen
- GIVEN `Sec-Fetch-Site: cross-site`
- WHEN ein GET gesendet wird
- THEN wird er nicht abgelehnt

### Requirement: Bilder nur von erlaubten Hosts
Das System MUSS Bilder aus Karten-Datenbanken nur über HTTPS und nur von den Hosts laden, die der Adapter des Spiels deklariert, mit begrenzter Dateigrösse, damit manipulierte Antworten keine beliebigen Adressen abrufen lassen.
Quelle: Code server/lib/image-download.ts, server/lib/image-url.ts; README §Notes on the card API; Test image-download.test.ts | Herkunft: Abgeleitet | Inventar: R-083, R-059 | MUSS=SHALL

#### Scenario: Fremder Host
- GIVEN eine Antwort nennt eine Bild-URL auf einem nicht deklarierten Host
- WHEN das System das Bild laden soll
- THEN lädt es nichts und die Karte wird ohne API-Bild angelegt

#### Scenario: http statt https
- GIVEN eine Bild-URL beginnt mit `http:`
- WHEN das System sie prüft
- THEN wird sie nicht verwendet

### Requirement: Dateipfade bleiben im Bildverzeichnis
Das System MUSS gespeicherte Bildpfade relativ zum Bildverzeichnis führen und jeden Pfad ablehnen, der es verlässt.
Quelle: Code server/lib/image-files.ts (resolveImagePath); Test image-files.test.ts | Herkunft: Abgeleitet | Inventar: R-082 | MUSS=SHALL

#### Scenario: Pfad mit `..`
- GIVEN ein gespeicherter Pfad löst ausserhalb des Bildverzeichnisses auf
- WHEN das System die Datei ausliefern will
- THEN wirft es einen Fehler und liefert nichts aus
