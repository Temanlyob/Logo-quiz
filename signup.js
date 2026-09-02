import {
  auth,
  googleProvider,
  createUserDocument,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged
} from "./auth.js";


// =====================================
// DEVICE THEME
// =====================================

function applyDeviceTheme() {

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


// =====================================
// EMAIL SIGN UP
// =====================================

const form =
  document.getElementById("signupForm");

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const username =
    document.getElementById("username").value.trim();

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  const confirmPassword =
    document.getElementById("confirmPassword").value;


  if (password !== confirmPassword) {

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


    await createUserDocument(
      result.user,
      username
    );


    window.location.replace("home.html");


  } catch (error) {

    console.error(
      "Email signup error:",
      error
    );

    alert(
      error.message ||
      "Account creation failed."
    );

  }

});


// =====================================
// GOOGLE SIGN UP
// =====================================

const googleButton =
  document.getElementById("googleSignup");


googleButton.addEventListener(
  "click",
  async () => {

    googleButton.disabled = true;

    googleButton.textContent =
      "Connecting to Google...";


    try {

      // Google login/signup
      // Firebase automatically creates
      // the account if it does not exist.

      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );


      // Create / update Firestore profile

      await createUserDocument(
        result.user
      );


      // Go to Home

      window.location.replace(
        "home.html"
      );


    } catch (error) {

      console.error(
        "Google signup error:",
        error
      );


      googleButton.disabled = false;

      googleButton.textContent =
        "Continue with Google";


      // User closed Google window

      if (
        error.code ===
        "auth/popup-closed-by-user"
      ) {

        return;

      }


      // Popup blocked by browser

      if (
        error.code ===
        "auth/popup-blocked"
      ) {

        alert(
          "Google popup was blocked. Please allow popups and try again."
        );

        return;

      }


      // Unauthorized domain

      if (
        error.code ===
        "auth/unauthorized-domain"
      ) {

        alert(
          "This website domain is not authorized in Firebase Authentication."
        );

        return;

      }


      // Any other error

      alert(
        "Google Sign Up failed:\n\n" +
        (error.message || error.code)
      );

    }

  }
);
