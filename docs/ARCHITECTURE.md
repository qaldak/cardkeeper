# Architektur

Kurzüberblick nach C4 (Kontext, Container, Bausteine) mit drei Laufzeitabläufen. Die Entscheide stehen in `docs/adr/`, die Anforderungen in `openspec/specs/`; diese Datei wiederholt sie nicht, sondern verweist darauf. Jede Aussage stammt aus `README.md` §Architecture, `docker-compose.yml` oder dem Code unter `app/`.

## 1. Systemkontext

```mermaid
flowchart LR
    user["Benutzer<br/>(Browser)"] --> proxy["Reverse Proxy (nginx)<br/>TLS, ausserhalb des Repos"]
    proxy --> app["Cardkeeper<br/>Web-App und API"]
    app --> ygo["YGOPRODeck<br/>Yu-Gi-Oh!-Daten"]
    app --> tcgdex["TCGdex<br/>Pokémon-Daten"]
    app --> rates["Frankfurter<br/>EZB-Wechselkurse"]
```

- Der Reverse Proxy beendet TLS und leitet nur weiter; die App macht das Login selbst ([ADR 0008](adr/0008-eigenes-login-versiegeltes-cookie.md), [ADR 0001](adr/0001-hosting-selbst-gehostet.md)).
- Kartendaten: [ADR 0023](adr/0023-kartendatenquellen-ygoprodeck-tcgdex.md). Kurse: [ADR 0012](adr/0012-preise-in-quellwaehrung.md).

## 2. Container

```mermaid
flowchart TB
    subgraph stack["Docker Compose (docker-compose.yml)"]
        app["app<br/>Nuxt 4 / Nitro, Node 24<br/>UI, API, Preis-Plugin"]
        db[("db<br/>PostgreSQL 16<br/>kein veröffentlichter Port")]
        v1[/"Volume db-data"/]
        v2[/"Volume card-images"/]
    end
    app -->|Prisma| db
    db --- v1
    app --- v2
```

- Zwei Dienste, zwei Volumes; der Port der App ist standardmässig an `127.0.0.1` gebunden. Details: Spec [`betrieb`](../openspec/specs/betrieb/spec.md).
- Der Preis-Reload läuft als Plugin im App-Prozess, nicht als eigener Container ([ADR 0007](adr/0007-preis-scheduler-im-app-prozess.md)).
- Das Image ist Multi-Arch ([ADR 0016](adr/0016-multi-arch-image-nativer-build.md)).

## 3. Bausteine der App (`app/`)

| Baustein | Verzeichnis | Aufgabe | Spec |
|---|---|---|---|
| Oberfläche | `app/app/` (pages, components, composables, layouts, middleware) | Vue-Seiten, Dialoge, gemerkter Zustand | [`uebersicht`](../openspec/specs/uebersicht/spec.md), [`karte-detail`](../openspec/specs/karte-detail/spec.md), [`oberflaeche`](../openspec/specs/oberflaeche/spec.md) |
| Übersetzungen | `app/i18n/locales/` | Deutsch und Englisch | [`oberflaeche`](../openspec/specs/oberflaeche/spec.md) |
| HTTP-Schicht | `app/server/api/`, `app/server/middleware/` | dünne Handler, Login-Pflicht, Cross-Site-Schutz | [`benutzer-zugriff`](../openspec/specs/benutzer-zugriff/spec.md), [`sicherheit`](../openspec/specs/sicherheit/spec.md) |
| Dienste | `app/server/services/` | Geschäftslogik: Karten, Bilder, Preise, Kurse, Export, Benutzer, Set-Katalog | je Fachspec |
| Spiel-Adapter | `app/server/tcg/` | Schnittstelle, Registry, YGOPRODeck- und TCGdex-Adapter | [`spiele-adapter`](../openspec/specs/spiele-adapter/spec.md) |
| Hilfsfunktionen | `app/server/lib/` | Konfiguration, Filter, Sortierung, Status, CSV, Sitzung, Passwort | [`betrieb`](../openspec/specs/betrieb/spec.md) |
| Plugins | `app/server/plugins/` | Preis-Reload, Editions-Startprüfung, Benutzer anlegen, Herunterfahren | [`preise`](../openspec/specs/preise/spec.md), [`datenhaltung`](../openspec/specs/datenhaltung/spec.md) |
| Geteilter Code | `app/shared/` | Typen und Regeln für Server und Oberfläche | – |
| Datenmodell | `app/prisma/` | Schema und Migrationen | [`datenhaltung`](../openspec/specs/datenhaltung/spec.md) |

