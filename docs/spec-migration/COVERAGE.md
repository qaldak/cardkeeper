# Abdeckung der Baseline

Prüfung nach Phase 6: Welche Quellen sind in Specs und ADRs abgebildet, was nicht und warum. Erzeugt am 2026-10-23.

Spec-Pfade: `openspec/specs/<domain>/spec.md`; ADRs: `docs/adr/`. Verweise von den Specs auf das Inventar stehen in der Zeile `Inventar:` jeder Anforderung, von den ADRs im Kopf `Inventar:`.

## 1. README-Features

| README-Feature | Spec | ADR |
|---|---|---|
| Yu-Gi-Oh! und Pokémon in einer Sammlung; Spielwahl beim Erfassen (gemerkt) und in der Übersicht; Filter und Sortierung je Spiel | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md) | [ADR 0004](../adr/0004-adapter-pattern-pro-spiel.md), [ADR 0020](../adr/0020-gemerkter-zustand-in-cookies.md) |
| Hell/Dunkel mit Umschalter | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) | – |
| Übersicht: Filter, Besitzerfilter, erhaltener Zustand, Blättern, Suche in allen Sprachen, Sortierung, Total | [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [`karten-blaettern`](../../openspec/specs/karten-blaettern/spec.md) | [ADR 0014](../adr/0014-uebersicht-im-speicher-filtern.md), [ADR 0020](../adr/0020-gemerkter-zustand-in-cookies.md) |
| CSV-Export | [`export`](../../openspec/specs/export/spec.md) | [ADR 0013](../adr/0013-csv-export-serverseitig.md) |
| Detailseite: Sprachen, Set-Code/Edition, Bildupload, Vergrösserung, Status, Besitzer, Preisverlauf | [`karte-detail`](../../openspec/specs/karte-detail/spec.md), [`bilder`](../../openspec/specs/bilder/spec.md), [`kartenstatus`](../../openspec/specs/kartenstatus/spec.md), [`preise`](../../openspec/specs/preise/spec.md) | [ADR 0011](../adr/0011-editionen-als-schluessel.md) |
| Yu-Gi-Oh! „Ganzes Set“ (Wizard) | [`set-import`](../../openspec/specs/set-import/spec.md) | – |
| Pokémon „Ganzes Set“ (Wizard, Variante) | [`set-import`](../../openspec/specs/set-import/spec.md) | – |
| „Von API aktualisieren“ | [`karte-detail`](../../openspec/specs/karte-detail/spec.md) | – |
| „Karte hinzufügen“: Suche nach Name, Passcode, Set-Code; Druck; Edition; ß/ss | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md) | [ADR 0011](../adr/0011-editionen-als-schluessel.md) |
| Bilder einmal laden, lokal speichern, nie hotlinken | [`bilder`](../../openspec/specs/bilder/spec.md), [`sicherheit`](../../openspec/specs/sicherheit/spec.md) | [ADR 0019](../adr/0019-bilder-lokal-speichern.md) |
| Preise je Marktplatz in Quellwährung, `DISPLAY_CURRENCY`, Wechselkurse | [`preise`](../../openspec/specs/preise/spec.md), [`waehrungsumrechnung`](../../openspec/specs/waehrungsumrechnung/spec.md) | [ADR 0012](../adr/0012-preise-in-quellwaehrung.md) |
| Geplanter Preis-Reload in Tranchen | [`preise`](../../openspec/specs/preise/spec.md) | [ADR 0007](../adr/0007-preis-scheduler-im-app-prozess.md) |
| Audit-Log und „geändert am“ | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`karte-detail`](../../openspec/specs/karte-detail/spec.md) | – |
| Oberfläche in Deutsch und Englisch | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) | [ADR 0006](../adr/0006-texte-pro-sprache.md) |
| Semantische Releases, Multi-Arch-Images, automatische Abhängigkeits-Updates | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) | [ADR 0015](../adr/0015-semantic-release-und-versionen.md), [ADR 0016](../adr/0016-multi-arch-image-nativer-build.md) |
| Nicht Teil der ersten Version: „Für KI kopieren“, druckbare Liste | export (Platzhalter), Q-008 | [ADR 0013](../adr/0013-csv-export-serverseitig.md) |

## 2. Module und Hauptverzeichnisse

