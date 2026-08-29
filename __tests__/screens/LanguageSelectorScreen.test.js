import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import { LanguageProvider } from '../../components/LanguageContext';
import LanguageSelectorScreen from '../../screens/LanguageSelectorScreen';
import { getDBConnection_local } from '../../database/Database';

// LanguageSelectorScreen calls this directly to perform a download. The real
// implementation goes through ensureDatabaseExists -> axios/RNFS.downloadFile
// -> SQLite.openDatabase, which is exercised separately in
// __tests__/database/*.test.js. Here we only care about what
// LanguageSelectorScreen itself does once a download resolves, so it's
// mocked to just resolve immediately.
jest.mock('../../database/Database', () => ({
  getDBConnection_local: jest.fn(() => Promise.resolve({})),
}));

// AppLayout (rendered as this screen's wrapper) pulls in real navigation
// hooks that only work inside an actual NavigationContainer/SafeAreaProvider.
// Stubbed to plain values since this test isn't exercising AppLayout itself.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), canGoBack: () => false }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
// LanguageSelectorScreen calls this directly; it only resolves to a real
// value inside an actual Tab.Navigator (see the comment above its usage in
// the component).
jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 0,
}));

const wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>;

const renderScreen = (navigation = { navigate: jest.fn() }) =>
  render(<LanguageSelectorScreen navigation={navigation} />, { wrapper });

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  // Default: nothing downloaded yet. Individual tests override per-path.
  RNFS.exists.mockResolvedValue(false);
});

describe('LanguageSelectorScreen - Download button behavior', () => {
  it('first-time user (no language set): tapping Download also selects that language and navigates to Sections', async () => {
    // FIX (CI flake): this is the first test in the file, paying the cold
    // -start cost of the initial LanguageProvider mount + checkAllLanguages
    // effect. Comfortably under a second locally, but GitHub's shared
    // ubuntu-latest runners are slower and --coverage adds Istanbul
    // instrumentation overhead on top - enough to occasionally exceed
    // Jest's default 5000ms per-test timeout there. Bumped just this test
    // rather than the global timeout, since nothing else needs it.
    const navigation = { navigate: jest.fn() };
    const { getByTestId, findByText, unmount } = renderScreen(navigation);

    // Wait for the initial "checking download status" pass to finish and
    // the language list to render.
    await findByText('English');

    await act(async () => {
      fireEvent.press(getByTestId('download-button-english'));
    });

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('Sections', { language: 'english' }),
    );

    expect(getDBConnection_local).toHaveBeenCalledWith('english');
    expect(await AsyncStorage.getItem('selectedLanguage')).toBe('english');
    unmount();
  }, 15000);

  it('returning user (language already set): tapping Download on another language only downloads it, does not switch, and prompts the user to tap to switch', async () => {
    // Seed an existing selection (English) before the screen mounts.
    await AsyncStorage.setItem('selectedLanguage', 'english');
    // English's file exists on disk; Hindi's does not yet.
    RNFS.exists.mockImplementation((path) => Promise.resolve(path.includes('english')));

    const navigation = { navigate: jest.fn() };
    const { getByTestId, findByText, findByTestId, unmount } = renderScreen(navigation);

    await findByText('हिन्दी');

    await act(async () => {
      fireEvent.press(getByTestId('download-button-hindi'));
    });

    // Downloaded, but the active language must stay English.
    expect(getDBConnection_local).toHaveBeenCalledWith('hindi');
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('selectedLanguage')).toBe('english'),
    );
    expect(navigation.navigate).not.toHaveBeenCalledWith(
      'Sections',
      expect.objectContaining({ language: 'hindi' }),
    );

    // User is told they still need to tap to actually switch to it.
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: expect.stringContaining('हिन्दी'),
      }),
    );
    await findByTestId('switch-button-hindi');
    unmount();
  });
});
