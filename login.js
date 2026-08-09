import {
  auth,
  googleProvider,
  createUserDocument,
  signInWithEmailAndPassword,
  signInWithPopup
} from "./auth.js";

// ======================================
// THEME SYSTEM
// ======================================

// DAILY PUZZLE ALWAYS USES DEFAULT THEME

function applyDefaultTheme() {

    document.body.classList.remove(
        "theme-light",
        "theme-dark"
    );

    // Default = phone system theme
    if (
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
    ) {

        document.body.classList.add(
            "theme-dark"
        );

    }

}


// Apply Default theme
applyDefaultTheme();


// Follow phone system theme
const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

systemTheme.addEventListener(
    "change",
    () => {

        applyDefaultTheme();

    }
);

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
