// firebaseErrorMessages.js
export const getFriendlyFirebaseError = (errorCode) => {
  console.log('Firebase error code:', errorCode);
    const messages = {
      "auth/invalid-email": "The email address is not valid.",
      "auth/user-disabled": "This account has been disabled. Please contact support.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "An account already exists with this email.",
      "auth/weak-password": "Password is too weak. Please enter a stronger one.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/network-request-failed": "Network error. Please check your internet connection.",
      "auth/missing-email": "Email field cannot be empty.",
      "auth/invalid-credential": "Invalid Email or Password.",
    };
    console.log('Friendly message found:', messages[errorCode]);
    return messages[errorCode] || "Something went wrong. Please try again.";
  };
  