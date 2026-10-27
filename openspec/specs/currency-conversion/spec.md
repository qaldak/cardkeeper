# Currency Conversion Specification

## Purpose
Display of prices in a configurable currency (e.g. CHF) in addition to the source currency, with daily rates of the European Central Bank through Frankfurter. Decision: [ADR 0012](../../../docs/adr/0012-prices-in-source-currency.md).

## Requirements

### Requirement: Display currency
The system SHALL show prices and the total of the overview in the currency set in the environment variable `DISPLAY_CURRENCY` (e.g. `CHF`) and both values on the detail page (`CHF 0.08 (EUR 0.09)`); the parameter SHALL be optional.
Source: User instruction 2026-10-10 22:14; README §Features, §Configuration; code app/server/lib/config.ts | Origin: user requirement

#### Scenario: Detail page
- GIVEN `DISPLAY_CURRENCY=CHF` and a price of 0.09 EUR
- WHEN the detail page is opened
- THEN it says "CHF 0.08 (EUR 0.09)"

#### Scenario: Overview
- GIVEN `DISPLAY_CURRENCY=CHF`
- WHEN the overview is shown
- THEN cards and total show CHF

### Requirement: Without a display currency
The system SHALL show prices unchanged in the source currency (EUR or USD) without `DISPLAY_CURRENCY` and not convert them.
Source: User instruction 2026-10-10 22:14 ("If not defined, EUR continues to be used as now"); decision by the user (2026-10-23: source currency stays); README §Features | Origin: user requirement

#### Scenario: Not set
- GIVEN `DISPLAY_CURRENCY` is not set
- WHEN a USD price is shown
- THEN it stays in USD

### Requirement: Applies to both games
The system SHALL run the conversion for Yu-Gi-Oh! and Pokémon cards in the shared service.
Source: User instruction 2026-10-10 22:36/22:38; code app/server/services/cards.ts, mappers.ts; test pokemon.test.ts | Origin: user requirement

#### Scenario: Pokémon
- GIVEN `DISPLAY_CURRENCY=CHF` and a Pokémon card with a EUR price
- WHEN the overview appears
- THEN the price is shown in CHF

### Requirement: Exchange rates
The system SHALL fetch one rate per currency pair from Frankfurter when first needed and then keep it in memory once per UTC day, shared by all users; simultaneous requests SHALL share one fetch, time limit 5 s, base URL `EXCHANGE_RATE_API_URL`.
Source: User instruction 2026-10-10 22:14; code app/server/services/rates.ts; test rates.test.ts | Origin: user requirement

#### Scenario: Second call
- GIVEN the rate EUR/CHF was fetched today
- WHEN another user opens the overview
- THEN no new fetch is made

### Requirement: Failure of the rate service
The system SHALL make no new request for 10 minutes after an error, use the rate of an earlier day on failure and show the original price without conversion if there is no such rate.
Source: User instruction 2026-10-10 22:14 ("only the original value"), 22:25; decision by the user (2026-10-23: earlier rate, otherwise original price); code app/server/services/rates.ts | Origin: user requirement

#### Scenario: Failure without a rate
- GIVEN the service is not reachable and no earlier rate is known
- WHEN a price is shown
- THEN the original price appears

### Requirement: Totals and price history
The system SHALL convert totals per original currency and combine them in the display currency (currencies without a rate remain separate summands) and convert the price history with today's rate.
Source: User instruction 2026-10-10 22:25 (decision of the assistant, not objected to); code app/server/services/cards.ts, rates.ts | Origin: derived

#### Scenario: Mixed currencies
- GIVEN cards with EUR and USD prices and rates known
- WHEN the total is calculated
- THEN one sum in the display currency appears

### Requirement: Rate not in the interface
The system SHALL NOT show the rate used.
Source: User instruction 2026-10-10 22:14 ("rate not in the UI") | Origin: user requirement

#### Scenario: Detail
- GIVEN a converted price
- WHEN the detail page appears
- THEN the rate is nowhere to be seen
