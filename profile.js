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

    let data = {};

    if (snap.exists()) {
      data = snap.data();
    }

    // Username
    if (profileName) {
      profileName.textContent =
        data.username ||
        user.displayName ||
        "User";
    }

    // Email
    if (profileEmail) {
      profileEmail.textContent =
        data.email ||
        user.email ||
        "";
    }

    // Profile Photo
    if (profilePhoto) {

      if (data.photoURL) {

        profilePhoto.src = data.photoURL;

      } else if (user.photoURL) {

        profilePhoto.src = user.photoURL;

      }

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
