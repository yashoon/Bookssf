// navigation/routing.js
//
// Pure helper pulled out of TabNavigator so the initial-route decision (the
// logic that fixed the "stuck on Checking Language settings" first-launch
// bug) can be unit tested without pulling in React Navigation, AsyncStorage,
// or any native module. Keep this function free of side effects.

/**
 * Decide which tab TabNavigator should land on when it first mounts.
 *
 * - No language selected yet -> always send the user to the Language tab,
 *   regardless of any stale lastReadChapter value in storage.
 * - Language selected + a last-read chapter exists -> resume reading.
 * - Language selected + no last-read chapter -> Sections (browse first).
 *
 * @param {{ hasLanguageSet: boolean, lastReadChapter: number | null }} params
 * @returns {'Language' | 'ChapterContent' | 'Sections'}
 */
export const getInitialRouteName = ({ hasLanguageSet, lastReadChapter }) => {
  if (!hasLanguageSet) {
    return 'Language';
  }
  return lastReadChapter ? 'ChapterContent' : 'Sections';
};