| Verzeichnis | Spec | ADR |
|---|---|---|
| `app/app/pages`, `components`, `composables`, `layouts`, `middleware` | [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`set-import`](../../openspec/specs/set-import/spec.md), [`karte-detail`](../../openspec/specs/karte-detail/spec.md), [`karten-blaettern`](../../openspec/specs/karten-blaettern/spec.md), [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md), [`export`](../../openspec/specs/export/spec.md) | [ADR 0020](../adr/0020-gemerkter-zustand-in-cookies.md) |
| `app/app/assets`, `app/public` (Schriften, App-Symbole, Stil) | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) | – |
| `app/i18n/locales` | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) | [ADR 0006](../adr/0006-texte-pro-sprache.md) |
| `app/server/api` | je nach Thema: benutzer-zugriff, [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [`karten-blaettern`](../../openspec/specs/karten-blaettern/spec.md), [`export`](../../openspec/specs/export/spec.md), [`bilder`](../../openspec/specs/bilder/spec.md), [`set-import`](../../openspec/specs/set-import/spec.md), betrieb (Health) | – |
| `app/server/services` | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`karte-detail`](../../openspec/specs/karte-detail/spec.md), [`bilder`](../../openspec/specs/bilder/spec.md), [`preise`](../../openspec/specs/preise/spec.md), [`waehrungsumrechnung`](../../openspec/specs/waehrungsumrechnung/spec.md), [`export`](../../openspec/specs/export/spec.md), [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`set-import`](../../openspec/specs/set-import/spec.md) | [ADR 0014](../adr/0014-uebersicht-im-speicher-filtern.md) |
| `app/server/tcg` | [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md) | [ADR 0004](../adr/0004-adapter-pattern-pro-spiel.md), [ADR 0023](../adr/0023-kartendatenquellen-ygoprodeck-tcgdex.md) |
| `app/server/lib` | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`sicherheit`](../../openspec/specs/sicherheit/spec.md), [`bilder`](../../openspec/specs/bilder/spec.md), [`export`](../../openspec/specs/export/spec.md), [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [`kartenstatus`](../../openspec/specs/kartenstatus/spec.md), betrieb (Konfiguration) | [ADR 0009](../adr/0009-login-sperre-pro-benutzername.md), [ADR 0021](../adr/0021-sicherheits-header-und-cross-site-schutz.md) |
| `app/server/plugins`, `app/server/middleware` | [`preise`](../../openspec/specs/preise/spec.md), [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`sicherheit`](../../openspec/specs/sicherheit/spec.md) | [ADR 0007](../adr/0007-preis-scheduler-im-app-prozess.md), [ADR 0011](../adr/0011-editionen-als-schluessel.md) |
| `app/shared` | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`set-import`](../../openspec/specs/set-import/spec.md), [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [`kartenstatus`](../../openspec/specs/kartenstatus/spec.md), [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md) | [ADR 0004](../adr/0004-adapter-pattern-pro-spiel.md) |
| `app/prisma` | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md) | [ADR 0003](../adr/0003-postgresql-prisma.md), [ADR 0005](../adr/0005-spielattribute-als-jsonb.md), [ADR 0006](../adr/0006-texte-pro-sprache.md), [ADR 0010](../adr/0010-status-als-enum.md) |
| `app/tests` | entwicklung-release (Tests) | – |
| `app/Dockerfile`, `app/docker-entrypoint.sh`, `docker-compose*.yml`, `db/init` | [`betrieb`](../../openspec/specs/betrieb/spec.md) | [ADR 0001](../adr/0001-hosting-selbst-gehostet.md), [ADR 0016](../adr/0016-multi-arch-image-nativer-build.md), [ADR 0022](../adr/0022-container-namen-mit-prefix.md) |
| `.github/workflows`, `.github/dependabot.yml`, `Makefile` | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) | [ADR 0015](../adr/0015-semantic-release-und-versionen.md), [ADR 0016](../adr/0016-multi-arch-image-nativer-build.md), [ADR 0018](../adr/0018-main-branch-schutz.md) |
| `LICENSE`, `NOTICE` | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) | [ADR 0017](../adr/0017-lizenz-polyform-noncommercial.md) |
| `docs/` (KONZEPT, Mockups, Migrationsdokumente) | nicht abgedeckt, weil Dokumentation (Konzept als Quelle der ADRs 0001–0006, siehe K-019) | – |
| `CHANGELOG.md` | nicht abgedeckt, weil von semantic-release erzeugt (Spec `entwicklung-release` › Automatische Releases) | [ADR 0015](../adr/0015-semantic-release-und-versionen.md) |

## 3. Inventareinträge

Abgedeckt: **166**; nicht oder nur teilweise abgedeckt (mit Begründung): **5** von 171 Einträgen mit R-/D-Nummer. Die Konflikte K-001…K-021 und die Chat-Belege stehen in `00-inventory.md`, die geänderten Anforderungen in `history.md`, die offenen Fragen in `OPEN-QUESTIONS.md`.

