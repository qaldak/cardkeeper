# Benutzer und Zugriff Specification

## Purpose
Anmeldung, Benutzerverwaltung über die Konfiguration, Passwortregeln, Sitzungen und Besitzer-Rechte an Karten. Alle angemeldeten Benutzer sehen alle Karten, ändern darf nur der Besitzer. Header und Cross-Site-Schutz stehen in `sicherheit`. Entscheide: [ADR 0008](../../../docs/adr/0008-eigenes-login-versiegeltes-cookie.md) (Login mit versiegeltem Cookie), [ADR 0009](../../../docs/adr/0009-login-sperre-pro-benutzername.md) (Sperre pro Benutzername).

## Requirements

### Requirement: Alles hinter dem Login
Das System MUSS jede Anfrage unter `/api/` ausser `/api/health`, `/api/auth/login` und `/api/_nuxt_icon/` ohne gültiges Login mit 401 `unauthenticated` ablehnen.
Quelle: Chat 2026-10-07 14:46; README §Users; Code server/middleware/auth.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: API ohne Login
- GIVEN kein Login-Cookie
- WHEN `GET /api/cards` aufgerufen wird
- THEN antwortet das System mit 401 und dem Code `unauthenticated`

#### Scenario: Health ohne Login
- GIVEN kein Login-Cookie
- WHEN `GET /api/health` aufgerufen wird
- THEN ist keine Anmeldung nötig

### Requirement: Seiten führen ohne Login zur Anmeldung
Das System MUSS eine Seite der Oberfläche ohne Login auf `/login` umleiten, bei anderen Seiten als `/` mit dem Ziel im Parameter `next`.
Quelle: Code app/app/middleware/auth.global.ts; Chat 2026-10-07 14:46 | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Seite ohne Login
- GIVEN kein Login
- WHEN eine Seite der Oberfläche geöffnet wird
- THEN führt das System auf `/login`, bei `/cards/5` mit `next=/cards/5`

### Requirement: Alle sehen alle Karten
Das System MUSS jedem angemeldeten Benutzer alle Karten zeigen, unabhängig vom Besitzer.
Quelle: Chat 2026-10-07 14:46; Test ownership.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Fremde Karte lesen
- GIVEN eine Karte gehört Anna
- WHEN Sven die Übersicht und die Karte öffnet
- THEN sieht Sven die Karte

### Requirement: Nur der Besitzer ändert eine Karte
Das System MUSS Ändern, Löschen, Aktualisieren aus der Karten-API und Bildänderungen einer Karte nur ihrem Besitzer erlauben und andere mit 403 `not_card_owner` ablehnen; wer eine Karte anlegt, MUSS ihr Besitzer sein.
Quelle: Chat 2026-10-07 14:46; README §Users; Test ownership.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Fremde Karte ändern
- GIVEN eine Karte gehört Anna
- WHEN Sven sie ändert, löscht, aktualisiert oder ihre Bilder verändert
- THEN lehnt das System jede Aktion mit 403 `not_card_owner` ab

#### Scenario: Eigene Karte anlegen
- GIVEN Anna legt eine Karte an
- WHEN die Karte gespeichert ist
- THEN ist Anna ihre Besitzerin

### Requirement: Karte an einen anderen Benutzer übergeben
Das System MUSS dem Besitzer erlauben, die Karte an einen bestehenden anderen Benutzer zu übergeben; danach darf nur der neue Besitzer sie ändern; der Besitzer kann nicht geleert werden.
Quelle: Chat 2026-10-07 14:51 (Fragerunde: Ja); Code server/lib/schemas.ts; Test cards.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Übergabe
- GIVEN Anna besitzt eine Karte
- WHEN Anna sie an Sven übergibt
- THEN darf nur noch Sven die Karte ändern

#### Scenario: Unbekannter Empfänger
- GIVEN Anna besitzt eine Karte
- WHEN sie an eine nicht vorhandene Benutzer-ID übergeben wird
- THEN lehnt das System ab

### Requirement: Karten ohne Besitzer sind unveränderlich
Das System MUSS Karten ohne Besitzer für alle sichtbar lassen, aber ihre Änderung durch jeden Benutzer mit 403 `card_has_no_owner` ablehnen, bis ein Besitzer in der Datenbank gesetzt ist.
Quelle: Chat 2026-10-07 14:47/14:51; README §Users; Test ownership.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Besitzerlose Karte ändern
- GIVEN eine Karte ohne Besitzer
- WHEN irgendein Benutzer sie ändern will
- THEN lehnt das System mit 403 `card_has_no_owner` ab

