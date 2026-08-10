import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
// LOAD PROGRESS
// EXACT SAME LOGIC AS PROFILE
// ======================================

async function loadProgress(user) {

  try {

    // ==================================
    // FIRESTORE
    // ==================================

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const snap =
      await getDoc(userRef);


    let totalScore = 0;
    let currentStreak = 0;


    if (snap.exists()) {

      const data =
        snap.data();

      totalScore =
        data.totalScore ?? 0;

      currentStreak =
        data.currentStreak ?? 0;

    }


    // ==================================
    // LOCAL PUZZLE DATA
    // SAME AS PROFILE
    // ==================================

    let puzzlesPlayed = 0;
    let gamesWon = 0;


    for (
      let key in localStorage
    ) {

      if (
        key.startsWith("quiz_")
      ) {

        try {

          const quiz =
            JSON.parse(
              localStorage.getItem(key)
            );


          if (quiz) {

            puzzlesPlayed++;


            if (
              quiz.correct === true
            ) {

              gamesWon++;

            }

          }

        } catch (error) {

          console.error(
            "Quiz data error:",
            error
          );

        }

      }

    }


    // ==================================
    // ACCURACY
    // ==================================

    const winRate =
      puzzlesPlayed === 0
        ? 0
        : Math.round(
            (gamesWon / puzzlesPlayed) * 100
          );


    // ==================================
    // SHOW ON HOME
    // ==================================

    score.textContent =
      totalScore;

    streak.textContent =
      currentStreak;

    accuracy.textContent =
      winRate + "%";


    // ==================================
    // DEBUG
    // ==================================

    console.log(
      "HOME SCORE:",
      totalScore
    );

    console.log(
      "HOME STREAK:",
      currentStreak
    );

    console.log(
      "HOME PLAYED:",
      puzzlesPlayed
    );

    console.log(
      "HOME WON:",
      gamesWon
    );

    console.log(
      "HOME ACCURACY:",
      winRate + "%"
    );


  } catch (error) {

    console.error(
      "HOME PROGRESS ERROR:",
      error
    );

  }

}


// ======================================
// AUTH
// ======================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.replace(
        "login.html"
      );

      return;

    }

    await loadProgress(user);

  }
);


// ======================================
// REFRESH WHEN RETURNING TO HOME
// ======================================

window.addEventListener(
  "pageshow",
  async () => {

    const user =
      auth.currentUser;

    if (user) {

      await loadProgress(user);

    }

  }
);
