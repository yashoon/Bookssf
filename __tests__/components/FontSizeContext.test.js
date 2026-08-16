import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FontSizeProvider,
  useFontSize,
} from '../../components/FontSizeContext/FontSizeContext';

const wrapper = ({ children }) => <FontSizeProvider>{children}</FontSizeProvider>;

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('FontSizeProvider / useFontSize', () => {
  it('defaults to font size 16 when nothing is stored', async () => {
    const { result } = renderHook(() => useFontSize(), { wrapper });

    expect(result.current.fontSize).toBe(16);
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('fontSize')).toBe('16'),
    );
  });

  it('loads a previously-saved font size from storage', async () => {
    await AsyncStorage.setItem('fontSize', '22');

    const { result } = renderHook(() => useFontSize(), { wrapper });

    await waitFor(() => expect(result.current.fontSize).toBe(22));
  });

  it('increaseFont bumps the size by 2 and persists it', async () => {
    const { result } = renderHook(() => useFontSize(), { wrapper });
    await waitFor(() => expect(result.current.fontSize).toBe(16));

    act(() => {
      result.current.increaseFont();
    });

    expect(result.current.fontSize).toBe(18);
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('fontSize')).toBe('18'),
    );
  });

  it('decreaseFont drops the size by 2 down to a floor of 10 (inclusive)', async () => {
    await AsyncStorage.setItem('fontSize', '12');
    const { result } = renderHook(() => useFontSize(), { wrapper });
    await waitFor(() => expect(result.current.fontSize).toBe(12));

    act(() => {
      result.current.decreaseFont();
    });
    expect(result.current.fontSize).toBe(10);

    // Further decreases below 10 should be no-ops.
    act(() => {
      result.current.decreaseFont();
    });
    expect(result.current.fontSize).toBe(10);
  });
});