#### Scenario: Besitzer setzen
- GIVEN eine Karte ohne Besitzer
- WHEN der Betreiber den Besitzer in der Datenbank setzt
- THEN kann dieser Benutzer die Karte ändern

### Requirement: Gelöschter Benutzer lässt Karten bestehen
Das System MUSS die Karten eines in der Datenbank entfernten Benutzers ohne Besitzer erhalten.
Quelle: README §Users; Test ownership.test.ts; Schema onDelete SetNull | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Benutzer entfernt
- GIVEN Max besitzt Karten
- WHEN Max in der Datenbank gelöscht wird
- THEN bleiben seine Karten ohne Besitzer erhalten

### Requirement: Benutzer kommen aus der Konfiguration
Das System MUSS beim Start die in `USERS` genannten Benutzer anlegen, die noch nicht existieren (ohne Beachtung der Gross-/Kleinschreibung), mit dem Initialpasswort `cardkeeper`.
Quelle: Chat 2026-10-07 14:46/14:47; README §Users; Test users.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Neuer Benutzer
- GIVEN `USERS=anna,max`, nur `anna` existiert
- WHEN die App startet
- THEN wird `max` angelegt und `anna` bleibt unverändert

#### Scenario: Andere Schreibweise
- GIVEN `Anna` existiert
- WHEN `USERS=anna` gelesen wird
- THEN wird kein zweiter Benutzer angelegt

### Requirement: Entfernte Namen löschen nichts
Das System SOLL Benutzer, die aus `USERS` verschwinden, samt Passwort und Karten unverändert lassen; eine Admin-Rolle und Admin-Oberfläche DÜRFEN NICHT vorhanden sein.
Quelle: README §Users; Chat 2026-10-07 14:46, 15:31; Test users.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Name entfernt
- GIVEN `max` besitzt Karten und fehlt in `USERS`
- WHEN die App startet
- THEN bleiben Konto, Passwort und Karten von `max` erhalten

### Requirement: Erstes Login erzwingt ein eigenes Passwort
Das System MUSS einen Benutzer ohne eigenes Passwort nach dem Login zur Passwortwahl zwingen und ihm bis dahin nur `/api/auth/me`, `/api/auth/password` und `/api/auth/logout` erlauben (sonst 403 `password_change_required`).
Quelle: Chat 2026-10-07 14:46, 14:51 (Fragerunde: erzwungen); Code server/middleware/auth.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Erstes Login
- GIVEN ein Benutzer ohne eigenes Passwort
- WHEN er sich mit `cardkeeper` anmeldet
- THEN führt die Oberfläche zur Seite „Neues Passwort wählen“ und andere API-Aufrufe liefern 403 `password_change_required`

### Requirement: Passwortregeln
Das System MUSS ein neues Passwort von 8 bis 200 Zeichen verlangen, das nicht (ohne Beachtung der Schreibweise) `cardkeeper` und nicht das aktuelle ist, und die Änderung nur mit richtigem aktuellem Passwort zulassen (sonst 400 `current_password_wrong`).
Quelle: README §Users; Code shared/utils/users.ts; Tests users.test.ts, password.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Zu kurz
- GIVEN ein Benutzer ändert sein Passwort
- WHEN das neue Passwort kürzer als 8 Zeichen ist
- THEN lehnt das System mit einem passenden Fehlercode ab

#### Scenario: Aktuelles falsch
- GIVEN ein angemeldeter Benutzer
- WHEN er ein neues Passwort mit falschem aktuellem setzt
- THEN lehnt das System mit 400 `current_password_wrong` ab

### Requirement: Passwort-Reset durch den Betreiber
Das System MUSS ein Passwort zurücksetzen, wenn der Betreiber `password_hash` des Benutzers in der Datenbank auf NULL setzt; danach gilt wieder `cardkeeper` mit erzwungener Passwortwahl, und alle bisherigen Sitzungen des Benutzers MÜSSEN enden.
Quelle: Chat 2026-10-07 14:46, 14:47 (SQL: Hash auf NULL); README §Users; Test users.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Reset
- GIVEN Annas Hash ist NULL gesetzt
- WHEN Anna sich mit `cardkeeper` anmeldet
- THEN muss sie ein neues Passwort wählen und ihre frühere Sitzung ist ungültig

### Requirement: Anmeldung verrät keine Namen
Das System MUSS bei unbekanntem Namen und bei falschem Passwort dieselbe Antwort geben (401 `invalid_credentials`), den Namen ohne Beachtung der Schreibweise und umgebender Leerzeichen suchen und bei unbekanntem Namen gleich lange rechnen.
Quelle: Code server/services/users.ts; Test users.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Unbekannter Name
- GIVEN kein Benutzer „xyz“
- WHEN ein Login mit „xyz“ versucht wird
- THEN ist die Antwort dieselbe wie bei falschem Passwort

