// authService.js pulls in the real firebaseConfig.js (auth/db instances),
// which in turn needs firebase/auth + firebase/firestore. jest.setup.js
// already stubs those globally, but only with the functions firebaseConfig
// itself calls — signUpUser needs a couple more (createUserWithEmailAndPassword,
// doc, setDoc), so we override both modules locally in this file with a
// superset that covers both firebaseConfig's needs and authService's.
jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({})),
  getAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  createUserWithEmailAndPassword: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(),
}));

import {Alert} from 'react-native';
import {createUserWithEmailAndPassword} from 'firebase/auth';
import {setDoc} from 'firebase/firestore';
import {signUpUser} from '../../database/authService';

describe('signUpUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Real Alert.alert is a no-op in RN's jest preset already, but spying
    // lets us assert it was actually called (and with what) below.
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('creates the auth user, writes a users/{uid} Firestore doc, shows a success alert, and resolves with the user', async () => {
    const fakeUser = {uid: 'abc123', email: 'jason@example.com'};
    createUserWithEmailAndPassword.mockResolvedValue({user: fakeUser});

    const result = await signUpUser('jason@example.com', 'password123');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'jason@example.com',
      'password123',
    );
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({email: fakeUser.email}),
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      expect.stringContaining('Account created successfully'),
    );
    expect(result).toBe(fakeUser);
  });

  it('throws a friendly message (and never alerts) when Firebase auth creation fails', async () => {
    createUserWithEmailAndPassword.mockRejectedValue({
      code: 'auth/email-already-in-use',
    });

    await expect(
      signUpUser('jason@example.com', 'password123'),
    ).rejects.toThrow('An account already exists with this email.');
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('throws a friendly message (and never alerts) when the Firestore write fails', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({
      user: {uid: 'abc123', email: 'jason@example.com'},
    });
    setDoc.mockRejectedValue({code: 'auth/network-request-failed'});

    await expect(
      signUpUser('jason@example.com', 'password123'),
    ).rejects.toThrow('Network error. Please check your internet connection.');
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for an unrecognized error code', async () => {
    createUserWithEmailAndPassword.mockRejectedValue({
      code: 'some/unmapped-code',
    });

    await expect(
      signUpUser('jason@example.com', 'password123'),
    ).rejects.toThrow('Something went wrong. Please try again.');
  });
});
