import {
  auth,
  googleProvider,
  createUserDocument,
  signInWithEmailAndPassword,
  signInWithPopup
} from "./auth.js";

// ------------------------------
// Email Login
// ------------------------------

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {

    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const created = await createUserDocument(result.user);

if (!created) {
  alert("Failed to create user profile.");
  return;
}

window.location.replace("home.html");
  } catch (err) {

    console.error(err);
    alert(err.message);

  }

});

// ------------------------------
// Google Login
// ------------------------------

const googleBtn = document.getElementById("googleLogin");

googleBtn.addEventListener("click", async () => {

  try {

    const result = await signInWithPopup(auth, googleProvider);

    await createUserDocument(result.user);

    window.location.replace("home.html");

  } catch (err) {

    console.error(err);
    alert(err.message);

  }

});
