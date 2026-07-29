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

    // Create Authentication account
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = result.user;

    alert("Auth Account Created");
    alert("UID:\n" + user.uid);

    // Save Firestore document
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

    alert("Firestore Saved Successfully");

    window.location.href = "home.html";

  } catch (err) {

    console.error(err);

    alert("ERROR CODE:\n" + err.code);
    alert("ERROR MESSAGE:\n" + err.message);

  }

});

// ------------------------------
// Google Sign Up
// ------------------------------

const googleSignup = document.getElementById("googleSignup");

googleSignup.addEventListener("click", async () => {

  try {

    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;

    alert("Google Login Success");
    alert("UID:\n" + user.uid);

    await createUserDocument(user);

    alert("Firestore Saved Successfully");

    window.location.href = "home.html";

  } catch (err) {

    console.error(err);

    alert("ERROR CODE:\n" + err.code);
    alert("ERROR MESSAGE:\n" + err.message);

  }

});
