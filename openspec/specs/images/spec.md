# Images Specification

## Purpose
Card images: local storage, upload, main image, enlargement and delivery. Images are never embedded from the card databases, except the small images of the result list for Pokémon. Decision: [ADR 0019](../../../docs/adr/0019-store-images-locally.md).

## Requirements

### Requirement: Images are loaded once and stored locally
The system SHALL load the image of a card once from the card database when the card is created, store it on the volume `card-images` and never link the card to a foreign image.
Source: README (7f3d955) §Features, §Notes on the card API; tests cards.test.ts, api-calls.test.ts | Origin: derived

#### Scenario: Own copy
- GIVEN a card was created with an API image
- WHEN the card is shown
- THEN the image comes from `/api/images/<id>` of the app

### Requirement: A missing API image does not prevent creation
The system SHALL create a card even when the image download fails.
Source: Test cards.test.ts (does not block creation when the image download fails) | Origin: derived

#### Scenario: Download fails
- GIVEN the image source answers with an error
- WHEN a card is created
- THEN the card is created without an image

### Requirement: Images of the right game
The system SHALL ask only YGOPRODeck for images of a Yu-Gi-Oh! card and only TCGdex for a Pokémon card, and a card SHALL keep its own image.
Source: User instruction 2026-10-08 17:52 (wrong image in the test); test api-calls.test.ts | Origin: user requirement

#### Scenario: Mixed collection
- GIVEN one card of each game
- WHEN both are created
- THEN each image comes from the database of its game

### Requirement: Several images, one main image
The system SHALL allow several images per card, make the first image the main image, leave an API image as the main image on a later upload and allow changing the main image.
Source: KONZEPT §Datenmodell; code server/services/images.ts; test images.test.ts | Origin: derived

#### Scenario: First upload
- GIVEN a card without an image
- WHEN an image is uploaded
- THEN it becomes the main image

#### Scenario: API image present
- GIVEN a card with an API image
- WHEN an image is uploaded
- THEN the API image stays the main image

#### Scenario: Change
- GIVEN a card with two images
- WHEN the second one is made the main image
- THEN only the second is primary

### Requirement: Uploads are checked
The system SHALL reject an upload that is empty (400 `empty_file`), larger than `MAX_UPLOAD_MB` (413 `file_too_large`, default 5) or not a PNG, JPEG or WebP (400 `unsupported_image`); the type is recognised from the file signature, not from the reported type.
Source: Code server/services/images.ts, server/lib/image-files.ts, server/api/cards/[id]/images.post.ts; tests images.test.ts, image-files.test.ts | Origin: derived

#### Scenario: Wrong type
- GIVEN a text file with the extension `.png`
- WHEN it is uploaded
- THEN the system rejects it with `unsupported_image`

#### Scenario: Too large
- GIVEN a file over the limit
- WHEN it is uploaded
- THEN the system rejects it with 413

### Requirement: Image actions take effect at once
The system SHALL save uploading, changing the main image and deleting an image at once (without another "Save"), record them in the change log and count them as a change by the user; only the owner may perform them.
Source: User instruction 2026-10-07 18:51; code server/services/images.ts; tests images.test.ts, ownership.test.ts | Origin: derived

#### Scenario: Upload
- GIVEN an owner uploads an image
- WHEN the upload is finished
- THEN there is an audit entry and the card shows "modified on"

### Requirement: Deleting promotes the next image
The system SHALL make the oldest remaining image the main image when the main image is deleted and remove the image file.
Source: Code server/services/images.ts; test images.test.ts | Origin: derived

#### Scenario: Main image deleted
- GIVEN a card with two images
- WHEN the main image is deleted
- THEN the other becomes the main image and the file is gone

### Requirement: Delivery with revalidation
The system SHALL deliver images with ETag, `Cache-Control: private, no-cache`, `X-Content-Type-Options: nosniff` and a file name after the card name (`inline`), so that the browser checks on every request whether it is still the same image.
Source: User instruction 2026-10-07 17:48, 2026-10-08 18:08 (cache); code server/api/images/[id]/index.get.ts | Origin: user requirement

#### Scenario: Repeated request
- GIVEN a browser already has the image
- WHEN it requests it with a matching `If-None-Match`
- THEN the system answers with 304

#### Scenario: Save as
- GIVEN the image of a card "Dunkler Magier"
- WHEN it is saved in the browser
- THEN the suggested name is "Dunkler Magier.webp"

### Requirement: Enlargement in a dialog
The system SHALL enlarge an image in a dialog that closes with a click on the image, Esc or the cross, switches between several images with large arrow areas and the arrow keys, shows the image number and has a download button; the context menu of the image SHALL be preserved.
Source: User instruction 2026-10-07 17:18, 17:48; README (7f3d955) §Features; code app/app/pages/cards/[id].vue | Origin: user requirement

#### Scenario: Click on the image
- GIVEN the dialog is open
- WHEN the image is clicked
- THEN the dialog closes

#### Scenario: Right click
- GIVEN the dialog is open
- WHEN the image is right-clicked
- THEN the dialog stays open and the browser menu "Save image as" appears

### Requirement: Image placeholder
The system SHALL show a placeholder "Bild" (German interface) for a card without an image and, for card database images that are missing, fall back to the next format and otherwise show an empty box of the same size.
Source: Code app/app/components/RemoteImage.vue, app/app/components/CardTile.vue; test image-fallback.test.ts | Origin: derived

#### Scenario: Card without an image
- GIVEN a card without an image
- WHEN the overview is shown
- THEN the image area contains the text "Bild"