#### Scenario: Schreibweise
- GIVEN ein Benutzer `Anna`
- WHEN er sich mit ` anna ` anmeldet
- THEN wird er gefunden

### Requirement: Sperre nach Fehlversuchen
Das System MUSS einen Benutzernamen nach 10 fehlgeschlagenen Anmelde- oder Passwortprüfungen innerhalb von 15 Minuten bis zum Ende dieses Zeitfensters sperren (429 `too_many_attempts`), auch für das richtige Passwort, und zwar pro Benutzername, nicht pro Adresse.
Quelle: README §Users (Safeguards); Code server/lib/login-throttle.ts; Tests login-throttle.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Gesperrt
- GIVEN 10 Fehlversuche für `anna` in 15 Minuten
- WHEN `anna` mit richtigem Passwort anmeldet
- THEN lehnt das System mit 429 ab

#### Scenario: Zähler zurück
- GIVEN weniger als 10 Fehlversuche
- WHEN das Login gelingt
- THEN wird der Zähler des Namens zurückgesetzt

### Requirement: Sitzung als versiegeltes Cookie
Das System MUSS die Sitzung als verschlüsseltes und signiertes Cookie `cardkeeper-session` führen (httpOnly, SameSite=Lax, 30 Tage, `secure` nach dem vom Reverse Proxy gemeldeten Protokoll), ohne Sitzungsspeicher auf dem Server.
Quelle: README §Users; Code server/lib/session.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Cookie nach Login
- GIVEN ein Login über https hinter einem Proxy mit `X-Forwarded-Proto`
- WHEN die Antwort gesendet wird
- THEN trägt das Cookie `cardkeeper-session` die Flags httpOnly, SameSite=Lax und secure

### Requirement: Passwortwechsel beendet andere Sitzungen
Das System MUSS eine Sitzung nur für den Passwortzustand gelten lassen, in dem sie angelegt wurde; nach Wechsel oder Reset MUSS der ändernde Browser angemeldet bleiben und müssen andere Browser abgemeldet werden.
Quelle: README §Users; Code server/lib/password.ts, server/api/auth/password.put.ts; Test users.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Wechsel
- GIVEN Anna ist in zwei Browsern angemeldet
- WHEN sie im ersten Browser ihr Passwort ändert
- THEN bleibt der erste angemeldet und der zweite wird beim nächsten Aufruf abgemeldet

### Requirement: Neues Sitzungs-Geheimnis meldet alle ab
Das System MUSS bei geändertem `SESSION_SECRET` alle bisherigen Sitzungen als ungültig behandeln, ohne Passwörter oder Daten zu verändern.
Quelle: Chat 2026-10-07 15:43; README §Configuration | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Geheimnis gewechselt
- GIVEN `SESSION_SECRET` wird geändert
- WHEN die App neu startet
- THEN müssen sich alle neu anmelden, und die Passwörter bleiben gültig

### Requirement: Weiterleitung nach dem Login nur auf eigene Pfade
Das System MUSS nach dem Login nur auf Pfade der eigenen App weiterleiten (nicht auf `//host` oder `http:`), bei Pflicht-Passwortwechsel auf `/account`, und eine angemeldete Person von `/login` auf `/` führen.
Quelle: Code app/app/pages/login.vue, app/app/middleware/auth.global.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Fremdes Ziel
- GIVEN `/login?next=//evil.example`
- WHEN der Login gelingt
- THEN führt das System auf `/`

#### Scenario: Abgelaufene Sitzung
- GIVEN eine Sitzung ist abgelaufen
- WHEN eine API-Antwort `unauthenticated` meldet
- THEN führt die Oberfläche zur Anmeldeseite

### Requirement: Umstellung von einer Version ohne Logins
Das System MUSS den Start ohne `SESSION_SECRET` oder `USERS` verweigern, bestehende „Spieler“ als Benutzer mit Initialpasswort und ihren Karten übernehmen und einen Header `X-Remote-User` ignorieren.
Quelle: README §Users (Upgrading); docker-compose.yml; Chat 2026-10-07 14:47/14:51 | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Konfiguration fehlt
- GIVEN `.env` ohne `SESSION_SECRET` oder `USERS`
- WHEN der Stack mit Compose gestartet wird
- THEN bricht der Start mit einer Meldung ab

#### Scenario: Bestehender Spieler
- GIVEN Spieler „Anna“ mit Karten vor der Migration
- WHEN die Migration läuft
- THEN ist „Anna“ ein Benutzer ohne eigenes Passwort mit denselben Karten
