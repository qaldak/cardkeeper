# ADR 0012: Store prices in the source currency, convert on display; rates only in memory

- **Status:** Accepted
- **Date:** 2026-10-04 and 2026-10-10
- **Origin:** User requirement (question round "currency" 2026-10-04 10:00 and request for CHF 2026-10-10 22:14). The interpretations "without `DISPLAY_CURRENCY` the source currency stays" and "on failure an earlier rate, otherwise the original price" were confirmed by the user on 2026-10-23; converting the price history with today's rate is a decision of the assistant, not objected to.
- **Specs:** [`currency-conversion`](../../openspec/specs/currency-conversion/spec.md), [`prices`](../../openspec/specs/prices/spec.md)

## Context

The mockups showed prices in CHF, YGOPRODeck delivers only USD and EUR (Cardmarket, TCGplayer, eBay, Amazon). On 2026-10-10 22:14 the user requested the additional display in CHF with a daily rate, on error only the original value, the rate not in the interface.

## Decision

Prices stay in the currency of their marketplace in the database. An optional `DISPLAY_CURRENCY` shows them additionally converted. The rates (ECB through Frankfurter) are fetched when first needed, kept in memory once per UTC day and shared by all users. On failure the rate of an earlier day applies, otherwise the original price; the price history is converted with today's rate.

## Considered alternatives

- "Convert EUR→CHF" (question round 2026-10-04, not chosen).
- "Display currency through an env variable" (question round 2026-10-04, not chosen; introduced after all on 2026-10-10 in addition to the source currency).
- Storing rates in the database: not documented.

## Consequences

- The conversion changes no stored prices.
- A restart empties the rate cache; the first call fetches a rate again.

## Sources

- User instruction 2026-10-04 10:00 (question round "currency"), 2026-10-10 22:14, 22:25, 22:36/22:38
- `README.md` §Features, §Data model
- `app/server/services/rates.ts`
