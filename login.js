import {
  auth,
  googleProvider,
  createUserDocument,
  signInWithEmailAndPassword,
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


// Initial device theme
applyDeviceTheme();


// Automatically follow device theme changes
const deviceTheme =
window.matchMedia(
    "(prefers-color-scheme: dark)"
);

deviceTheme.addEventListener("change", () => {

    applyDeviceTheme();

});

const systemTheme =
window.matchMedia(
    "(prefers-color-scheme: dark)"
);

systemTheme.addEventListener("change",()=>{

    const currentTheme =
    localStorage.getItem("theme") || "default";

    if(currentTheme === "default"){

        applyTheme("default");

    }

});

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
