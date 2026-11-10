// LoginScreen pulls in the Firebase Web SDK's auth functions directly
// (signInWithEmailAndPassword, sendPasswordResetEmail, etc.) rather than
// through database/firebaseConfig.js's own init, and Google Sign-In - none
// of which is relevant to what's being tested here (the Forgot Password
// confirmation flow), so both are stubbed to plain jest.fn()s.
jest.mock('../../database/firebaseConfig', () => ({
  auth: {},
}));
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
  signInWithCredential: jest.fn(),
}));

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import LoginScreen from '../../screens/LoginScreen';

const renderScreen = () =>
  render(<LoginScreen navigation={{ navigate: jest.fn() }} />);

// Alert.alert is native and never actually shows anything under Jest, so
// tests drive it by grabbing the buttons array from the most recent call and
// invoking the onPress of whichever button they mean to "press".
const pressAlertButton = (buttonText) => {
  const lastCall = Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1];
  const buttons = lastCall[2] || [];
  const button = buttons.find((b) => b.text === buttonText);
  button?.onPress?.();
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

// FIX ("add a decision box asking whether the user wants to proceed with
// sending the forgot-password link, or not"): previously
// handleForgotPassword sent the reset email immediately once the email
// field validated, then (briefly) via a custom styled Modal. This is now a
// native Alert.alert Cancel/Send confirmation - the actual send only
// happens from the alert's own "Send" button.
describe('LoginScreen - Forgot Password confirmation', () => {
  it('does not send anything yet for an empty email - just shows the existing inline validation error', () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('forgot-password-link'));

    expect(getByText('Email is required to send reset link!')).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('does not send anything yet for an invalid email - just shows the existing inline validation error', () => {
    const { getByTestId, getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'not-an-email');
    fireEvent.press(getByTestId('forgot-password-link'));

    expect(getByText('Enter a valid email')).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('shows a Cancel/Send confirmation dialog for a valid email WITHOUT sending yet', () => {
    const { getByTestId, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'jason@example.com');
    fireEvent.press(getByTestId('forgot-password-link'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Reset Password',
      'Send a password reset email to jason@example.com?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Send' }),
      ]),
    );
    // The whole point of this fix: reaching this point must not have sent
    // anything - only pressing the dialog's own "Send" button (below)
    // should.
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends the reset email only after the user presses Send in the dialog', async () => {
    sendPasswordResetEmail.mockResolvedValueOnce();
    const { getByTestId, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'jason@example.com');
    fireEvent.press(getByTestId('forgot-password-link'));
    pressAlertButton('Send');

    await waitFor(() =>
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'jason@example.com',
      ),
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      'Password Reset Sent',
      'A reset link was sent to jason@example.com',
    );
  });

  it('does not send anything when Cancel is pressed instead', () => {
    const { getByTestId, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'jason@example.com');
    fireEvent.press(getByTestId('forgot-password-link'));
    pressAlertButton('Cancel');

    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('surfaces a send failure as the existing inline firebase error, without crashing', async () => {
    sendPasswordResetEmail.mockRejectedValueOnce(new Error('Network error'));
    const { getByTestId, getByPlaceholderText, findByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'jason@example.com');
    fireEvent.press(getByTestId('forgot-password-link'));
    pressAlertButton('Send');

    expect(await findByText('Network error')).toBeTruthy();
  });
});
