import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================
// THEME SYSTEM
// ======================================

function applyTheme(theme){

    document.body.classList.remove(
        "theme-light",
        "theme-dark"
    );

    if(theme === "light"){

        document.body.classList.add("theme-light");

    }else if(theme === "dark"){

        document.body.classList.add("theme-dark");

    }else{

        // DEFAULT = PHONE SYSTEM THEME

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

}


// ======================================
// LOAD PROFILE THEME
// ======================================

const savedTheme =
    localStorage.getItem("theme") || "default";

applyTheme(savedTheme);


// ======================================
// FOLLOW PHONE THEME
// ONLY WHEN DEFAULT IS SELECTED
// ======================================

const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

systemTheme.addEventListener("change", () => {

    const currentTheme =
        localStorage.getItem("theme") || "default";

    if(currentTheme === "default"){

        applyTheme("default");

    }

});

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

const achievementList =
  document.getElementById("achievementList");


// ======================================
// LOAD PROGRESS
// SAME LOGIC AS PROFILE
// ======================================

async function loadProgress(user) {

  try {

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
    // REAL PUZZLE DATA
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
    // UPDATE PROGRESS
    // ==================================

    score.textContent =
      totalScore;

    streak.textContent =
      currentStreak;

    accuracy.textContent =
      winRate + "%";


    // ==================================
    // ACHIEVEMENTS
    // SAME LOGIC AS PROFILE
    // ==================================

    let html = "";


    if (puzzlesPlayed >= 1) {

      html += `
        <div class="achievement-item">

          <span>🥇</span>

          <div>

            <h3>Logo Rookie</h3>

            <p>
              Completed your first puzzle.
            </p>

          </div>

        </div>
      `;

    }


    if (currentStreak >= 7) {

      html += `
        <div class="achievement-item">

          <span>🔥</span>

          <div>

            <h3>7 Day Streak</h3>

            <p>
              Solved puzzles for 7 consecutive days.
            </p>

          </div>

        </div>
      `;

    }


    if (totalScore >= 100) {

      html += `
        <div class="achievement-item">

          <span>⭐</span>

          <div>

            <h3>100 Points Club</h3>

            <p>
              Earned 100+ points.
            </p>

          </div>

        </div>
      `;

    }


    if (puzzlesPlayed >= 30) {

      html += `
        <div class="achievement-item">

          <span>🎮</span>

          <div>

            <h3>Puzzle Master</h3>

            <p>
              Played 30 puzzles.
            </p>

          </div>

        </div>
      `;

    }


    if (
      winRate === 100 &&
      puzzlesPlayed >= 10
    ) {

      html += `
        <div class="achievement-item">

          <span>🎯</span>

          <div>

            <h3>Accuracy Master</h3>

            <p>
              100% accuracy in 10 puzzles.
            </p>

          </div>

        </div>
      `;

    }


    // ==================================
    // NO ACHIEVEMENT
    // ==================================

    if (html === "") {

      html = `
        <div class="achievement-item">

          <span>🔒</span>

          <div>

            <h3>No Achievements Yet</h3>

            <p>
              Keep playing to unlock achievements.
            </p>

          </div>

        </div>
      `;

    }


    // ==================================
    // SHOW ACHIEVEMENTS
    // ==================================

    if (achievementList) {

      achievementList.innerHTML =
        html;

    }


    // ==================================
    // DEBUG
    // ==================================

    console.log(
      "HOME PROGRESS:",
      {
        score: totalScore,
        streak: currentStreak,
        played: puzzlesPlayed,
        won: gamesWon,
        accuracy: winRate
      }
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


// ======================================
// REFRESH WHEN PAGE BECOMES VISIBLE
// ======================================

document.addEventListener(
  "visibilitychange",
  async () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      const user =
        auth.currentUser;

      if (user) {

        await loadProgress(user);

      }

    }

  }
);
