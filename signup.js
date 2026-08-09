import {
  auth,
  googleProvider,
  createUserDocument,
  createUserWithEmailAndPassword,
  signInWithPopup
} from "./auth.js";

// =============================
// DEVICE THEME ONLY
// =============================

function applyDeviceTheme(){

    document.body.classList.remove(
        "theme-light",
        "theme-dark"
    );

    if(
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
    ){

        document.body.classList.add("theme-dark");

    }else{

        document.body.classList.add("theme-light");

    }
}

applyDeviceTheme();

const deviceTheme =
window.matchMedia(
    "(prefers-color-scheme: dark)"
);

deviceTheme.addEventListener("change", () => {

    applyDeviceTheme();

});

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
