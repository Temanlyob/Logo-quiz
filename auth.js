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
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Save user to Firestore if first login
async function createUserDocument(user) {

  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {

    await setDoc(ref, {
      uid: user.uid,
      username: user.displayName || "User",
      email: user.email,
      photoURL: user.photoURL || "",
      totalScore: 0,
      puzzlesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      currentStreak: 0,
      bestStreak: 0,
      createdAt: serverTimestamp()
    });

  }

}

export {
  auth,
  db,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  createUserDocument
};
