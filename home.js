import { auth } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

console.log("HOME JS LOADED");


// ======================================
// ELEMENTS
// ======================================

const score =
  document.getElementById("totalScore");

const streak =
  document.getElementById("currentStreak");

const accuracy =
  document.getElementById("accuracy");


// ======================================
// LOAD PROFILE PROGRESS
// ======================================

function loadProfileProgress() {

  const saved =
    localStorage.getItem(
      "profileProgress"
    );


  if (!saved) {

    console.log(
      "No profile progress found"
    );

    score.textContent = "0";

    streak.textContent = "0";

    accuracy.textContent = "0%";

    return;

  }


  try {

    const progress =
      JSON.parse(saved);


    // ================================
    // SAME VALUES AS PROFILE
    // ================================

    score.textContent =
      progress.score ?? 0;


    streak.textContent =
      progress.streak ?? 0;


    accuracy.textContent =
      (progress.accuracy ?? 0) + "%";


    console.log(
      "HOME PROFILE PROGRESS:",
      progress
    );


  } catch (error) {

    console.error(
      "PROFILE PROGRESS ERROR:",
      error
    );

  }

}


// ======================================
// AUTH
// ======================================

onAuthStateChanged(
  auth,
  (user) => {

    if (!user) {

      window.location.replace(
        "login.html"
      );

      return;

    }


    // Load exactly the values
    // saved by Profile

    loadProfileProgress();

  }
);


// ======================================
// REFRESH WHEN RETURNING TO HOME
// ======================================

window.addEventListener(
  "pageshow",
  () => {

    loadProfileProgress();

  }
);


// ======================================
// ALSO REFRESH WHEN TAB BECOMES ACTIVE
// ======================================

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      loadProfileProgress();

    }

  }
);
