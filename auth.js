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

  try {

    alert("createUserDocument Started");

    const ref = doc(db, "users", user.uid);

    const snap = await getDoc(ref);

    alert("Document Already Exists: " + snap.exists());

    if (!snap.exists()) {

      alert("Creating Firestore Document...");

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

      alert("Firestore Document Created");

    }

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
