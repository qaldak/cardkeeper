# ADR 0027: Purchase date as a field with segments (`UInputDate`) instead of the date field of the browser

- **Status:** Accepted
- **Date:** 2026-11-18
- **Origin:** User requirement (User instruction 2026-11-18: an empty purchase date showed today's date and looked read-only, a placeholder like "dd.mm.yyyy" or an empty field was wanted, and a layout that does not look read-only; variant A chosen; 18.12.0026 must not be saved); the limit 1990-01-01 is an assumption of the assistant, to be confirmed.
- **Specs:** [`card-entry`](../../openspec/specs/card-entry/spec.md), [`card-detail`](../../openspec/specs/card-detail/spec.md)

## Context

The purchase date was `<input type="date">`. The browser draws it: an empty field shows "mm/dd/yyyy" in the normal text colour in Chromium (checked 2026-11-18), so it looks like a value and like the grey read-only fields; the user sees today's date there (probably Safari, not reproduced here, only Chromium is available). The look cannot be set reliably from the page.

Nuxt UI (already in use, [ADR 0002](0002-nuxt-vue-nitro-single-codebase.md)) has `UInputDate` with segments and a visible placeholder. Typing in it (checked in Chromium, 2026-11-18): "18.01.2026" and "18012026" give 18 January 2026; "180126" gives the year 0026, "18.1.2026" and "1812026" are read wrongly (the dot does not move to the next segment, a year is not completed). Out of the range of `min`/`max`, the field only marks the value.

## Decision

- The purchase date is the component `PurchaseDateInput.vue` around `UInputDate` and `UCalendar`: segments with a placeholder from the language (`de-CH`: "tt.mm.jjjj", `en-GB`: "dd/mm/yyyy"), calendar in a popover, a button to remove the date, grey without these buttons when the user cannot edit. `v-model` stays the string `YYYY-MM-DD` (empty for no date), so forms, API and server are unchanged.
- The range is 1990-01-01 to today on the device (`EARLIEST_PURCHASE_DATE`, `todayOnDevice`). The server refuses a date before 1990-01-01 with 400 `purchase_date_too_early` (in addition to `purchase_date_in_future`), but only when the date is new or changed.
- `@internationalized/date` (the date type of the field) is a direct dependency; it was already installed through Nuxt UI.

## Considered alternatives

- Text field "TT.MM.JJJJ" with an own parser: it could read all spellings, but needs parsing and validation of its own and has no calendar.
- Empty state as an action ("not given" and a button "set date"): one more click; not needed once the placeholder is visible.
- Keeping the date field of the browser and adding a hint and a button: does not change what Safari shows.
- Accepting every year: rejected by the user, a date such as 18.12.0026 must not be saved.

## Consequences

- Short inputs are not read as in a text field: "180126" is year 26 and "18.1.2026" (no leading zero) is read as 18.12.0126; both are refused, the user types the year in full and day and month with two digits. A wrong year that lies inside the range (e.g. 2062 for 2026) is not noticed.
- The status date of the card page is still the date field of the browser.
- Not checked: touch devices and Safari.

## Sources

- User instruction 2026-11-18 (problem description, variant A, validation of the year)
- Test in Chromium (Playwright) 2026-11-18: typed dates, range marking
- `app/app/components/PurchaseDateInput.vue`, `app/shared/utils/purchase-date.ts`, `app/server/lib/dates.ts`, `app/tests/unit/purchase-date.test.ts`
