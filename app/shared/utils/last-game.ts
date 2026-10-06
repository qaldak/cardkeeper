/** Name of the cookie that remembers the game a browser chose last when adding a card. */
export const LAST_GAME_COOKIE = 'cardkeeper-last-game'

/**
 * The game that is preselected when adding a card: the one chosen last in this browser, as long as it is still
 * registered, otherwise the first registered game. Empty when there is no game at all.
 */
export function initialGame(slugs: readonly string[], lastChosen: string | null | undefined): string {
  return (lastChosen && slugs.includes(lastChosen) ? lastChosen : slugs[0]) ?? ''
}

/** Name of the cookie that remembers the game (or all games) the overview showed last. */
export const OVERVIEW_GAME_COOKIE = 'cardkeeper-overview-game'
/** The value for "all games" in the url and the cookie. */
export const ALL_GAMES = 'all'

/**
 * The game the overview shows: the one in the url, else the one chosen last in this browser, else all games
 * (`undefined`). A game that is not registered is ignored. With only one game there is nothing to choose, so that
 * game is shown (and its filters are available).
 */
export function overviewGame(
  slugs: readonly string[],
  fromUrl: string | null | undefined,
  lastChosen: string | null | undefined,
): string | undefined {
  if (slugs.length <= 1) {
    return slugs[0]
  }
  for (const choice of [fromUrl, lastChosen]) {
    if (choice === ALL_GAMES) {
      return undefined
    }
    if (choice && slugs.includes(choice)) {
      return choice
    }
  }
  return undefined
}
