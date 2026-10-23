# Offene Fragen

Jede Unsicherheit wird hier festgehalten, bevor sie gestellt wird. Format:

```
### Q-007 – Status: OFFEN
- Betrifft: <Datei/Domain › Requirement oder ADR>
- Frage: <eine präzise Frage, möglichst mit 2–4 Antwortoptionen>
- Evidenz: <was in Chat/README/Code dafür oder dagegen spricht>
- Arbeitsannahme bis zur Antwort: <Annahme>
- Antwort: <leer>
- Beantwortet am: <leer>
```

Status: OFFEN | BEANTWORTET.

---

### Q-001 – Status: OFFEN
- Betrifft: Spec `uebersicht` › Requirement „Suche über alle Sprachen“; K-020; R-010
- Frage: Welche konkrete Karte und welcher Suchbegriff haben beim Bug „Suche findet nur DE“ nicht getroffen (2026-10-21)? Optionen: (a) Karte war von einem anderen Besitzer (Besitzerfilter seit 0.20.0 standardmässig auf dem eigenen Benutzer), (b) Spiel-Registerkarte/anderer Filter aktiv, (c) englische Übersetzung der Karte fehlt in `card_translations`, (d) Akzentunterschied (z. B. „Pokémon“ vs. „pokemon“).
- Evidenz: Chat 2026-10-21 04:40 (Bug, Anforderung bestätigt: alle Sprachen, Filter berücksichtigt); Assistent: Code durchsucht `cards.name` und alle `card_translations.name`, Browser-Test und Test `applies the other filters to a search in any language` bestanden, Fehler nicht reproduziert; Benutzer antwortete mit „Ok.“ und neuer Anforderung, ohne den Fall zu nennen.
- Arbeitsannahme bis zur Antwort: Die Anforderung „Suche in allen Sprachen, zusätzliche Filter gelten“ ist erfüllt; der gemeldete Fall war kein Fehler der Sprachlogik.
- Antwort:
- Beantwortet am:

### Q-002 – Status: OFFEN
- Betrifft: Spec `preise` › Requirement „Geplanter Preis-Reload“; ADR 0007 (Scheduler im App-Prozess); K-002
- Frage: Soll der Preis-Scheduler im App-Prozess (Nitro-Plugin, Zustand in `price_refresh_runs`) bleiben, oder soll er wie im Konzept ein eigener Container (`scheduler`, node-cron, `CRON_SCHEDULE`) werden? Optionen: (a) bleibt im App-Prozess (aktueller Stand), (b) eigener Container.
- Evidenz: KONZEPT §Komponenten/§Tech-Stack/§Deployment nennt einen Scheduler-Container; `docker-compose.yml` hat nur `db` und `app`; Chat 2026-10-10 20:40 fordert den Reload „via API… gestaffelt“, ohne den Ort festzulegen; die Umsetzung als Plugin wurde vom Assistenten gewählt und nicht beanstandet.
- Arbeitsannahme bis zur Antwort: Scheduler im App-Prozess ist der gültige Stand.
- Antwort:
- Beantwortet am:

### Q-003 – Status: OFFEN
- Betrifft: ADR 0011 (Schutz des `main`-Branches); D-037
- Frage: Wie ist der Schutz von `main` auf GitHub tatsächlich eingerichtet (Ruleset-Name, geforderte Statusprüfungen, Admin-Ausnahme für den Release-Push)? Optionen: (a) wie in der Chat-Anleitung vom 2026-10-06, (b) abweichend, bitte Einstellungen nennen.
- Evidenz: Chat 2026-10-06 14:49 (Frage des Benutzers) und 14:50 (Anleitung des Assistenten); 2026-10-07 10:51 Assistent: Release lief „auch mit dem neuen Branch-Schutz“. Die Einstellungen liegen nur auf GitHub, nicht im Repository.
- Arbeitsannahme bis zur Antwort: Schutz wie in der Anleitung beschrieben (Ruleset „Protect main“, PR nötig mit 0 Freigaben, drei Statusprüfungen, Admin-Bypass).
- Antwort:
- Beantwortet am:

### Q-004 – Status: OFFEN
- Betrifft: Spec `waehrungsumrechnung` › Requirement „Anzeigewährung“; K-012; R-029
- Frage: Was soll gelten, wenn `DISPLAY_CURRENCY` nicht gesetzt ist? Optionen: (a) Preise bleiben in der Quellwährung (EUR bei Cardmarket, USD bei TCGplayer u. a.), wie heute, (b) alle Preise werden nach EUR umgerechnet.
- Evidenz: Chat 2026-10-10 22:14: „Wenn nicht definiert, wird weiterhin EUR verwendet wie jetzt.“; Assistent 22:25: gelesen als „unverändert“, mit Bitte um Rückmeldung; Benutzer bestätigte nur die Pokémon-Umsetzung („Pokemon bereits umgesetzt. Richtig.“) und äusserte sich nicht zur Auslegung.
- Arbeitsannahme bis zur Antwort: (a): ohne Parameter bleiben die Preise in der Quellwährung.
- Antwort:
- Beantwortet am:

