import { auth, db, googleProvider } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Create or Update Firestore User Document
async function createUserDocument(user, username = null) {

  if (!user) return false;

  try {

    const userRef = doc(db, "users", user.uid);

    await setDoc(
  userRef,
  {
    uid: user.uid,
    username: username || user.displayName || "User",
    email: user.email || "",
    photoURL: user.photoURL || "",
    createdAt: serverTimestamp()
  },
  { merge: true }
);

    return true;

  } catch (err) {

    console.error("Firestore Error:", err);
    throw err;

  }

}

export {
  auth,
  db,
  googleProvider,

  createUserDocument,

  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
};
