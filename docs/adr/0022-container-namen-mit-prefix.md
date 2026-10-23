# ADR 0022: Feste Container-Namen mit konfigurierbarem Präfix

- **Status:** Akzeptiert
- **Datum:** 2026-10-06
- **Herkunft:** User-Vorgabe (feste Namen, Chat 2026-10-06 13:08); die Präfix-Variable ist ein Entscheid des Assistenten (13:12), vom Benutzer nicht beanstandet.
- **Inventar:** D-041, R-037, R-048
- **Specs:** [`betrieb`](../../openspec/specs/betrieb/spec.md), [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md)

## Kontext

Der Benutzer wollte in Docker Compose jeweils einen Container-Namen angeben (z. B. `cardkeeper_app`, `cardkeeper_db`). Feste Namen sind pro Docker-Host einmalig und hätten den Test eines Branches neben der echten Installation (`-p cardkeeper-test`) verhindert.

## Entscheid

Die Namen lauten `${CONTAINER_PREFIX:-cardkeeper}_app` und `…_db`; das Präfix lässt sich über `CONTAINER_PREFIX` ändern.

## Betrachtete Alternativen

- Automatische Namen von Compose (`cardkeeper-app-1`, Ausgangslage; abgelöst).
- Feste Namen ohne Präfix (vom Assistenten verworfen, weil sie den Branch-Test blockieren).

## Konsequenzen

- Ein zweiter Stack (Branch-Test) kann parallel laufen.
- Befehle in der Dokumentation nennen die Namen (`docker logs cardkeeper_app`).

## Quellen

- Chat 2026-10-06 13:08, 13:12
- `README.md` §Configuration, §Trying out a branch
- `docs/spec-migration/history.md` H-07