### Q-005 – Status: OFFEN
- Betrifft: Spec `waehrungsumrechnung` › Requirement „Wechselkurse“; K-013; R-096
- Frage: Soll bei Ausfall des Kursdienstes ein früher geholter Kurs weiterverwendet werden, oder soll immer der Originalpreis ohne Umrechnung angezeigt werden? Optionen: (a) früherer Kurs, sonst Originalpreis (aktuell), (b) sofort Originalpreis.
- Evidenz: Chat 2026-10-10 22:14: „sollte der Umrechnungskurs nicht abgefragt werden können oder fehler geben, dann… nur den Originalwert“; im Beispielcode des Benutzers: „bei Fehler lieber alter Kurs als keiner“. Assistent 22:25 wählte (a) und erklärte es; nicht beanstandet.
- Arbeitsannahme bis zur Antwort: (a).
- Antwort:
- Beantwortet am:

### Q-006 – Status: OFFEN
- Betrifft: README §Roadmap (Pokémon-Punkte, nicht in den Specs); K-018
- Frage: Sind die Pokémon-Roadmap-Punkte (variantenabhängiger Listenpreis, Blättern in den Suchergebnissen, weitere Filter Set/Illustrator/Regulationsmarke) vom Benutzer gewünscht, oder nur Vorschläge des Assistenten? Optionen: (a) gewünscht, (b) nur Idee, (c) streichen.
- Evidenz: README §Roadmap; im Chat nur als „Mögliche Optimierungen (noch nicht gemacht)“ des Assistenten (2026-10-05 19:22); keine Reaktion des Benutzers darauf.
- Arbeitsannahme bis zur Antwort: (b): nur Idee, nicht verbindlich.
- Antwort:
- Beantwortet am:

### Q-007 – Status: OFFEN
- Betrifft: ADRs 0001–0006 (Hosting, Stack, Datenmodell aus dem Konzept); K-019
- Frage: Gelten die Entscheide des Konzepts (`docs/KONZEPT.md`: Hosting Variante 1, Nuxt/Prisma/PostgreSQL, Adapter-Pattern, Datenmodell) als vom Benutzer verantwortet, soweit sie nicht später geändert wurden? Optionen: (a) ja, (b) einzelne bitte nennen.
- Evidenz: Chat 2026-10-04 09:59: Konzept als Anhang des Benutzers („Das konzept… findest du im anhang“); Kopfzeile des Dokuments „@Qaldak“; der Satz „Eine visuelle Architekturskizze… wurde im Chat gezeigt“ deutet auf eine frühere Beratung hin.
- Arbeitsannahme bis zur Antwort: (a): Entscheide des Konzepts sind User-Vorgabe, Abweichungen sind in history/ADRs vermerkt.
- Antwort:
- Beantwortet am:

### Q-008 – Status: OFFEN
- Betrifft: Spec `export` › Requirement „Geplante Funktionen“; R-060
- Frage: Welche Inhalte soll „Für KI kopieren“ haben (Feldauswahl, Beschränkung auf Status „Aktiv“, Sprache, Kartentext, Einleitung, Banlist)? Optionen: Vorschlag des Assistenten vom 2026-10-21 19:10 übernehmen (gruppiert mit Anzahl, Englisch + deutscher Name, nur aktive Karten, Einleitung wählbar) oder ändern.
- Evidenz: Chat 2026-10-21 19:10 (Anforderung „geeignet für einen AI-Prompt“) und Antwort des Assistenten mit zwei Profilen; der Benutzer hat nur das CSV-Profil beauftragt (2026-10-22 11:53).
- Arbeitsannahme bis zur Antwort: Noch nicht festgelegt; die Spec beschreibt nur den Platzhalter im Menü.
- Antwort:
- Beantwortet am:

### Q-009 – Status: OFFEN
- Betrifft: Spec `betrieb` › Requirement „Backup“; K-009
- Frage: Soll es ein automatisches Backup (z. B. Cron mit `pg_dump`, Zweitablage) geben, oder genügen die dokumentierten manuellen Befehle? Optionen: (a) nur manuell (aktuell), (b) automatisch gewünscht.
- Evidenz: KONZEPT §Sicherheitskonzept: „Regelmässiges pg_dump-Backup via Cron“; README §Backup: nur Befehle; Chat 2026-10-04 14:49–14:51: Benutzer fragt nach Volumes „für Backup“, kein Auftrag für Automatik.
- Arbeitsannahme bis zur Antwort: (a): nur manuelle Befehle.
- Antwort:
- Beantwortet am:

### Q-010 – Status: OFFEN
- Betrifft: Spec `kartenstatus` › Requirement „Status mit Datum und Person“; R-078
- Frage: Soll bei Status „verloren“ ein Datum erfasst werden? Das Konzept nennt nur „Person leer“, der Code speichert ein Datum. Optionen: (a) Datum wie bei allen Nicht-aktiv-Status (aktuell), (b) kein Datum bei „verloren“.
- Evidenz: KONZEPT §Datenmodell: „Datum und Person… nur bei verkauft, getauscht, verschenkt – bei verloren bleibt person_text leer“; Code `server/lib/status.ts`/`shared/utils/status.ts`: Datum für alle ausser aktiv; README: „with date and counterpart“.
- Arbeitsannahme bis zur Antwort: (a): Datum wird für „verloren“ erfasst, Person nicht.
- Antwort:
- Beantwortet am:
