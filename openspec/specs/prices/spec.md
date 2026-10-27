# Prices Specification

## Purpose
Prices of the cards: storage per marketplace in its currency, price history and scheduled reload in small tranches. The scheduler runs in the app process ([ADR 0007](../../../docs/adr/0007-price-scheduler-in-app-process.md)). Conversion into a display currency: spec currency-conversion ([ADR 0012](../../../docs/adr/0012-prices-in-source-currency.md)).

## Requirements

### Requirement: Prices per marketplace in its currency
The system SHALL store prices per marketplace in the currency of that marketplace (Cardmarket EUR; TCGplayer, eBay, Amazon, CoolStuffInc USD); list and total SHALL use the marketplace of the `PRICE_SOURCE` (default `cardmarket`).
Source: User instruction 2026-10-04 10:00 (question round "source + original currency"); README §Features, §Configuration; code app/server/lib/config.ts | Origin: user requirement

#### Scenario: Source currency
- GIVEN a card with a Cardmarket price of 0.09 EUR and a TCGplayer price of 0.12 USD
- WHEN the list is shown with `PRICE_SOURCE=cardmarket`
- THEN it shows 0.09 in EUR

#### Scenario: Other source
- GIVEN `PRICE_SOURCE=tcgplayer`
- WHEN the list is shown
- THEN it shows 0.12 in USD

### Requirement: Pokémon prices
The system SHALL keep for Pokémon cards the prices `cardmarket` (EUR), `cardmarket-holo` and `tcgplayer-<variant>` (USD); list and total SHALL use `PRICE_SOURCE` for both games.
Source: User instruction 2026-10-10 22:36/22:38 ("Pokémon already implemented"); README §Pokémon | Origin: derived

#### Scenario: Pokémon price
- GIVEN a Pokémon card with a Cardmarket price
- WHEN it appears in the overview
- THEN the price of the `PRICE_SOURCE` is added to the total

### Requirement: Price history on the detail page
The system SHALL keep every loaded price row with a timestamp and show the history on the detail page.
Source: README §Features; User instruction 2026-10-10 20:40 ("document the current price even if it does not change") | Origin: user requirement

#### Scenario: History
- GIVEN a card with two price rows
- WHEN the detail page is opened
- THEN both appear with a date

### Requirement: Every reload creates a price row
The system SHALL create a new price row on every price reload, also for an unchanged price, and show "Prices last checked on" on the detail page; manually entered card data SHALL stay unchanged in the process.
Source: User instruction 2026-10-10 20:40 ("manually entered data not overwritten, only the prices"); README §Scheduled price reload | Origin: user requirement

#### Scenario: Same price
- GIVEN the price is the same as at the last reload
- WHEN the card is reloaded
- THEN another price row is created anyway

### Requirement: Cards becoming due
The system SHALL treat an active card as due when its prices are older than `PRICE_REFRESH_AFTER` (a number with `h`, `d`, `w`, `mo`; default `1w`; `off` switches it off); the setting SHALL be optional.
Source: User instruction 2026-10-10 20:58 ("not necessarily configure… switch off again"); README §Scheduled price reload; code app/server/lib/config.ts | Origin: user requirement

#### Scenario: Off
- GIVEN `PRICE_REFRESH_AFTER=off`
- WHEN the scheduler checks
- THEN no tranche is started

#### Scenario: Not due
- GIVEN a card with prices one day old and the default setting
- WHEN the scheduler checks
- THEN the card is not due

### Requirement: Tranches
The system SHALL load due cards in tranches of at most `PRICE_REFRESH_BATCH_SIZE` (default 300), oldest prices first and cards of one set together; the next tranche SHALL start at the earliest `PRICE_REFRESH_BATCH_EVERY` (default `1d`, at least `1h`) later.
Source: User instruction 2026-10-10 21:10/21:15/21:19 (default 300); README §Scheduled price reload; code app/server/lib/config.ts | Origin: user requirement

#### Scenario: Large collection
- GIVEN 1000 due cards and default values
- WHEN a tranche runs
- THEN at most 300 cards are loaded, the oldest first

### Requirement: Pause between requests
The system SHALL wait `PRICE_REFRESH_DELAY_MS` (default 500, at least 100) between two requests to a card database and refuse to start with a smaller value.
Source: README §Configuration, §Scheduled price reload; code app/server/lib/config.ts | Origin: derived

#### Scenario: Value too small
- GIVEN `PRICE_REFRESH_DELAY_MS=50`
- WHEN the application starts
- THEN it aborts with an error message

### Requirement: Limit by the card database
The system SHALL end the tranche when a card database refuses further requests; the rest SHALL follow in the next tranche, failed cards after `PRICE_REFRESH_BATCH_EVERY` again, and the limit SHALL be reported to the user.
Source: User instruction 2026-10-10 21:15 ("must go up to the user"); README §Scheduled price reload | Origin: user requirement

#### Scenario: Limit
- GIVEN the card database answers with a limit
- WHEN a tranche runs
- THEN it stops and the rest follows in the next one

#### Scenario: Message
- GIVEN the limit is reached
- WHEN a user searches or updates a card
- THEN the message appears that it should be tried again later

### Requirement: Execution in the app process
The system SHALL check 60 seconds after the start and then every 10 minutes whether a tranche is due and run it in the app process; the state is recorded in the database.
Source: User instruction 2026-10-10 20:40; decision by the user (2026-10-23: plugin in the app process applies); code app/server/plugins/price-refresh.ts; test price-refresh.test.ts | Origin: user requirement

#### Scenario: Start
- GIVEN the application was started
- WHEN 60 seconds have passed
- THEN the first check is run

### Requirement: Recording of the runs
The system SHALL record every tranche in `price_refresh_runs` with the state running, done, rate_limited, failed or interrupted and set `failed` after 3 failed requests in a row; Yu-Gi-Oh! loads 20 cards, TCGdex one card per request.
Source: Code app/server/services/prices.ts, app/server/tcg/*/adapter.ts; test price-refresh.test.ts | Origin: derived

#### Scenario: Three errors
- GIVEN three requests fail in a row
- WHEN the tranche runs
- THEN the run is recorded as `failed`

### Requirement: "Modified on" stays untouched
The system SHALL set `prices_checked_at` through raw SQL on the price reload, so that "modified on" of the card is not changed.
Source: Code app/server/services/prices.ts; test price-refresh.test.ts | Origin: derived

#### Scenario: Reload
- GIVEN a card with "modified on" from the previous day
- WHEN its prices are reloaded
- THEN "modified on" stays unchanged
