import { getFriendlyFirebaseError } from "../utils/firebaseErrorMessages";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export const signUpUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date().toISOString(),
    });
    Alert.alert("Success", "Account created successfully! {{user.email}}");
    return user;
  } catch (error) {
    console.error('Error during sign up:', error);
    throw new Error(getFriendlyFirebaseError(error.code)); // ✅ clean error
  }
};
