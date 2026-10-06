/** Name of the cookie that remembers the game a browser chose last when adding a card. */
export const LAST_GAME_COOKIE = 'cardkeeper-last-game'

/**
 * The game that is preselected when adding a card: the one chosen last in this browser, as long as it is still
 * registered, otherwise the first registered game. Empty when there is no game at all.
 */
export function initialGame(slugs: readonly string[], lastChosen: string | null | undefined): string {
  return (lastChosen && slugs.includes(lastChosen) ? lastChosen : slugs[0]) ?? ''
}
