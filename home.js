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

const score = document.getElementById("totalScore");
const streak = document.getElementById("currentStreak");
const acc = document.getElementById("accuracy");
const playBtn = document.querySelector(".play-btn");
const achievementList = document.getElementById("achievementList");

// ======================================
// THEME SYSTEM
// ======================================

function applyTheme(theme) {

  document.body.classList.remove(
    "theme-light",
    "theme-dark"
  );

  if (theme === "light") {

    document.body.classList.add("theme-light");

  } else if (theme === "dark") {

    document.body.classList.add("theme-dark");

  } else {

    // DEFAULT = PHONE SYSTEM THEME

    if (
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ) {

      document.body.classList.add("theme-dark");

    }

  }

}


// Load saved theme
applyTheme(
  localStorage.getItem("theme") || "default"
);


// Follow phone theme when Default is selected
const systemTheme =
window.matchMedia(
  "(prefers-color-scheme: dark)"
);

systemTheme.addEventListener("change", () => {

  const currentTheme =
  localStorage.getItem("theme") || "default";

  if (currentTheme === "default") {

    applyTheme("default");

  }

});

// ======================================
// Auth
// ======================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  try {

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {

      score.textContent = "0";
      streak.textContent = "0";
      acc.textContent = "0%";

      achievementList.innerHTML =
      "<div class='achievement-card'>No achievements yet.</div>";

      return;

    }

    const data = snap.data();

// ======================================
// REAL PROGRESS
// Same calculation as Profile
// ======================================

const totalScore =
data.totalScore ?? 0;

const currentStreak =
data.currentStreak ?? 0;


// Read actual played puzzles
// from localStorage

let gamesPlayed = 0;
let gamesWon = 0;

for (let key in localStorage) {

  if (key.startsWith("quiz_")) {

    try {

      const quiz =
        JSON.parse(
          localStorage.getItem(key)
        );

      if (quiz) {

        gamesPlayed++;

        if (quiz.correct === true) {

          gamesWon++;

        }

      }

    } catch (error) {

      console.error(
        "Progress read error:",
        error
      );

    }

  }

}

const gamesLost =
gamesPlayed - gamesWon;


// Accuracy

const accuracy =
gamesPlayed === 0
? 0
: Math.round(
    (gamesWon / gamesPlayed) * 100
  );
    score.textContent = totalScore;
    streak.textContent = currentStreak;
    acc.textContent = accuracy + "%";

      // ======================================
    // Achievements
    // ======================================

    const achievements = [];

    if (gamesPlayed >= 1)
      achievements.push("🥇 Logo Rookie");

    if (currentStreak >= 7)
      achievements.push("🔥 7 Day Streak");

    if (totalScore >= 100)
      achievements.push("⭐ 100 Points Club");

    if (gamesPlayed >= 30)
      achievements.push("🎮 Puzzle Master");

    if (accuracy === 100 && gamesPlayed >= 10)
      achievements.push("🎯 Accuracy Master");

    if (gamesPlayed >= 100)
      achievements.push("👑 Logo Legend");

    achievementList.innerHTML = "";

    if (achievements.length === 0) {

      achievementList.innerHTML =
      "<div class='achievement-card'>No achievements yet.</div>";

    } else {

      achievements.forEach(item => {

        achievementList.innerHTML +=
        `<div class="achievement-card">${item}</div>`;

      });

    }

    } catch (err) {

    console.error(err);
    alert(err.message);

  }

});

// ======================================
// Play Button
// ======================================

if (playBtn) {

  playBtn.addEventListener("click", () => {

    window.location.href = "dailypuzzel.html";

  });

}
