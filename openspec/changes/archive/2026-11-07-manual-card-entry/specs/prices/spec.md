# Spec Delta

## ADDED Requirements

### Requirement: Cards without external ID are not reloaded
The system SHALL leave out cards without external ID (entered manually) when it selects the cards for the scheduled price reload, ask the card database nothing for them and record no error for them.
Source: User instruction 2026-11-07 ("API calls recognise manual cards and ignore errors"); code app/server/services/prices.ts (dueCards) | Origin: user requirement

#### Scenario: Manual card is due
- GIVEN an active manually entered card that was never checked
- WHEN the scheduled reload selects the cards
- THEN the card is not selected, no request is sent for it and the run records no failed card

#### Scenario: Mixed cards
- GIVEN one manual card and one card from the card database that are both due
- WHEN the reload runs
- THEN only the card from the card database is asked and updated
