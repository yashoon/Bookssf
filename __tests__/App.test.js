import React from 'react';
import {Platform} from 'react-native';
import {render, waitFor} from '@testing-library/react-native';
import SpInAppUpdates from 'sp-react-native-in-app-updates';
import App from '../App';

// FIX ("Update type unavailable" uncaught exception firing on every app
// restart in production, confirmed via a real Sentry crash log): App.js's
// in-app-update effect used to call startUpdate({updateType: FLEXIBLE})
// based only on `shouldUpdate`, and never returned/caught startUpdate()'s
// own promise. These tests cover both parts of the fix directly against the
// real App.js effect, rather than a copy of its logic - if the fix
// regresses, these fail against the actual component.
//
// The in-app-update effect (Platform.OS === 'android' gated) runs
// unconditionally on mount regardless of auth/loading state, since hooks
// run before any conditional return in App() - so there's no need to drive
// App past its "Checking login status..." screen for these to exercise it.
describe('App - in-app update handling', () => {
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'android';
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
    console.log.mockRestore();
  });

  it('does not call startUpdate when checkNeedsUpdate says FLEXIBLE is not allowed, even if shouldUpdate is true', async () => {
    const startUpdate = jest.fn(() => Promise.resolve());
    SpInAppUpdates.mockImplementationOnce(() => ({
      addStatusUpdateListener: jest.fn(),
      removeStatusUpdateListener: jest.fn(),
      checkNeedsUpdate: jest.fn(() =>
        Promise.resolve({shouldUpdate: true, isFlexibleUpdateAllowed: false}),
      ),
      startUpdate,
      installUpdate: jest.fn(),
    }));

    render(<App />);

    // Give the checkNeedsUpdate().then() chain a tick to resolve, then
    // assert it stayed resolved-but-inert rather than calling startUpdate.
    await waitFor(() => expect(SpInAppUpdates).toHaveBeenCalled());
    expect(startUpdate).not.toHaveBeenCalled();
  });

  it('calls startUpdate with FLEXIBLE only once both shouldUpdate and isFlexibleUpdateAllowed are true', async () => {
    const startUpdate = jest.fn(() => Promise.resolve());
    SpInAppUpdates.mockImplementationOnce(() => ({
      addStatusUpdateListener: jest.fn(),
      removeStatusUpdateListener: jest.fn(),
      checkNeedsUpdate: jest.fn(() =>
        Promise.resolve({shouldUpdate: true, isFlexibleUpdateAllowed: true}),
      ),
      startUpdate,
      installUpdate: jest.fn(),
    }));

    render(<App />);

    await waitFor(() =>
      expect(startUpdate).toHaveBeenCalledWith({
        updateType: SpInAppUpdates.IAUUpdateKind.FLEXIBLE,
      }),
    );
  });

  it('logs a startUpdate rejection instead of leaving it as an unhandled promise rejection', async () => {
    const startUpdateError = new Error(
      'sp-react-native-in-app-updates startUpdate error: Update type unavailable, check checkNeedsUpdate.isImmediateUpdateAllowed or checkNeedsUpdate.isFlexibleUpdateAllowed first.',
    );
    SpInAppUpdates.mockImplementationOnce(() => ({
      addStatusUpdateListener: jest.fn(),
      removeStatusUpdateListener: jest.fn(),
      checkNeedsUpdate: jest.fn(() =>
        Promise.resolve({shouldUpdate: true, isFlexibleUpdateAllowed: true}),
      ),
      startUpdate: jest.fn(() => Promise.reject(startUpdateError)),
      installUpdate: jest.fn(),
    }));

    render(<App />);

    // The whole point of returning startUpdate()'s promise into the chain
    // is that its rejection lands in the SAME .catch() as a checkNeedsUpdate
    // failure - proving that here (rather than just asserting "no crash",
    // which a genuinely unhandled rejection wouldn't necessarily produce in
    // a Jest run anyway) is what actually distinguishes the fix from the
    // original bug.
    await waitFor(() =>
      expect(console.log).toHaveBeenCalledWith(
        'In-app update check failed:',
        startUpdateError,
      ),
    );
  });

  it('never calls checkNeedsUpdate/startUpdate on iOS', async () => {
    Platform.OS = 'ios';
    const checkNeedsUpdate = jest.fn(() => Promise.resolve({shouldUpdate: false}));
    SpInAppUpdates.mockImplementationOnce(() => ({
      addStatusUpdateListener: jest.fn(),
      removeStatusUpdateListener: jest.fn(),
      checkNeedsUpdate,
      startUpdate: jest.fn(),
      installUpdate: jest.fn(),
    }));

    render(<App />);

    // Nothing async to waitFor here since the effect bails out before ever
    // constructing/using SpInAppUpdates on non-Android platforms - a short
    // flush is enough to prove it stays that way.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(checkNeedsUpdate).not.toHaveBeenCalled();
  });
});
