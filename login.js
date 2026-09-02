import {
  auth,
  googleProvider,
  createUserDocument,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "./auth.js";

// =============================
// DEVICE THEME
// =============================

function applyDeviceTheme(){

  document.body.classList.remove(
    "theme-light",
    "theme-dark"
  );

  document.body.classList.add(
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "theme-dark"
      : "theme-light"
  );
}

applyDeviceTheme();

const deviceTheme =
  window.matchMedia("(prefers-color-scheme: dark)");

deviceTheme.addEventListener("change", applyDeviceTheme);


// =============================
// EMAIL LOGIN
// =============================

const loginForm =
  document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  try {

    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    await createUserDocument(result.user);

    window.location.replace("home.html");

  } catch (err) {

    console.error(err);
    alert(err.message);

  }

});


// =============================
// GOOGLE LOGIN
// =============================

const googleBtn =
  document.getElementById("googleLogin");

googleBtn.addEventListener("click", async () => {

  try {

    googleBtn.disabled = true;
    googleBtn.textContent = "Opening Google...";

    await signInWithRedirect(
      auth,
      googleProvider
    );

  } catch (err) {

    console.error(err);

    googleBtn.disabled = false;
    googleBtn.textContent = "Continue with Google";

    alert(err.message);

  }

});


// =============================
// GOOGLE REDIRECT RESULT
// =============================

(async () => {

  try {

    const result =
      await getRedirectResult(auth);

    if (result && result.user) {

      await createUserDocument(result.user);

      window.location.replace("home.html");

    }

  } catch (err) {

    console.error("Google redirect error:", err);

    alert(err.message);

  }

})();


// =============================
// ALREADY LOGGED IN
// =============================

onAuthStateChanged(auth, (user) => {

  if (user) {

    window.location.replace("home.html");

  }

});
