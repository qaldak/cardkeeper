# Paging Through Cards Specification

## Purpose
Paging between the cards of the current overview selection on the detail page (previous/next, also with the arrow keys). The selection (filters, sort order) travels in the address of the card. Overview: `overview`; detail page: `card-detail`.

## Requirements

### Requirement: Context in the address
The system SHALL pass the filters and sort order of the overview in the address of a card when it is opened (`nav=1` and the parameters), so that the detail page knows the order of the overview; a card without `nav=1` (direct link, new card) shows no paging.
Source: User instruction 2026-10-21 11:00, 11:02 (URL is fine); code shared/utils/overview-query.ts | Origin: user requirement

#### Scenario: From the overview
- GIVEN a selection sorted by name
- WHEN a card is opened
- THEN the address contains `nav=1`, owner, game, sort order and direction

#### Scenario: Direct link
- GIVEN an address without `nav=1`
- WHEN the card is opened
- THEN no paging buttons appear

### Requirement: Previous and next with wrap-around
The system SHALL offer "previous" and "next" with the position ("3 / 120") on the detail page, in the order of the overview selection, showing the first card after the last and the last before the first; with only one card both buttons are not active.
Source: User instruction 2026-10-21 11:00, 11:02 (wrap-around); code server/services/cards.ts (neighbors); test cards.test.ts | Origin: user requirement

#### Scenario: Wrap-around
- GIVEN the last card of the selection
- WHEN "next" is clicked
- THEN the first card appears

#### Scenario: Previous at the start
- GIVEN the first card of the selection
- WHEN "previous" is clicked
- THEN the last card appears

### Requirement: Neighbours interface
The system SHALL offer `GET /api/cards/<id>/neighbors` with the same filters and the same sort order as the list and deliver position, count, predecessor, successor and the overview page of the card, and `position: null` for a card outside the selection.
Source: Code server/api/cards/[id]/neighbors.get.ts, server/services/cards.ts; test cards.test.ts | Origin: derived

#### Scenario: Outside
- GIVEN a card no longer matches the filters
- WHEN its neighbours are requested
- THEN `position` is null, without predecessor and successor

#### Scenario: Page
- GIVEN page size 2 and the card at position 3
- WHEN the page is requested
- THEN it is page 2

### Requirement: Question on unsaved changes
The system SHALL ask when paging with unsaved changes in the form whether to save (save, discard, cancel), and after "save" switch only on success.
Source: User instruction 2026-10-21 11:02 (3.a); code app/app/pages/cards/[id].vue | Origin: user requirement

#### Scenario: Discard
- GIVEN changed, unsaved fields
- WHEN "next" is clicked and "discard" is chosen
- THEN the page switches without saving

#### Scenario: Cancel
- GIVEN changed fields
- WHEN "cancel" is chosen
- THEN the card stays open

### Requirement: Back to the overview on the page of the card
The system SHALL lead "To the overview" to the overview page on which the current card lies, with the filters and sort order of the selection.
Source: User instruction 2026-10-21 11:02 (5. ok); code app/app/pages/cards/[id].vue (overviewLink) | Origin: user requirement

#### Scenario: Paged on
- GIVEN the user paged to a card on page 3
- WHEN "To the overview" is clicked
- THEN the overview shows page 3 with the same filters

### Requirement: Arrow keys page
The system SHALL use ← and → for paging on a card opened from the overview, except with the image zoom open (there they switch the image), with focus in a field or a list, with a dialog open or with a modifier key (Alt, Ctrl, Meta, Shift); without `nav=1` they do nothing.
Source: User instruction 2026-10-21 11:46, 11:48; code app/app/pages/cards/[id].vue (onArrowKey) | Origin: user requirement

#### Scenario: Key in a field
- GIVEN the cursor is in the set code field
- WHEN ← is pressed
- THEN only the cursor moves

#### Scenario: Image zoom
- GIVEN the image zoom is open
- WHEN → is pressed
- THEN the image changes and not the card
