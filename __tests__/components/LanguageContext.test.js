import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider, useLanguage } from '../../components/LanguageContext';

const wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>;

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('LanguageProvider / useLanguage', () => {
  it('starts in a loading state and resolves to isFirstTime when nothing is stored', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.language).toBeNull();
    expect(result.current.isFirstTime).toBe(true);
    expect(result.current.hasLanguageSet).toBe(false);
    expect(result.current.needsLanguageSelection).toBe(true);
  });

  it('loads a previously-selected supported language from storage', async () => {
    await AsyncStorage.setItem('selectedLanguage', 'telugu');

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.language).toBe('telugu');
    expect(result.current.isFirstTime).toBe(false);
    expect(result.current.hasLanguageSet).toBe(true);
    expect(result.current.needsLanguageSelection).toBe(false);
  });

  it('treats an unsupported/corrupted stored language as no language set, and clears it', async () => {
    await AsyncStorage.setItem('selectedLanguage', 'klingon');

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.language).toBeNull();
    expect(result.current.isFirstTime).toBe(true);
    expect(await AsyncStorage.getItem('selectedLanguage')).toBeNull();
  });

  it('changeLanguage rejects unsupported languages without touching state', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.setLanguage('klingon');
      }),
    ).rejects.toThrow('Unsupported language');

    expect(result.current.language).toBeNull();
  });

  it('changeLanguage persists and updates state for a supported language', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setLanguage('hindi');
    });

    expect(result.current.language).toBe('hindi');
    expect(result.current.hasLanguageSet).toBe(true);
    expect(await AsyncStorage.getItem('selectedLanguage')).toBe('hindi');
  });

  it('resetLanguage clears storage and flips back to first-time state', async () => {
    await AsyncStorage.setItem('selectedLanguage', 'english');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(result.current.language).toBe('english'));

    await act(async () => {
      await result.current.resetLanguage();
    });

    expect(result.current.language).toBeNull();
    expect(result.current.isFirstTime).toBe(true);
    expect(await AsyncStorage.getItem('selectedLanguage')).toBeNull();
  });
});
