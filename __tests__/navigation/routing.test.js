import { getInitialRouteName } from '../../navigation/routing';

describe('getInitialRouteName', () => {
  it('sends first-time users (no language set) to the Language tab', () => {
    expect(
      getInitialRouteName({ hasLanguageSet: false, lastReadChapter: null }),
    ).toBe('Language');
  });

  it('sends first-time users to Language even if a stale lastReadChapter exists', () => {
    // Regression guard for the original bug: a leftover AsyncStorage value
    // must never bypass first-time language selection.
    expect(
      getInitialRouteName({ hasLanguageSet: false, lastReadChapter: 42 }),
    ).toBe('Language');
  });

  it('resumes the last-read chapter when a language is set and a chapter exists', () => {
    expect(
      getInitialRouteName({ hasLanguageSet: true, lastReadChapter: 7 }),
    ).toBe('ChapterContent');
  });

  it('falls back to Sections when a language is set but nothing has been read yet', () => {
    expect(
      getInitialRouteName({ hasLanguageSet: true, lastReadChapter: null }),
    ).toBe('Sections');
  });

  it('treats lastReadChapter 0 as "nothing read yet" (falsy chapter id)', () => {
    expect(
      getInitialRouteName({ hasLanguageSet: true, lastReadChapter: 0 }),
    ).toBe('Sections');
  });
});
