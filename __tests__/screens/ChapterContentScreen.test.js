import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChapterContentScreen from '../../screens/ChapterContentScreen';
import { getDBConnection_local, getUsers, getMaxChapterId } from '../../database/Database';

// This screen's own DB-loading path is exercised elsewhere
// (__tests__/database/*.test.js) - here we only care about what
// ChapterContentScreen itself does with chapter navigation, so the data
// layer is stubbed to resolve immediately with a small fixed chapter set.
jest.mock('../../database/Database', () => ({
  getDBConnection_local: jest.fn(() => Promise.resolve({})),
  getUsers: jest.fn(() =>
    Promise.resolve([
      { id: 1, content: '<p>Chapter 1</p>' },
      { id: 2, content: '<p>Chapter 2</p>' },
      { id: 3, content: '<p>Chapter 3</p>' },
    ]),
  ),
  getMaxChapterId: jest.fn(() => Promise.resolve(3)),
}));

jest.mock('../../components/LanguageContext', () => ({
  useLanguage: () => ({ language: 'english', isLoading: false }),
}));

jest.mock('../../components/FontSizeContext/FontSizeContext', () => ({
  useFontSize: () => ({ fontSize: 16, increaseFont: jest.fn(), decreaseFont: jest.fn() }),
}));

jest.mock('../../utils/inAppReview', () => ({ maybeRequestReview: jest.fn() }));

// AppLayout (this screen's wrapper) pulls in real navigation hooks that only
// resolve inside an actual NavigationContainer/SafeAreaProvider/Tab.Navigator.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), canGoBack: () => false }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  getDBConnection_local.mockResolvedValue({});
  getUsers.mockResolvedValue([
    { id: 1, content: '<p>Chapter 1</p>' },
    { id: 2, content: '<p>Chapter 2</p>' },
    { id: 3, content: '<p>Chapter 3</p>' },
  ]);
  getMaxChapterId.mockResolvedValue(3);
});

// Mirrors what react-navigation actually does when goToChapter() calls
// navigation.navigate('ChapterContent', {...}) while already focused on this
// tab: it updates this screen's own route.params rather than mounting a new
// instance (confirmed by the "navigation.navigate not push" comments in the
// component). A plain render() with a mock `navigation` prop doesn't do that
// automatically, so each helper below reads what navigate() was actually
// called with and feeds it back in via rerender() - exactly the effect a
// real param update would have on this component.
const renderChapterScreen = (initialChapterId) => {
  const navigation = { navigate: jest.fn() };
  const utils = render(
    <ChapterContentScreen
      navigation={navigation}
      route={{ params: { chapterId: initialChapterId, language: 'english' } }}
    />,
  );

  const goTo = async (testID) => {
    fireEvent.press(utils.getByTestId(testID));
    // goToChapter() awaits saveLastReadChapter() before calling navigate() -
    // let that settle before reading the mock's call args.
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
    const lastCall = navigation.navigate.mock.calls[navigation.navigate.mock.calls.length - 1];
    const [, params] = lastCall;
    utils.rerender(
      <ChapterContentScreen navigation={navigation} route={{ params }} />,
    );
    return params;
  };

  return { ...utils, navigation, goTo };
};

describe('ChapterContentScreen - last-read-chapter tracking via next/previous', () => {
  it('saves the correct lastReadChapter after pressing Next then Previous', async () => {
    // FIX (CI flake): two full navigation round-trips (Next, then Previous),
    // each with its own waitFor + manual rerender - the heaviest test in
    // this file. Comfortably under a second locally, but slower/more
    // contended on GitHub's shared runners (plus --coverage instrumentation
    // overhead) was enough to occasionally exceed Jest's default 5000ms
    // per-test timeout there. Bumped just this test rather than the global
    // timeout, since the other two tests in this file don't need it.
    const { goTo, findByTestId } = renderChapterScreen(2);

    await findByTestId('chapter-nav-next');
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('lastReadChapter')).toBe('2'),
    );

    const nextParams = await goTo('chapter-nav-next');
    expect(nextParams.chapterId).toBe(3);
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('lastReadChapter')).toBe('3'),
    );

    const prevParams = await goTo('chapter-nav-prev');
    expect(prevParams.chapterId).toBe(2);
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('lastReadChapter')).toBe('2'),
    );
  }, 15000);

  it('FIXED: pressing Next twice rapidly (no rerender in between) advances two chapters, not one', async () => {
    const { navigation, findByTestId, getByTestId } = renderChapterScreen(1);

    await findByTestId('chapter-nav-next');
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('lastReadChapter')).toBe('1'),
    );

    // Two rapid taps, with NO rerender in between - before the fix, onPress
    // read `currentChapterId` (state, only updated once route.params flowed
    // back down) and both taps resolved to the same target. Now onPress
    // reads currentChapterIdRef.current, which goToChapter updates
    // synchronously on the first tap, so the second tap sees the
    // already-advanced value.
    fireEvent.press(getByTestId('chapter-nav-next'));
    fireEvent.press(getByTestId('chapter-nav-next'));

    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledTimes(2));

    const [, firstParams] = navigation.navigate.mock.calls[0];
    const [, secondParams] = navigation.navigate.mock.calls[1];

    expect(firstParams.chapterId).toBe(2);
    expect(secondParams.chapterId).toBe(3);

    await waitFor(async () =>
      expect(await AsyncStorage.getItem('lastReadChapter')).toBe('3'),
    );
  });

  it('a chapterId that changes via route params alone (not through these buttons) still keeps the ref/state in sync for the next press', async () => {
    const navigation = { navigate: jest.fn() };
    const { getByTestId, findByTestId, rerender } = render(
      <ChapterContentScreen
        navigation={navigation}
        route={{ params: { chapterId: 1, language: 'english' } }}
      />,
    );
    await findByTestId('chapter-nav-next');

    // Simulate landing on chapter 2 via some other screen's navigate call
    // (e.g. tapping a chapter directly in ChapterListScreen) rather than via
    // this screen's own Next/Previous buttons - goToChapter is never
    // called, so only the chapterId-watching effect updates the ref.
    rerender(
      <ChapterContentScreen
        navigation={navigation}
        route={{ params: { chapterId: 2, language: 'english' } }}
      />,
    );

    fireEvent.press(getByTestId('chapter-nav-next'));

    await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
    const [, params] = navigation.navigate.mock.calls[0];
    // Proves the ref picked up the externally-driven chapterId (2), not the
    // stale mount-time value (1) - target should be 3, not 2.
    expect(params.chapterId).toBe(3);
  });
});
