# Design

## Context

The CSV export already loads the cards of a selection in the order of the overview (`orderedIds`, then `db.card.findMany` in chunks of 300 with translations) and builds columns from the stored attributes (`app/server/services/export.ts`, `GET /api/export/cards`). The attributes of both games are stored in English and language independent (`cards.game_specific_attributes`); the language-dependent texts (rules text, attacks, abilities) are in `card_translations`. The dialog of the CSV export (`ExportDialog.vue`) receives the summary of the selection from `index.vue`. See proposal.md for the motivation and `specs/export-ai-prompt/spec.md` for the behaviour.

## Goals / Non-Goals

**Goals:**
- One text per selection that an AI can use directly, small enough to paste (one line per distinct card).
- Reuse the selection, the order and the card loading of the CSV export.
- A dialog that shows what will be copied before it is copied.

**Non-Goals:**
- The banlist of Yu-Gi-Oh! (not stored; the introduction asks the AI to respect it).
- A second language or a JSON format; the CSV stays the machine-readable export.
- Any restriction by owner (the selection is used as it is).
- The print list.

## Decisions

**1. The server builds the text, the dialog fetches it once per change of the options.**
`GET /api/export/ai` takes the filters and the sort order of the list plus `onlyActive`, `withText`, `intro` and `wish`, and answers JSON with `text`, `fileName`, `total` and `distinct`. The dialog requests it when it opens and when an option changes (with a short delay for the wish) and shows the text as the preview. *Copy* and *Download* use the text that is already there, so no request is needed inside the click.
*Alternative:* build the text in the browser from the list API. Rejected: it needs every page, repeats the filter logic that exists on the server, and the order of the overview would have to be rebuilt ([ADR 0014](../../../docs/adr/0014-overview-filtering-in-memory.md)).
*Alternative:* answer `text/plain` and fetch on click. Rejected: browsers may refuse the clipboard write after an awaited request, and the dialog could not show a preview and the size.

**2. Merging key and order.**
Cards are merged by game and card number (`external_id`); a card without a card number (entered manually) is merged by its English name. The quantity counts the selected cards (after "only active cards"). A line appears at the position of the first card of its group in the order of the overview.

**3. Content comes from the stored data; English comes from the English translation.**
Yu-Gi-Oh! lines use `type`, `race`, `attribute`, `level`, `atk`, `def`, `scale`, `linkval`, `linkmarkers`, `archetype` of the attributes (the stored value `-1` is written as "?"). Pokémon lines use the English attributes (`category`, `stage`, `types`, `hp`, `retreat`, `regulationMark`, `legal`) and, for weakness, resistance, attacks and abilities, the details of the English translation. Name and text come from the English translation; the German name is added when the German translation has a different name. If a card has no English translation (a Japanese-only Pokémon card), the first available translation is used.
Pokémon lines for attributes do not need the localisation of the CSV export (`pokemon.type.*`), because the attributes are English already.

**4. One line per card, an optional second line for the text, one section per game.**
Format (example):

```
3x Dark Magician (DE: Dunkler Magier) [46986414] | Normal Monster | DARK Spellcaster | Lv7 | ATK 2500 / DEF 2100 | Archetype: Dark Magician
   Text: The ultimate wizard in terms of attack and defense.
2x Pikachu ex [sv08-057] | Pokémon · Basic · Lightning | HP 200 | Retreat 1 | Weak: Fighting ×2 | Mark H | Standard legal
   Attack [L L] Thunderbolt 90: Discard all Energy from this Pokémon.
```

Each game gets a heading "<Game> – N distinct cards (M total)". Text is flattened to one line (as in the CSV export).

**5. Introduction and wish.**
The introduction is a fixed English text in the server (not translated, because the output is English): what the data are, that the quantities are the cards of the player, the three-copy rule and the banlist for Yu-Gi-Oh!, the format legality for Pokémon, and the wish of the user when given. The wish is limited to 500 characters and sent in the query string; it is written into the text as it is and nowhere else.

**6. Size estimate.**
The dialog shows the number of characters and an estimate of tokens as characters divided by four. It is a rough indication, labelled "about".

**7. Dialog and menu.**
A new component `AiExportDialog.vue` next to `ExportDialog.vue` takes the same selection summary from `index.vue`. The menu entry `export.menu.ai` loses `disabled`. Copy uses `navigator.clipboard.writeText` and falls back to selecting the preview text and `document.execCommand('copy')` (see risks). Download creates a text file in the browser from the text already fetched.

**8. No new ADR.**
The decisions are about one feature and stay inside the existing architecture (server-side export, [ADR 0013](../../../docs/adr/0013-csv-export-server-side.md)); they are recorded in the spec and in this design, which are archived with the change.

## Risks / Trade-offs

- [The clipboard API works only in a secure context; the app is often used over plain http inside the home network] → fall back to `execCommand('copy')` on the selected preview, and keep the download button as the second way; show a hint when copying fails.
- [A large collection with card text can reach tens of thousands of tokens] → the option "include card text" and the size estimate; the preview shows only the beginning.
- [Merging by card number mixes prints of different strength, for example different Pokémon sets of the same card name] → Pokémon card IDs are per print (`sv08-057`), so reprints appear as separate lines with the same name; the AI sees both. Accepted.
- [Stored legality and regulation marks become outdated after a rotation] → the introduction asks the AI to check the format; the data show the state at the last update from the API.
- [The wish is free text in a URL] → limited to 500 characters; the app does not store it.

## Open Questions

- Whether the number of tokens should be estimated per model (the divisor four is an approximation) can be decided after the first use; it changes only the label in the dialog.
