import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================
// Elements
// ======================================

const score =
  document.getElementById("totalScore");

const streak =
  document.getElementById("currentStreak");

const acc =
  document.getElementById("accuracy");

const playBtn =
  document.querySelector(".play-btn");

const achievementList =
  document.getElementById("achievementList");


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

    try {

      // ==================================
      // FIRESTORE USER
      // ==================================

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      const snap =
        await getDoc(userRef);


      if (!snap.exists()) {

        score.textContent = "0";
        streak.textContent = "0";
        acc.textContent = "0%";

        achievementList.innerHTML =
          "<div class='achievement-card'>No achievements yet.</div>";

        return;

      }


      const data =
        snap.data();


      // ==================================
      // TOTAL SCORE
      // Same as Profile
      // ==================================

      const totalScore =
        data.totalScore ?? 0;


      // ==================================
      // CURRENT STREAK
      // Same as Profile
      // ==================================

      const currentStreak =
        data.currentStreak ?? 0;


      // ==================================
      // REAL PUZZLE PROGRESS
      // Same logic as Profile
      // ==================================

      let gamesPlayed = 0;

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

              gamesPlayed++;


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

      const accuracy =
        gamesPlayed === 0
          ? 0
          : Math.round(
              (gamesWon / gamesPlayed) * 100
            );


      // ==================================
      // UPDATE HOME PROGRESS
      // ==================================

      score.textContent =
        totalScore;

      streak.textContent =
        currentStreak;

      acc.textContent =
        accuracy + "%";


      // ==================================
      // ACHIEVEMENTS
      // ==================================

      const achievements = [];


      if (gamesPlayed >= 1) {

        achievements.push(
          "🥇 Logo Rookie"
        );

      }


      if (currentStreak >= 7) {

        achievements.push(
          "🔥 7 Day Streak"
        );

      }


      if (totalScore >= 100) {

        achievements.push(
          "⭐ 100 Points Club"
        );

      }


      if (gamesPlayed >= 30) {

        achievements.push(
          "🎮 Puzzle Master"
        );

      }


      if (
        accuracy === 100 &&
        gamesPlayed >= 10
      ) {

        achievements.push(
          "🎯 Accuracy Master"
        );

      }


      if (gamesPlayed >= 100) {

        achievements.push(
          "👑 Logo Legend"
        );

      }


      // ==================================
      // SHOW ACHIEVEMENTS
      // ==================================

      achievementList.innerHTML = "";


      if (
        achievements.length === 0
      ) {

        achievementList.innerHTML =
          `
          <div class="achievement-card">
            No achievements yet.
          </div>
          `;

      } else {

        achievements.forEach(
          (item) => {

            achievementList.innerHTML +=
              `
              <div class="achievement-card">
                ${item}
              </div>
              `;

          }
        );

      }


      // ==================================
      // DEBUG
      // ==================================

      console.log(
        "HOME PROGRESS"
      );

      console.log(
        "Total Score:",
        totalScore
      );

      console.log(
        "Current Streak:",
        currentStreak
      );

      console.log(
        "Games Played:",
        gamesPlayed
      );

      console.log(
        "Games Won:",
        gamesWon
      );

      console.log(
        "Accuracy:",
        accuracy + "%"
      );


    } catch (error) {

      console.error(
        "HOME ERROR:",
        error
      );

    }

  }
);


// ======================================
// PLAY BUTTON
// ======================================

if (playBtn) {

  playBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "dailypuzzel.html";

    }
  );

}
