# ADR 0009: Login-Sperre im Speicher pro Benutzername statt pro Adresse

- **Status:** Akzeptiert
- **Datum:** nicht dokumentiert (entstand vermutlich mit dem Login am 2026-10-07; Vermutung)
- **Herkunft:** Abgeleitet (Code-Kommentar und README; im Chat nicht als eigener Entscheid belegt).
- **Inventar:** D-024, R-070
- **Specs:** [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md)

## Kontext

Das Initialpasswort `cardkeeper` ist öffentlich, ohne Begrenzung könnte es „für jeden anderen Namen schlicht durchprobiert werden“. Hinter dem Reverse Proxy kommen alle Anfragen von derselben Adresse (Code-Kommentar in `login-throttle.ts`).

## Entscheid

Nach 10 Fehlversuchen innerhalb von 15 Minuten wird der Benutzername für den Rest des Zeitfensters gesperrt (429). Die Zähler liegen nur im Speicher. Die Sperre gilt auch beim Passwortwechsel; falscher Name und falsches Passwort liefern dieselbe Antwort (`invalid_credentials`) und die gleiche Rechenzeit.

## Betrachtete Alternativen

- Sperre pro Adresse: im Code-Kommentar genannt und verworfen, weil hinter dem Proxy alle von derselben Adresse kommen.

## Konsequenzen

- Ein Neustart setzt die Zähler zurück.

## Quellen

- `app/server/lib/login-throttle.ts` (Kommentar)
- `README.md` §Users and passwords (Safeguards)
- Tests `login-throttle.test.ts`, `users.test.ts`
