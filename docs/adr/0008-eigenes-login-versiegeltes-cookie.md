# ADR 0008: Eigenes Login mit versiegeltem Session-Cookie, Benutzer über die Konfiguration

- **Status:** Akzeptiert
- **Datum:** 2026-10-07
- **Herkunft:** User-Vorgabe (Anforderungen und Fragerunden vom 2026-10-07 14:46–14:51); technische Umsetzung (h3-Sitzung, scrypt): Abgeleitet, vom Benutzer nicht beanstandet.
- **Inventar:** D-008, D-022, D-023, D-038, D-039, R-039–R-045
- **Specs:** [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`sicherheit`](../../openspec/specs/sicherheit/spec.md)

## Kontext

Das Konzept sah kein Login vor; als offener Punkt stand „Login-Mechanismus: vorerst ganz weglassen … oder einfacher Shared-Secret-Login? Entscheidung steht aus“, ein `/admin`-Pfad mit nginx-Basic-Auth und ein Header `X-Remote-User` waren angedacht. Am 2026-10-07 14:46 verlangte der Benutzer: Anwender dürfen nur die eigenen Karten erfassen, ändern oder löschen, alle Karten einsehen; initiales Passwort `cardkeeper`, vom Benutzer änderbar; Zurücksetzen per Datenbank-Skript durch den App-Betreiber.

## Entscheid

Die App hat ein eigenes Login. Benutzer stehen in `USERS` der `.env` und werden beim Start angelegt; `players` und `users` sind eine Tabelle; Initialpasswort mit erzwungener Änderung beim ersten Login; Zurücksetzen per SQL (`password_hash = NULL`); es gibt keine Admin-Rolle. Die Sitzung ist ein versiegeltes (verschlüsseltes und signiertes) Cookie (h3), Passwörter sind scrypt-Hashes. nginx-Basic-Auth und `X-Remote-User` entfallen.

## Betrachtete Alternativen

- `nuxt-auth-utils` und eine `is_admin`-Spalte (Vorschlag des Benutzers, Chat 2026-10-07 14:46); der Assistent wählte stattdessen die eingebaute h3-Sitzung und `scrypt` ohne Admin-Rolle (15:18), der Benutzer beanstandete das nicht und entfernte später den „Admin area“-Punkt aus der Roadmap (15:31).
- Fragerunde „Benutzer anlegen“: Liste in der `.env` (gewählt), Admin-Benutzer mit Oberfläche, nur per Skript.
- Fragerunde „Passwort-Reset“: SQL, Hash auf NULL (gewählt), Skript im Container.
- Fragerunde „Spieler/User“: zusammenführen (gewählt) oder getrennt lassen.
- Fragerunde „nginx-Auth“: entfernen (gewählt) oder als Fallback behalten.
- Konzept: kein Login, Shared-Secret-Login, `/admin` mit Basic-Auth (nicht umgesetzt).

## Konsequenzen

- Alle angemeldeten Benutzer sehen alle Karten, ändern darf nur der Besitzer; Karten ohne Besitzer sind für niemanden änderbar.
- Kein Server-Sitzungsspeicher; ein Passwortwechsel beendet andere Logins über den Passwortzustand.
- Änderungen an `SESSION_SECRET` melden alle ab.
- Ein Entfernen aus `USERS` löscht nichts.

## Quellen

- Chat 2026-10-07 14:46, Fragerunden 14:47 und 14:51, 15:18, 15:31
- `docs/KONZEPT.md` §Sicherheitskonzept, §Offene Punkte
- `README.md` §Users and passwords
- `app/server/lib/session.ts`, `app/server/lib/password.ts`
