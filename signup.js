import {
  auth,
  googleProvider,
  createUserDocument,
  createUserWithEmailAndPassword,
  signInWithPopup
} from "./auth.js";

// ------------------------------
// Email Sign Up
// ------------------------------

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

    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await createUserDocument(result.user, username);

    window.location.replace("home.html");

  } catch (err) {

    console.error(err);
    alert(err.message);

  }

});

// ------------------------------
// Google Sign Up
// ------------------------------

const googleSignup = document.getElementById("googleSignup");

googleSignup.addEventListener("click", async () => {

  try {

    const result = await signInWithPopup(auth, googleProvider);

    await createUserDocument(result.user);

    window.location.replace("home.html");

  } catch (err) {

    console.error(err);
    alert(err.message);

  }

});
