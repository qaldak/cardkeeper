# ADR 0002: Nuxt (Vue, Nitro) mit Nuxt UI und Tailwind als eine Codebasis für Oberfläche und API

- **Status:** Akzeptiert (Nuxt 4 statt des im Konzept genannten Nuxt 3)
- **Datum:** 2026-10-03 (Konzept); Abweichung Nuxt 4: 2026-10-04
- **Herkunft:** User-Vorgabe (Konzept des Benutzers; vom Benutzer am 2026-10-23 bestätigt). Die Abweichungen Nuxt 4 und Node 24 stammen vom Assistenten, der Benutzer hat sie nicht beanstandet (Chat 2026-10-04 10:43).
- **Specs:** [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md), [`betrieb`](../../openspec/specs/betrieb/spec.md)

## Kontext

Das Konzept verlangt „ein Codebase für UI + API-Routen (Nitro), moderner Look, passt zu vorhandener Vue-Erfahrung“ und „schnelle, konsistente, einsteigerfreundliche Komponenten statt Admin-Grid-Optik“.

## Entscheid

Nuxt (TypeScript, Vue 3, Nitro) für Oberfläche und API-Routen, Tailwind CSS mit Nuxt UI für die Komponenten. Umgesetzt mit Nuxt 4 (Standardlayout `app/app/`) und Node 24; das Konzept nannte Nuxt 3 und `node:20-alpine`.

## Betrachtete Alternativen

nicht dokumentiert (das Konzept nennt nur die Wahl und ihre Begründung).

## Konsequenzen

- Eine Codebasis, ein Container-Image für UI und API.
- Die Dienste sind framework-unabhängige Fabriken (`createXService(deps)`), die Nitro-Schicht bleibt dünn.
- Konzept und Umsetzung weichen bei Nuxt-Version und Node-Version ab.

## Quellen

- `docs/KONZEPT.md` §Tech-Stack
- `README.md` §Architecture, §Data model (Nuxt-4-Standardlayout)
- Chat 2026-10-04 10:43 (Abweichungen vom Konzept)
- `app/package.json`
