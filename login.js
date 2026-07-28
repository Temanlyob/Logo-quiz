import {
  auth,
  googleProvider,
  createUserDocument,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged
} from "./auth.js";

// Already logged in?
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "home.html";
  }
});

// Email Login
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "home.html";
  } catch (err) {
    alert(err.message);
  }
});

// Google Login
const googleBtn = document.getElementById("googleLogin");

googleBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    await createUserDocument(result.user);

    window.location.href = "home.html";

  } catch (err) {
    alert(err.message);
  }
});
