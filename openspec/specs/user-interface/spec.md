# User Interface Specification

## Purpose
Cross-cutting characteristics of the interface: light/dark, language, page title, header and footer, stable header, error translation and app icons. Decisions: [ADR 0006](../../../docs/adr/0006-texts-per-language.md) (texts per language), [ADR 0020](../../../docs/adr/0020-remembered-state-in-cookies.md) (remembered state in cookies).

## Requirements

### Requirement: Light and dark
The system SHALL offer the interface in a light and a dark appearance; the default is "System" (follows the device, light if the device reports nothing), a switch in the header (light, dark, system) SHALL remember the choice in the browser.
Source: User instruction 2026-10-07 16:46, 17:06 ("system follows the device, if not recognised: light. Remember settings."); README (7f3d955) §Features | Origin: user requirement

#### Scenario: Device dark
- GIVEN the device reports dark and nothing was chosen
- WHEN the app is opened
- THEN it appears dark

#### Scenario: Chosen
- GIVEN the user chooses light
- WHEN they reload the page
- THEN it stays light

### Requirement: Language of the interface
The system SHALL offer the interface in German and English, default German, with a language choice in the header that is remembered in the cookie `cardkeeper_locale`; the URL SHALL manage without a language prefix.
Source: User instruction 2026-10-04 10:00 (question round "UI language": "i18n German + English"); code app/nuxt.config.ts | Origin: user requirement

#### Scenario: Switch
- GIVEN the interface is German
- WHEN English is chosen
- THEN all texts appear in English

### Requirement: Complete translations
The system SHALL keep all translation texts in both languages with the same placeholders.
Source: Code app/i18n/locales/*.json; test app/tests/unit/locales.test.ts | Origin: derived

#### Scenario: Key
- GIVEN a key in only one language
- WHEN the tests run
- THEN the locales test fails

### Requirement: Numbers and dates
The system SHALL format numbers and dates according to `de-CH` (German) or `en-GB` (English).
Source: Code app/app/composables/useFormat.ts | Origin: derived

#### Scenario: German
- GIVEN the interface is German
- WHEN a date is shown
- THEN it follows the format `de-CH`

### Requirement: Page title and footer
The system SHALL set the page title as "Cardkeeper - <page>" (e.g. "Cardkeeper - Overview") and show "Cardkeeper v<version>" in the footer.
Source: User instruction 2026-10-07 19:16 ("Cardkeeper - {page}"); code app/app/app.vue, layouts/default.vue | Origin: user requirement

#### Scenario: Overview
- GIVEN the overview is open
- WHEN the title is read
- THEN it is "Cardkeeper - Overview" (German interface: "Cardkeeper - Übersicht")

### Requirement: Stable header
The system SHALL leave the switch "Cards"/"Users" at the same place when the page changes and show the search field only in the card overview.
Source: User instruction 2026-10-07 17:18 | Origin: user requirement

#### Scenario: Users page
- GIVEN the page "Users" is open
- WHEN the header appears
- THEN the switch is at the same place and the search field is missing

### Requirement: No layout jump
The system SHALL prevent the page margin from shifting when dropdowns or dialogs are opened.
Source: User instruction 2026-10-07 17:40 | Origin: user requirement

#### Scenario: Dropdown
- GIVEN a page with a scroll bar
- WHEN a dropdown is opened
- THEN the page margin stays in place

### Requirement: Error translation
The system SHALL deliver API errors with a stable code that the interface translates through `errors.<code>`; unknown codes SHALL show a general message, the limit of the card database (`upstream_rate_limited`) an own text.
Source: User instruction 2026-10-10 21:15; code app/server/lib/errors.ts, app/app/composables/useApiError.ts; test api-errors.test.ts | Origin: derived

#### Scenario: Unknown code
- GIVEN the API delivers an unknown code
- WHEN the error is shown
- THEN the general message appears

### Requirement: Error page
The system SHALL show an error page with a back button on an error.
Source: Code app/app/error.vue | Origin: derived

#### Scenario: Error
- GIVEN an unknown page is requested
- WHEN the page appears
- THEN there is a button back

### Requirement: Local fonts
The system SHALL deliver the font IBM Plex Sans locally through `@fontsource/ibm-plex-sans` and make no Google Fonts calls.
Source: Code app/package.json, app/app/assets/css/main.css; User instruction 2026-10-04 (intermediate text of the assistant) | Origin: derived

#### Scenario: Offline
- GIVEN the page is loaded
- WHEN the font is requested
- THEN it comes from the own server

### Requirement: App icons
The system SHALL deliver a favicon (16/32/48), PNG icons (16, 32) and an Apple touch icon (180) without a white border from `public/`, also without a login.
Source: User instruction 2026-10-09 18:28, 18:32, 18:33 | Origin: user requirement

#### Scenario: Without a login
- GIVEN the user is not signed in
- WHEN `/favicon.ico` is requested
- THEN the icon is delivered
