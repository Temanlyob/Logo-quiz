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

    const totalScore =
    data.totalScore ?? 0;

    const currentStreak =
    data.currentStreak ?? 0;

    const gamesWon =
    data.gamesWon ?? 0;

    const gamesLost =
    data.gamesLost ?? 0;

    const gamesPlayed =
    gamesWon + gamesLost;

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
