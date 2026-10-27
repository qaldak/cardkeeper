# Arbeitsregeln für Claude Code

Cardkeeper: selbst gehostete Sammlung für Yu-Gi-Oh!- und Pokémon-Karten. Überblick und Befehle: `README.md`. Architektur: `docs/ARCHITECTURE.md`.

## Wo steht was

- `openspec/specs/<domain>/spec.md`: Anforderungen, letzter gültiger Stand (MUSS/SOLL, GIVEN/WHEN/THEN). Jede Anforderung nennt Quelle und Herkunft (`User-Vorgabe` oder `Abgeleitet`).
- `docs/adr/`: Architekturentscheide (Status, Datum, Herkunft, Kontext, Entscheid, Alternativen, Konsequenzen, Quellen).
- `docs/KONZEPT.md`: historisches Ausgangskonzept, nicht mehr gültig.

## Spec und Code bleiben deckungsgleich

- Ändert eine Aufgabe das Verhalten, das eine Spec beschreibt, passt du die betroffene Spec im selben Pull Request an (Requirement und Szenario, Quelle-Zeile mit Datum der Anweisung, Herkunft `User-Vorgabe`). Danach `openspec validate --specs --strict`.
- Rein optische Änderungen, Textkorrekturen und Fehlerbehebungen ohne Verhaltensänderung brauchen keinen Spec-Eintrag.
- Ein Architekturentscheid (neue Komponente, neue Abhängigkeit, anderer Ablauf) bekommt einen neuen ADR mit der nächsten Nummer und einen Verweis aus der Spec.
- Nichts erfinden: Jede neue Aussage in Spec oder ADR braucht eine Quelle (Anweisung des Benutzers, Code, README). Vermutungen als Vermutung kennzeichnen und beim Benutzer nachfragen.

## Grössere neue Anforderungen

Für eine echte neue Funktion (z. B. ein weiteres Exportformat) den OpenSpec-Ablauf verwenden: `/opsx:propose <name>` → Entwurf mit dem Benutzer durchgehen → `/opsx:apply` → `/opsx:archive`. Für alles Kleine genügt die direkte Änderung samt Spec-Anpassung (siehe oben).

## Konventionen

- Code-Kommentare und README auf Englisch; Specs, ADRs und `docs/` auf Deutsch.
- Conventional Commits; der Pull-Request-Titel bestimmt die Version (`feat:` Minor, `fix:` Patch). Major nur bei ausdrücklichem Breaking Change.
- Sprechende Branch-Namen. Rückfragen stellen, bevor Code geändert wird.
- Texte der Oberfläche in `app/i18n/locales/de.json` und `en.json`.
- Tests: Unit-Tests für reine Logik, Integrationstests mit `TEST_DATABASE_URL` (nie `DATABASE_URL`); `make test`, `make lint`, `make typecheck`.
