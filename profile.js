import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Elements
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhoto = document.getElementById("profilePhoto");
const logoutBtn = document.getElementById("logoutBtn");

// Auth Check
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  try {

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      alert("User data not found.");
      return;
    }

    const data = snap.data();

    if (profileName) {
      profileName.textContent = data.username || "User";
    }

    if (profileEmail) {
      profileEmail.textContent = data.email || "";
    }

    if (profilePhoto && data.photoURL) {
      profilePhoto.src = data.photoURL;
    }

  } catch (err) {
    console.error(err);
    alert(err.message);
  }

});

// Logout
if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    try {

      await signOut(auth);

      window.location.replace("login.html");

    } catch (err) {

      console.error(err);
      alert(err.message);

    }

  });

}
