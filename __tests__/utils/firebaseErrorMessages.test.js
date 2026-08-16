import { getFriendlyFirebaseError } from '../../utils/firebaseErrorMessages';

describe('getFriendlyFirebaseError', () => {
  it('maps known Firebase auth error codes to friendly messages', () => {
    expect(getFriendlyFirebaseError('auth/invalid-email')).toBe(
      'The email address is not valid.',
    );
    expect(getFriendlyFirebaseError('auth/user-not-found')).toBe(
      'No account found with this email.',
    );
    expect(getFriendlyFirebaseError('auth/wrong-password')).toBe(
      'Incorrect password. Please try again.',
    );
    expect(getFriendlyFirebaseError('auth/email-already-in-use')).toBe(
      'An account already exists with this email.',
    );
    expect(getFriendlyFirebaseError('auth/network-request-failed')).toBe(
      'Network error. Please check your internet connection.',
    );
  });

  it('falls back to a generic message for unknown error codes', () => {
    expect(getFriendlyFirebaseError('auth/some-new-error-code')).toBe(
      'Something went wrong. Please try again.',
    );
  });

  it('falls back to a generic message for undefined/empty input', () => {
    expect(getFriendlyFirebaseError(undefined)).toBe(
      'Something went wrong. Please try again.',
    );
    expect(getFriendlyFirebaseError('')).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
