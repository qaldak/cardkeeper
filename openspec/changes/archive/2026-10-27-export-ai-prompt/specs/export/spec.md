# Spec Delta

## MODIFIED Requirements

### Requirement: Menu "Export" in the overview
The system SHALL offer a menu "Export" (German: "Exportieren") in the toolbar of the overview next to the sort order; the entries "CSV export" and "Copy for AI" each open a dialog.
Source: User instruction 2026-10-22 11:26, 11:46, 11:53 (placement confirmed); 2026-10-27 (entry "Copy for AI"); code app/app/pages/index.vue | Origin: user requirement

#### Scenario: Menu
- GIVEN the overview
- WHEN "Export" is opened
- THEN "CSV export" and "Copy for AI" appear as active entries

### Requirement: Planned functions as placeholders
The system SHALL show "Print list (coming)" in the menu as an entry that cannot be chosen; it is not implemented yet and its content is deliberately not defined yet.
Source: User instruction 2026-10-21 19:10, 2026-10-22 11:53, 2026-10-27; README §Roadmap; code app/app/pages/index.vue | Origin: user requirement

#### Scenario: Placeholder
- GIVEN the menu is open
- WHEN "Print list (coming)" is clicked
- THEN nothing happens, the entry is disabled
