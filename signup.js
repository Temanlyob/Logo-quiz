import {
  auth,
  db,
  googleProvider,
  createUserDocument,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged
} from "./auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "home.html";
  }
});

const form = document.getElementById("signupForm");

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (password !== confirm) {
    alert("Passwords do not match.");
    return;
  }

  try {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {

      uid: user.uid,
      username: username,
      email: email,
      photoURL: "",
      totalScore: 0,
      puzzlesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      currentStreak: 0,
      bestStreak: 0,
      createdAt: serverTimestamp()

    });

    window.location.href = "home.html";

  } catch (err) {

    alert(err.message);

  }

});

// ------------------------------
// Google Sign Up
// ------------------------------

const googleSignup =
document.getElementById("googleSignup");

googleSignup.addEventListener("click", async () => {

  try {

    const result =
      await signInWithPopup(auth, googleProvider);

    const user = result.user;

    await createUserDocument(user);

    window.location.href = "home.html";

  } catch (err) {

    alert(err.message);

  }

});