| ID | Kurzbeschreibung (aus dem Inventar) | Abgedeckt in |
|---|---|---|
| D-001 | Hosting Variante 1 (Pi, intern/VPN, DB lokal) statt Supabase/extern | [ADR 0001](../adr/0001-hosting-selbst-gehostet.md) |
| D-002 | Nuxt (TypeScript, Vue, Nitro) als eine Codebasis für UI und API | [ADR 0002](../adr/0002-nuxt-vue-nitro-eine-codebasis.md) |
| D-003 | Tailwind CSS + Nuxt UI | [ADR 0002](../adr/0002-nuxt-vue-nitro-eine-codebasis.md) |
| D-004 | Prisma als ORM | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0003](../adr/0003-postgresql-prisma.md) |
| D-005 | PostgreSQL 16 (JSONB, arm64) | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0003](../adr/0003-postgresql-prisma.md) |
| D-006 | Adapter-Pattern pro Kartenspiel mit Registry | [ADR 0004](../adr/0004-adapter-pattern-pro-spiel.md) |
| D-007 | Spielspezifische Attribute als JSONB in `cards.game_specific_attributes` | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0005](../adr/0005-spielattribute-als-jsonb.md) |
| D-008 | Eigenes Login mit Session-Cookie ersetzt die frühere Idee eines `/admin`-Pfads mit nginx-Basic-Auth | [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| D-009 | PDF-Export mit pdfkit (kein Headless-Chromium) | [ADR 0013](../adr/0013-csv-export-serverseitig.md) |
| D-010 | Bestehenden nginx weiterverwenden (kein neuer Proxy-Container) | [`betrieb`](../../openspec/specs/betrieb/spec.md), [ADR 0001](../adr/0001-hosting-selbst-gehostet.md) |
| D-011 | Status als sprachneutrales Enum, in der UI übersetzt | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0010](../adr/0010-status-als-enum.md) |
| D-012 | Sprachabhängige Texte in `card_translations` (Zeile je Karte+Sprache), `cards.name` = Anzeigename | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0006](../adr/0006-texte-pro-sprache.md) |
| D-013 | Namen/Texte/Attribute schreibgeschützt; `manual_overrides` entfernt; `card_sets` Set-Code+Edition als einzige … | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0006](../adr/0006-texte-pro-sprache.md) |
| D-014 | Editionen als Schlüssel (`FIRST_EDITION`, `LIMITED_EDITION`), Unlimited = NULL | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0011](../adr/0011-editionen-als-schluessel.md) |
| D-015 | Preise in Quellwährung gespeichert, Umrechnung beim Lesen | [ADR 0012](../adr/0012-preise-in-quellwaehrung.md) |
| D-016 | Nuxt-4-Standardlayout (`app/app/`) | [ADR 0002](../adr/0002-nuxt-vue-nitro-eine-codebasis.md) |
| D-017 | Spielverhalten pro Druck in `shared/utils/game-config.ts` konfiguriert | [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md), [ADR 0004](../adr/0004-adapter-pattern-pro-spiel.md) |
| D-018 | Releases: nur Minor/Patch, Major nur bei ausdrücklichem Breaking Change; Start bei 0.1.0 | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0015](../adr/0015-semantic-release-und-versionen.md) |
| D-019 | Major-Updates von Node/PostgreSQL/TypeScript bewusst ignoriert | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0015](../adr/0015-semantic-release-und-versionen.md) |
| D-020 | Lizenzwechsel von AGPL v3 auf PolyForm Noncommercial 1.0.0 | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0017](../adr/0017-lizenz-polyform-noncommercial.md) |
| D-021 | Dienste sind framework-unabhängige Fabriken (`createXService(deps)`); die Nitro-Schicht ist dünn | [ADR 0002](../adr/0002-nuxt-vue-nitro-eine-codebasis.md) |
| D-022 | Sitzung als versiegeltes Cookie (h3), nicht in der Datenbank | [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| D-023 | Passwort-Hash mit `node:crypto` scrypt, selbstbeschreibendes Format | [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| D-024 | Login-Sperre in-memory pro Benutzername statt pro IP (hinter Proxy kommen alle von derselben Adresse) | [ADR 0009](../adr/0009-login-sperre-pro-benutzername.md) |
| D-025 | Wechselkurse nur im Speicher gehalten, nicht in der Datenbank | [ADR 0012](../adr/0012-preise-in-quellwaehrung.md) |
| D-026 | Preis-Scheduler als Nitro-Plugin im App-Prozess, Zustand in der Datenbank | [ADR 0007](../adr/0007-preis-scheduler-im-app-prozess.md) |
| D-027 | CSV mit Semikolon, UTF-8+BOM, `\r\n`; Zahlen mit Punkt | [ADR 0013](../adr/0013-csv-export-serverseitig.md) |
| D-028 | Export serverseitig (alle Seiten, gleiche Filterlogik wie Liste) statt im Browser | [ADR 0013](../adr/0013-csv-export-serverseitig.md) |
| D-029 | Filterung und Sortierung der Übersicht im Speicher über alle Treffer (Level/Preis nicht per DB sortierbar; Sam… | [ADR 0014](../adr/0014-uebersicht-im-speicher-filtern.md) |
| D-030 | Roh-SQL für `prices_checked_at`, damit `last_modified_at` unberührt bleibt | [`preise`](../../openspec/specs/preise/spec.md) |
| D-031 | Schriften lokal (`@fontsource/ibm-plex-sans`), keine Google-Fonts-Aufrufe | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) |
| D-032 | Kein Telemetrie/Update-Check in Containern (`CHECKPOINT_DISABLE`, `PRISMA_HIDE_UPDATE_MESSAGE`, `NUXT_TELEMETR… | [`betrieb`](../../openspec/specs/betrieb/spec.md) |
| D-033 | Multi-Stage-Build: Abhängigkeiten und Build auf der Plattform des Builders (`$BUILDPLATFORM`), da das Nitro-Bü… | [ADR 0016](../adr/0016-multi-arch-image-nativer-build.md) |
| D-034 | Adapter melden Preise in der Währung der Quelle; Umrechnung nur bei Anzeige | [ADR 0012](../adr/0012-preise-in-quellwaehrung.md) |
| D-035 | Entscheid des Assistenten, vom Benutzer nicht beanstandet (Herkunft: Abgeleitet); erklärt K-001/K-003 | [ADR 0002](../adr/0002-nuxt-vue-nitro-eine-codebasis.md), [ADR 0010](../adr/0010-status-als-enum.md) |
| D-036 | Pokémon-Kartendaten von TCGdex (kostenlos, kein API-Key, REST) | [ADR 0023](../adr/0023-kartendatenquellen-ygoprodeck-tcgdex.md) |
| D-037 | Entscheid: `main` geschützt mit Admin-Ausnahme für den Release-Workflow (Herkunft: Abgeleitet; Benutzer hat um… | [ADR 0018](../adr/0018-main-branch-schutz.md) |
| D-038 | `players` und `users` zu einer Tabelle zusammengeführt | [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| D-039 | Abweichung vom Vorschlag des Benutzers, nicht beanstandet (Herkunft: Abgeleitet); siehe D-022, D-023 | [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| D-040 | Entscheid des Assistenten (Abgeleitet) | nicht abgedeckt, weil Gestaltungsdetail des Assistenten (Farben aus Nuxt UI, eigene Variablen in `main.css`) ohne Anforderung des Benutzers |
| D-041 | Feste Container-Namen mit Präfix `CONTAINER_PREFIX` | [ADR 0022](../adr/0022-container-namen-mit-prefix.md) |
| D-042 | Gemerkter Zustand im Browser über Cookies: letztes Spiel beim Erfassen (`cardkeeper-last-game`), Spiel der Übe… | [ADR 0020](../adr/0020-gemerkter-zustand-in-cookies.md) |
| D-043 | Sicherheits-Header auf jeder Antwort und Schutz vor schreibenden Cross-Site-Anfragen (`Sec-Fetch-Site`) | [ADR 0021](../adr/0021-sicherheits-header-und-cross-site-schutz.md) |
| D-044 | Yu-Gi-Oh!-Kartendaten von YGOPRODeck | [ADR 0023](../adr/0023-kartendatenquellen-ygoprodeck-tcgdex.md) |
| D-045 | Code-Kommentare und README auf Englisch | [ADR 0024](../adr/0024-englisch-fuer-code-und-doku.md) |
| D-046 | Kartenbilder lokal im Volume `card-images` speichern, nicht in der Datenbank und nicht von den Karten-DBs einb… | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0019](../adr/0019-bilder-lokal-speichern.md) |
| R-001 | Eine Sammlung für Yu-Gi-Oh! und Pokémon; weitere Spiele über ein Adapter-Interface ohne Kernschema-/UI-Änderung | [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md), [ADR 0004](../adr/0004-adapter-pattern-pro-spiel.md), [ADR 0023](../adr/0023-kartendatenquellen-ygoprodeck-tcgdex.md) |
| R-002 | Beim Erfassen wird das Spiel gewählt; die letzte Wahl wird pro Browser per Cookie gemerkt | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [ADR 0020](../adr/0020-gemerkter-zustand-in-cookies.md) |
| R-003 | Übersicht zeigt ein Spiel oder alle; beim ersten Besuch alle, danach die letzte Wahl des Browsers | [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [ADR 0020](../adr/0020-gemerkter-zustand-in-cookies.md) |
| R-004 | Spielspezifische Filter (YGO: Kartentyp, Typ, Attribut, Seltenheit, Level-Bereich; Pokémon: Kategorie, Typ, St… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-005 | Hell/Dunkel: folgt dem Gerät (hell, wenn das Gerät nichts sagt); Umschalter hell/dunkel/System im Header, im B… | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) |
| R-006 | Übersicht mit Filtern für Status, Besitzer, Kartentyp, Monstertyp, Attribut, Seltenheit, Level-Bereich; Dropdo… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-007 | Nach dem Login steht der Besitzerfilter auf dem angemeldeten Benutzer (Standard); „Alle Besitzer“ steht als `o… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-008 | Filter, Sortierung und Seite bleiben beim Wechsel in eine Karte und zurück erhalten, bis zum nächsten Login/Lo… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-009 | Aus der Übersicht geöffnete Karte lässt sich in der Reihenfolge der Übersicht durchblättern (zurück/weiter, Um… | [`karten-blaettern`](../../openspec/specs/karten-blaettern/spec.md) |
| R-010 | Suchfeld findet Namen in jeder Sprache, Set-Code und Set-Name | [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-011 | Sortierung nach zuletzt hinzugefügt, Name, Level, Kaufdatum, Preis (auf-/absteigend); Karten ohne Wert immer z… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-012 | Gesamtwert der aktiven Karten in der Übersicht | [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-013 | CSV-Export der Auswahl der Übersicht (alle Treffer, Sortierung, beliebiger Besitzer/Status), alle Daten ohne B… | [`export`](../../openspec/specs/export/spec.md), [ADR 0013](../adr/0013-csv-export-serverseitig.md) |
| R-014 | Detailseite: Texte in Deutsch/Englisch (Pokémon auch Japanisch) mit Sprachumschalter, Deutsch zuerst, nicht vo… | [`karte-detail`](../../openspec/specs/karte-detail/spec.md) |
| R-015 | Set-Code (immer Grossbuchstaben) und Edition sind korrigierbar und gelten für alle Sprachen; Namen, Texte und … | [`karte-detail`](../../openspec/specs/karte-detail/spec.md) |
| R-016 | Manueller Bild-Upload; Bild vergrössern (Klick schliesst, Seitenbereiche und Pfeiltasten blättern, Download-Kn… | [`bilder`](../../openspec/specs/bilder/spec.md) |
| R-017 | Statusverwaltung (aktiv, verkauft, getauscht, verschenkt, verloren) mit Datum und Gegenpartei | [`kartenstatus`](../../openspec/specs/kartenstatus/spec.md) |
| R-018 | Der Besitzer kann die Karte an einen anderen Benutzer übergeben | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md) |
| R-019 | Preisverlauf auf der Detailseite | [`preise`](../../openspec/specs/preise/spec.md) |
| R-020 | YGO „Ganzes Set“: Wizard (Set wählen, Sprache der Karten wählen, prüfen, hinzufügen); nur unklare Karten müsse… | [`set-import`](../../openspec/specs/set-import/spec.md) |
| R-021 | Pokémon „Ganzes Set“: gleicher Ablauf; unklar ist nur die Variante; eine Variante für das ganze Set wählbar; V… | [`set-import`](../../openspec/specs/set-import/spec.md) |
| R-022 | „Von API aktualisieren“ erneuert Texte, Attribute und Preise; Set-Code, Edition, Status, Besitzer, Kaufdatum, … | [`karte-detail`](../../openspec/specs/karte-detail/spec.md) |
| R-023 | „Karte hinzufügen“: Suche nach Name oder Passcode inkl. genauem Druck (Set, Seltenheit); keine Sprachwahl: ers… | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md) |
| R-024 | YGO: Suche nach Set-Code eines Drucks (`LOB-EN005`); Code anderer Sprache ohne Treffer wird mit englischem Cod… | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md) |
| R-025 | YGO Edition (1. Auflage, Limitierte Auflage) als Ein-Klick-Wahl neben dem Druck; nichts gewählt = Unlimited (n… | [`karte-detail`](../../openspec/specs/karte-detail/spec.md), [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [ADR 0011](../adr/0011-editionen-als-schluessel.md) |
| R-026 | „ß“/„ss“-Äquivalenz in Suche (YGO/Pokémon-Namenssuche, Pokémon-Set-Filter, Suche in der Sammlung) | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-027 | Kartenbilder werden einmal heruntergeladen und lokal auf einem Volume gespeichert, nie gehotlinkt | [`bilder`](../../openspec/specs/bilder/spec.md), [ADR 0019](../adr/0019-bilder-lokal-speichern.md) |
| R-028 | Preise pro Marktplatz in dessen Währung gespeichert (Cardmarket EUR, TCGplayer/eBay/Amazon/CoolStuffInc USD); … | [`preise`](../../openspec/specs/preise/spec.md), [ADR 0012](../adr/0012-preise-in-quellwaehrung.md) |
| R-029 | `DISPLAY_CURRENCY`: Übersicht (Karten, Total) in dieser Währung, Detailseite beides (`CHF 0.08 (EUR 0.09)`); E… | [`waehrungsumrechnung`](../../openspec/specs/waehrungsumrechnung/spec.md), [ADR 0012](../adr/0012-preise-in-quellwaehrung.md) |
| R-030 | Geplanter Preis-Reload in kleinen Tranchen; jeder Reload erzeugt eine Preiszeile (auch bei gleichem Preis); De… | [`preise`](../../openspec/specs/preise/spec.md), [ADR 0007](../adr/0007-preis-scheduler-im-app-prozess.md) |
| R-032 | Verweigert eine Karten-DB weitere Anfragen, stoppt die Tranche, der Rest folgt in der nächsten; Fehlgeschlagen… | [`preise`](../../openspec/specs/preise/spec.md), [`set-import`](../../openspec/specs/set-import/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md) |
| R-033 | Änderungen von Benutzern kommen ins Audit-Log; die Kartenseite zeigt „geändert am“ erst, wenn ein Benutzer etw… | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`karte-detail`](../../openspec/specs/karte-detail/spec.md), [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`kartenstatus`](../../openspec/specs/kartenstatus/spec.md) |
| R-034 | Oberfläche in Deutsch und Englisch | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) |
| R-035 | Semantische Releases, Multi-Arch-Images (amd64+arm64), automatische Abhängigkeits-Updates | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0016](../adr/0016-multi-arch-image-nativer-build.md) |
| R-036 | Alles läuft in Containern; auf dem Host ist nur Docker nötig; Stack aus `db` (PostgreSQL 16, kein veröffentlic… | [`betrieb`](../../openspec/specs/betrieb/spec.md), [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0001](../adr/0001-hosting-selbst-gehostet.md), [ADR 0003](../adr/0003-postgresql-prisma.md) |
| R-037 | Konfiguration über Umgebungsvariablen in `.env` (Tabelle: `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `APP_DB_NAME… | [`betrieb`](../../openspec/specs/betrieb/spec.md), [ADR 0022](../adr/0022-container-namen-mit-prefix.md) |
| R-038 | Die App-DB-Rolle (kein Superuser) wird beim ersten Initialisieren des Datenverzeichnisses angelegt; spätere Pa… | [`betrieb`](../../openspec/specs/betrieb/spec.md), [ADR 0003](../adr/0003-postgresql-prisma.md) |
| R-039 | Eigenes Login: alle sehen alle Karten, Ändern (Daten, Status, Bilder, Refresh, Löschen) nur durch den Besitzer… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| R-040 | Benutzer über `USERS` angelegt (beim Start), Initialpasswort `cardkeeper`, erzwungene Passwortwahl beim ersten… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| R-041 | Passwort-Reset durch den Betreiber per SQL (`password_hash = NULL`); alle Logins mit dem alten Passwort enden | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| R-042 | Karten ohne Besitzer (aus der Zeit vor den Logins) sind für alle sichtbar, aber von niemandem änderbar, bis ei… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| R-043 | Schutzmassnahmen: Name 15 Min. gesperrt nach 10 Fehlversuchen; Login 30 Tage; Passwortwechsel/-reset beendet a… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| R-044 | Upgrade von einer Version ohne Logins: `SESSION_SECRET` und `USERS` ergänzen, bisherige „Spieler“ werden Benut… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`betrieb`](../../openspec/specs/betrieb/spec.md), [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| R-045 | Reverse Proxy leitet nur weiter (TLS); `client_max_body_size` etwas über `MAX_UPLOAD_MB`; `X-Forwarded-Proto` … | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`betrieb`](../../openspec/specs/betrieb/spec.md), [ADR 0008](../adr/0008-eigenes-login-versiegeltes-cookie.md) |
| R-046 | Backup von Datenbank (`pg_dump`) und Bild-Volume dokumentiert | [`betrieb`](../../openspec/specs/betrieb/spec.md) |
| R-047 | Entwicklung ohne Host-Installation (Quellen als Bind-Mount, `node_modules` im Volume); `make dev/test/lint/typ… | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) |
| R-048 | Ein Branch kann neben der echten Installation unter anderem Projektnamen getestet werden (eigene Container/Vol… | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0022](../adr/0022-container-namen-mit-prefix.md) |
| R-049 | Tests: Unit-Tests (reine Logik), Integrationstests (echte PostgreSQL, Fake-Karten-API, `TEST_DATABASE_URL`, ni… | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) |
| R-050 | CI `tests.yml`: Lint, Typecheck, alle Tests (mit PostgreSQL), Docker-Build, Compose-Validierung bei jedem PR u… | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) |
| R-051 | Releases vollautomatisch bei Push auf `main` (semantic-release): Version aus Conventional Commits, `CHANGELOG.… | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0015](../adr/0015-semantic-release-und-versionen.md) |
| R-052 | Dependabot wöchentlich (npm, Dockerfile, Compose, Actions); Produktions-Updates `chore:` (Patch-Release), Dev/… | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0015](../adr/0015-semantic-release-und-versionen.md) |
| R-053 | Pokémon-Datenmodell (`PokemonAttributes` sprachunabhängig aus der englischen Antwort, `PokemonDetails` spracha… | [`karte-detail`](../../openspec/specs/karte-detail/spec.md), [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md) |
| R-054 | Pokémon-Preise: `cardmarket` (EUR), `cardmarket-holo`, `tcgplayer-<variante>` (USD); Liste/Total nutzen `PRICE… | [`preise`](../../openspec/specs/preise/spec.md) |
| R-055 | Pokémon-Suche nach Name (Deutsch zuerst, dann Englisch) oder Karten-ID; Bilder der Trefferliste von `assets.tc… | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md) |
| R-056 | Pokémon „Nach Set und Nummer“: Sprache der Datenbank (Deutsch Standard), Nummer wie gedruckt, Set per Name/Log… | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md) |
| R-057 | Japanische Karten: eigene TCGdex-Datenbank und IDs, dritte gespeicherte Sprache, nur über Set und Nummer oder … | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md), [ADR 0023](../adr/0023-kartendatenquellen-ygoprodeck-tcgdex.md) |
| R-058 | YGO-Vorschaubild in der Suche über eigene Kopie (`/api/thumbnails/ygo/<passcode>`, höchstens 4 gleichzeitig); … | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [ADR 0019](../adr/0019-bilder-lokal-speichern.md) |
| R-059 | Karten-API-Verhalten: eine Anfrage pro Abfrage; Bilder nur von den vom Adapter deklarierten Hosts; unerwartete… | [`sicherheit`](../../openspec/specs/sicherheit/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md) |
| R-060 | Roadmap: Export als KI-Prompt-Kopie und druckbare Liste (PDF/Word); Pokémon: variantenabhängiger Listenpreis, … | [`export`](../../openspec/specs/export/spec.md) |
| R-061 | Lizenz PolyForm Noncommercial 1.0.0 (frühere Versionen AGPL v3) | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0017](../adr/0017-lizenz-polyform-noncommercial.md) |
| R-062 | Hosting: selbstgehostet auf Raspberry Pi, intern/VPN, DB lokal (Variante 1) | [`betrieb`](../../openspec/specs/betrieb/spec.md), [ADR 0001](../adr/0001-hosting-selbst-gehostet.md) |
| R-063 | Ressourcenbudget Pi 4: Nitro `node-server`, kein Cluster, `--max-old-space-size=256`, Postgres `shared_buffers… | [`betrieb`](../../openspec/specs/betrieb/spec.md) |
| R-064 | Statuswerte `aktiv`, `verkauft`, `getauscht`, `verschenkt`, `verloren`; Datum/Person nur bei verkauft/getausch… | [`kartenstatus`](../../openspec/specs/kartenstatus/spec.md) |
| R-065 | Mehrere Bilder pro Karte, lokales Volume, kein DB-Blob | [`bilder`](../../openspec/specs/bilder/spec.md) |
| R-066 | Konzept: Scheduler als eigener Node-Worker-Container (node-cron) | durch Entscheid ersetzt: Scheduler läuft im App-Prozess, siehe ADR 0007, Q-002, K-002 |
| R-067 | Konzept: Export PDF (pdfkit), CSV, Markdown | teilweise umgesetzt: CSV siehe Spec `export`; PDF und Markdown nicht umgesetzt (K-019, H-02) |
| R-068 | Konzept: regelmässiges `pg_dump`-Backup per Cron, zweiter Ort | nicht umgesetzt: nur manuelle Befehle dokumentiert, siehe Spec `betrieb` › Backup, Q-009, K-009 |
| R-070 | Login: Name wird ohne Beachtung von Gross-/Kleinschreibung und Leerzeichen gefunden; falscher Name und falsche… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [ADR 0009](../adr/0009-login-sperre-pro-benutzername.md) |
| R-071 | Sitzung: versiegeltes (verschlüsselt+signiert) Cookie `cardkeeper-session`, httpOnly, SameSite=Lax, `secure` n… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md) |
| R-072 | API-Zugriff: alles unter `/api/` braucht ein Login (401 `unauthenticated`) ausser `/api/health`, `/api/auth/lo… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md) |
| R-073 | Passwortregeln: 8–200 Zeichen, nicht (Gross-/Kleinschreibung egal) das Initialpasswort, nicht gleich dem aktue… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md) |
| R-074 | UI-Zugangsschutz: ohne Login Weiterleitung auf `/login` (mit `next`, ausser bei `/`); bei Pflicht-Passwortwech… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md) |
| R-075 | Besitzerregel: nur der Besitzer ändert/löscht/aktualisiert/bearbeitet Bilder (403 `not_card_owner`); Karten oh… | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md), [`bilder`](../../openspec/specs/bilder/spec.md) |
| R-076 | Karte anlegen: Besitzer = Anlegender; Pflicht-Druck bei Pokémon (`printing_required`); gewählter Druck muss zu… | [`bilder`](../../openspec/specs/bilder/spec.md), [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md) |
| R-077 | Karte ändern: nur Set-Code (nur wo `setCodeEditable`, sonst 400 `field_not_editable`), Edition/Variante (Pokém… | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`karte-detail`](../../openspec/specs/karte-detail/spec.md) |
| R-078 | Statusregeln: Statuswechsel hängt eine Verlaufszeile an; Korrektur von Datum/Person des aktuellen Status änder… | [`kartenstatus`](../../openspec/specs/kartenstatus/spec.md) |
| R-079 | Karte löschen: nur Besitzer; entfernt Übersetzungen, Verläufe, Bilddateien und Bild-Verzeichnis; Audit „delete… | [`karte-detail`](../../openspec/specs/karte-detail/spec.md) |
| R-080 | „Von API aktualisieren“: alle gespeicherten Sprachen neu geholt, Übersetzungen per Upsert, eine nicht mehr gel… | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`karte-detail`](../../openspec/specs/karte-detail/spec.md) |
| R-081 | Bilder: Upload leer → 400 `empty_file`, grösser als `MAX_UPLOAD_MB` → 413 `file_too_large`, Typ an der Dateisi… | [`bilder`](../../openspec/specs/bilder/spec.md) |
| R-082 | Bild-Auslieferung: ETag, `Cache-Control: private, no-cache`, `X-Content-Type-Options: nosniff`, `Content-Dispo… | [`bilder`](../../openspec/specs/bilder/spec.md), [`sicherheit`](../../openspec/specs/sicherheit/spec.md) |
| R-083 | Bild-Download aus Karten-DBs: nur HTTPS, nur vom Adapter deklarierte Hosts, begrenzte Grösse | [`sicherheit`](../../openspec/specs/sicherheit/spec.md), [ADR 0019](../adr/0019-bilder-lokal-speichern.md) |
| R-084 | Listen-API: Seite (Standard 1), Seitengrösse (Standard 48, höchstens 200), Sortierung (Standard `created`), Zu… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [ADR 0014](../adr/0014-uebersicht-im-speicher-filtern.md) |
| R-085 | Sortierregeln: deutsche Sortierung (Gross-/Kleinschreibung egal, „ä“ bei „a“, Zahlen nach Wert); Karten ohne W… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [ADR 0014](../adr/0014-uebersicht-im-speicher-filtern.md) |
| R-086 | Filtersemantik: Spiel, Status, Besitzer (ID oder `none`), Freitext (Name in jeder Sprache, Stamm-Name, ID gena… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [ADR 0014](../adr/0014-uebersicht-im-speicher-filtern.md) |
| R-087 | Facetten-Endpunkt: unterschiedliche Werte der Sammlung (YGO: Kartentyp, Monstertyp, Attribut; Pokémon: Kategor… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md) |
| R-088 | Nachbarn-Endpunkt `GET /api/cards/:id/neighbors`: gleiche Filter/Sortierung wie die Liste; Vorgänger/Nachfolge… | [`karten-blaettern`](../../openspec/specs/karten-blaettern/spec.md) |
| R-089 | Übersichts-URL-Zustand: ohne `owner` gilt der angemeldete Benutzer, `owner=all` alle, `owner=none` ohne Besitz… | [`karten-blaettern`](../../openspec/specs/karten-blaettern/spec.md), [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [ADR 0020](../adr/0020-gemerkter-zustand-in-cookies.md) |
| R-090 | Detailseite beim Blättern: bei ungeänderten Daten direkt; bei ungespeicherten Änderungen Rückfrage (Speichern/… | [`karten-blaettern`](../../openspec/specs/karten-blaettern/spec.md) |
| R-091 | Beschreibungsfeld der Detailseite wächst mit dem Text von 3 bis höchstens 6 Zeilen, dann scrollt es | [`karte-detail`](../../openspec/specs/karte-detail/spec.md) |
| R-092 | CSV-Export im Detail: Spaltenreihenfolge (Spiel, Name, Set-Code, Edition/Variante, Set, Seltenheit, Externe ID… | [`export`](../../openspec/specs/export/spec.md), [ADR 0013](../adr/0013-csv-export-serverseitig.md) |
| R-093 | Export-Dialog in der Übersicht: Menü „Exportieren“ mit „CSV-Export“ (aktiv) und zwei deaktivierten Platzhalter… | [`export`](../../openspec/specs/export/spec.md), [ADR 0013](../adr/0013-csv-export-serverseitig.md) |
| R-094 | Preis-Reload-Umsetzung: Plugin prüft 60 s nach dem Start und danach alle 10 Minuten, ob eine Tranche fällig is… | [`preise`](../../openspec/specs/preise/spec.md), [ADR 0007](../adr/0007-preis-scheduler-im-app-prozess.md) |
| R-096 | Wechselkurs-Dienst: ein Kurs je Währungspaar, beim ersten Bedarf, danach einmal je UTC-Tag, nur im Speicher (f… | [`waehrungsumrechnung`](../../openspec/specs/waehrungsumrechnung/spec.md), [ADR 0012](../adr/0012-preise-in-quellwaehrung.md) |
| R-097 | Umrechnung in Listen/Details: Karten-Preis als `converted` (nur wo ein Kurs bekannt und die Währung abweicht);… | [`waehrungsumrechnung`](../../openspec/specs/waehrungsumrechnung/spec.md), [ADR 0012](../adr/0012-preise-in-quellwaehrung.md) |
| R-098 | Set-Import-Regeln (Wizard): Zeile bereit, wenn der Druck klar ist (nur ein Druck, oder die gewählte Variante k… | [`set-import`](../../openspec/specs/set-import/spec.md) |
| R-099 | Set-Browser-API: `GET /api/sets`, `GET /api/sets/:id`, `GET /api/sets/:id/import`; Antworten sechs Stunden zwi… | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md) |
| R-100 | Vorschaubilder für YGO: eigener Download einmal pro Karte (nur numerische Passcodes), höchstens 4 gleichzeitig… | [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [ADR 0019](../adr/0019-bilder-lokal-speichern.md) |
| R-101 | Start des Containers: Banner im Log (Version aus dem Build, „Release image“ bzw. „Local build“, Node-Version, … | [`betrieb`](../../openspec/specs/betrieb/spec.md) |
| R-102 | Health-Endpunkt `GET /api/health` (nur mit erreichbarer Datenbank 200) und Docker-`HEALTHCHECK` | [`betrieb`](../../openspec/specs/betrieb/spec.md) |
| R-103 | Container-Härtung und Ressourcen: App als Benutzer `node`, `no-new-privileges`, alle Capabilities entfernt, Da… | [`betrieb`](../../openspec/specs/betrieb/spec.md) |
| R-104 | Beim Start wird gemeldet, welche Editionswerte keiner bekannten Taste entsprechen (`[editions] …` mit SQL-Vors… | [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [ADR 0011](../adr/0011-editionen-als-schluessel.md) |
| R-105 | Oberfläche: Standardsprache Deutsch, Sprachwahl in der Kopfzeile, Cookie `cardkeeper_locale`, keine Sprachpräf… | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) |
| R-106 | Sicherheit der Antworten: jede Antwort mit `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referr… | [`sicherheit`](../../openspec/specs/sicherheit/spec.md), [ADR 0021](../adr/0021-sicherheits-header-und-cross-site-schutz.md) |
| R-107 | Fehlerübersetzung: API-Fehler tragen einen stabilen Code; die UI übersetzt ihn (`errors.<code>`), unbekannt = … | [`karte-detail`](../../openspec/specs/karte-detail/spec.md), [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) |
| R-108 | Plugin-Architektur: Dienste zentral (`createServices`), Abhängigkeiten injiziert (Datenbank, Registry, Konfigu… | [ADR 0002](../adr/0002-nuxt-vue-nitro-eine-codebasis.md) |
| R-109 | Sprache der Adapter: YGO speichert Deutsch+Englisch (Standard `en`), Pokémon Deutsch+Englisch+Japanisch; Anzei… | [`karte-detail`](../../openspec/specs/karte-detail/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md), [ADR 0006](../adr/0006-texte-pro-sprache.md) |
| R-201 | Anforderung: Code-Kommentare und README auf Englisch (User-Vorgabe, aktiv) | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0024](../adr/0024-englisch-fuer-code-und-doku.md) |
| R-202 | Arbeitsweise: Rückfragen vor der Ausführung (User-Vorgabe, aktiv) | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) |
| R-203 | Hinweis auf Referenz-Repos für Workflows/Release (User-Vorgabe; nur Quelle für D-018/D-035) | [ADR 0015](../adr/0015-semantic-release-und-versionen.md) |
| R-204 | Umfang der ersten Version (User-Vorgabe); später erweitert, siehe history | nicht abgedeckt, weil nur der Umfang der ersten Version; Verlauf steht in `history.md` H-02 (Specs bilden den letzten gültigen Stand ab) |
| R-205 | Betriebswissen (Abgeleitet), siehe README §Releases | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0015](../adr/0015-semantic-release-und-versionen.md) |
| R-206 | Arbeitsweise: sprechende Branch-Namen (User-Vorgabe, aktiv) | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) |
| R-207 | UI: keine Textmarke „änderbar“ an editierbaren Feldern (User-Vorgabe, aktiv) | [`karte-detail`](../../openspec/specs/karte-detail/spec.md) |
| R-208 | Anforderung: sprachunabhängige, einheitliche Filterwerte (User-Vorgabe); Umsetzung: Attribute stets aus der en… | [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [ADR 0006](../adr/0006-texte-pro-sprache.md) |
| R-209 | Es gibt keinen Admin-Bereich in der App (User-Vorgabe, aktiv) | [`benutzer-zugriff`](../../openspec/specs/benutzer-zugriff/spec.md) |
| R-210 | Entscheid: kein Beitragshinweis/CLA in der Lizenz-Änderung (verworfen); Herkunft User-Vorgabe | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0017](../adr/0017-lizenz-polyform-noncommercial.md) |
| R-211 | Kopfzeile bleibt beim Seitenwechsel stabil; Suchfeld nur in der Übersicht (User-Vorgabe, aktiv) | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) |
| R-212 | Kein Layout-Sprung beim Öffnen von Dropdowns/Dialogen (User-Vorgabe, aktiv); Ursache doppelter Scrollbalken-Au… | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) |
| R-213 | Anforderung: ein YGO-Treffer lädt nur YGO-Bilder, ein Pokémon-Treffer nur TCGdex-Bilder (User-Vorgabe); Ursach… | [`bilder`](../../openspec/specs/bilder/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md) |
| R-214 | App-Symbole (`favicon.ico` 16/32/48, 16er/32er PNG, Apple-Touch-Icon 180) im Verzeichnis `public/`, ohne weiss… | [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md) |
| R-215 | UI: Schrittanzeige des Wizards als nicht klickbare Liste mit nummerierten Kreisen, Haken und Hervorhebung (Use… | [`set-import`](../../openspec/specs/set-import/spec.md) |
| R-216 | Anforderung: neue Einstellungen sind optional mit Standardwerten, abschaltbar (`off`); die Änderung ist ein Mi… | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [`preise`](../../openspec/specs/preise/spec.md) |
| R-217 | Anforderung an die Arbeitsweise: Lint und Typecheck müssen auch für Tests laufen (CI, siehe R-050); Fehler lag… | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md) |
| R-218 | Anforderung aus Review (Abgeleitet), vom Benutzer nicht beanstandet; ca. 86 % Zeilenabdeckung | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [`sicherheit`](../../openspec/specs/sicherheit/spec.md), [ADR 0021](../adr/0021-sicherheits-header-und-cross-site-schutz.md) |
| R-219 | verworfen/zurückgestellt (User-Vorgabe): nicht umgesetzt | [`entwicklung-release`](../../openspec/specs/entwicklung-release/spec.md), [ADR 0021](../adr/0021-sicherheits-header-und-cross-site-schutz.md) |