Die Dienste sind framework-unabhängige Fabriken mit eingespeisten Abhängigkeiten (Datenbank, Registry, Konfiguration, `fetch`, Uhr); die Nitro-Schicht ist dünn ([ADR 0002](adr/0002-nuxt-vue-nitro-eine-codebasis.md)). Ein neues Spiel ist ein weiterer Adapter in `app/server/tcg/registry.ts` ([ADR 0004](adr/0004-adapter-pattern-pro-spiel.md)).

## 4. Laufzeitabläufe

### 4.1 Karte erfassen

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as API (POST /api/cards)
    participant S as cards-Dienst
    participant D as Karten-DB (Adapter)
    participant P as PostgreSQL
    participant V as Volume card-images
    B->>A: Karte und Druck wählen
    A->>S: create(input, Benutzer)
    S->>D: Karte je gespeicherter Sprache laden
    S->>P: Transaktion: Karte, Übersetzungen, Druck, Preise, Snapshots, Statusverlauf, Audit
    S->>D: Bild von erlaubtem Host laden
    S->>V: Bilddatei speichern
    S->>P: relativen Pfad in card_images speichern
    A-->>B: 201 mit Kartendetail
```

Specs: [`kartenerfassung`](../openspec/specs/kartenerfassung/spec.md), [`bilder`](../openspec/specs/bilder/spec.md), [`datenhaltung`](../openspec/specs/datenhaltung/spec.md). Ein fehlgeschlagener Bild-Download verhindert das Anlegen nicht.

### 4.2 Preis-Reload

```mermaid
sequenceDiagram
    participant T as Plugin price-refresh
    participant S as prices-Dienst
    participant P as PostgreSQL
    participant D as Karten-DB (Adapter)
    T->>S: 60 s nach Start, dann alle 10 min: runDue()
    S->>P: Läufe (price_refresh_runs) und fällige Karten lesen
    S->>D: Tranche laden (YGO 20 Karten je Anfrage, TCGdex 1)
    S->>P: Preiszeilen anhängen, prices_checked_at setzen
    S->>P: Lauf als done, rate_limited, failed oder interrupted aufzeichnen
```

Specs: [`preise`](../openspec/specs/preise/spec.md), [ADR 0007](adr/0007-preis-scheduler-im-app-prozess.md).

### 4.3 CSV-Export

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as API (GET /api/export/cards)
    participant C as cards-Dienst
    participant E as export-Dienst
    B->>A: Filter, Sortierung, Sprache
    A->>C: orderedIds(Filter, Sortierung)
    C-->>E: Karten-IDs in Reihenfolge der Übersicht
    E->>E: Karten laden, Spalten bilden, CSV schreiben
    A-->>B: Datei cardkeeper-export-YYYY-MM-DD.csv
```

Spec: [`export`](../openspec/specs/export/spec.md), [ADR 0013](adr/0013-csv-export-serverseitig.md), [ADR 0014](adr/0014-uebersicht-im-speicher-filtern.md).

## 5. Querschnittliche Themen

| Thema | Wo |
|---|---|
| Anmeldung, Rechte | [`benutzer-zugriff`](../openspec/specs/benutzer-zugriff/spec.md), ADR 0008, 0009 |
| Header, Cross-Site-Schutz | [`sicherheit`](../openspec/specs/sicherheit/spec.md), ADR 0021 |
| Sprachen | [`oberflaeche`](../openspec/specs/oberflaeche/spec.md), ADR 0006 |
| Währung | [`waehrungsumrechnung`](../openspec/specs/waehrungsumrechnung/spec.md), ADR 0012 |
| Gemerkter Zustand | ADR 0020 |
| Betrieb, Konfiguration | [`betrieb`](../openspec/specs/betrieb/spec.md), `README.md` §Configuration |
| Entwicklung, Releases | [`entwicklung-release`](../openspec/specs/entwicklung-release/spec.md), ADR 0015, 0018 |

## 6. Pflege

Diese Datei ist auf Überblick ausgelegt. Sie ändert sich nur, wenn ein Baustein, ein Container oder ein externer Dienst dazukommt oder wegfällt; dann gehört in denselben Pull Request ein ADR (`docs/adr/`) und die Anpassung hier.
