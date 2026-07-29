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

// Save user to Firestore
async function createUserDocument(user) {

  try {

    alert("Before setDoc");

    await setDoc(doc(db, "users", user.uid), {
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

    alert("After setDoc");

  } catch (err) {

    console.error(err);

    alert("ERROR CODE:\n" + err.code);
    alert("ERROR MESSAGE:\n" + err.message);

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
