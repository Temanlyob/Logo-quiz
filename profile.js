import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

console.log("Profile JS Loaded");

// =============================
// Elements
// =============================

const avatar = document.getElementById("profilePhoto");
const username = document.getElementById("username");
const email = document.getElementById("profileEmail");

const score = document.getElementById("score");
const streak = document.getElementById("streak");
const accuracy = document.getElementById("accuracy");
const played = document.getElementById("played");

const level = document.querySelector(".level");
const logoutBtn = document.getElementById("logoutBtn");
const achievementSection = document.querySelector(".achievement-section");

// Theme
const themesBtn = document.getElementById("themesBtn");
const themeModal = document.getElementById("themeModal");
const closeTheme = document.getElementById("closeTheme");
const options = document.querySelectorAll(".theme-option");

// =============================
// Theme Functions
// =============================

function loadTheme() {

  const currentTheme =
    localStorage.getItem("theme") || "default";

  options.forEach(option => {

    option.classList.remove("active");

    const tick =
      option.querySelector(".tick");

    if (tick) {
      tick.textContent = "";
    }

    if (option.dataset.theme === currentTheme) {

      option.classList.add("active");

      if (tick) {
        tick.textContent = "✓";
      }

    }

  });

}

// Load saved theme
loadTheme();

// =============================
// Theme Events
// =============================

if (themesBtn) {

  themesBtn.addEventListener("click", (e) => {

    e.preventDefault();

    themeModal.style.display = "flex";

    loadTheme();

  });

}

if (closeTheme) {

  closeTheme.addEventListener("click", () => {

    themeModal.style.display = "none";

  });

}

// Close when tapping outside
themeModal.addEventListener("click", (e) => {

  if (e.target === themeModal) {

    themeModal.style.display = "none";

  }

});

// Select Theme
options.forEach(option => {

  option.addEventListener("click", () => {

    localStorage.setItem(
      "theme",
      option.dataset.theme
    );

    loadTheme();

  });

});

// =============================
// Firebase Profile Load
// =============================

onAuthStateChanged(auth, async (user) => {

  try {

    if (!user) {
      window.location.replace("login.html");
      return;
    }

    const snap = await getDoc(
      doc(db, "users", user.uid)
    );

    if (!snap.exists()) {

      username.textContent = "User";
      email.textContent = "";
      return;

    }

    const data = snap.data();

    avatar.src =
      data.photoURL ||
      user.photoURL ||
      "default-avatar.png";

    username.textContent =
      data.username ||
      user.displayName ||
      "User";

    email.textContent =
      data.email ||
      user.email ||
      "";

    const totalScore =
      data.totalScore ?? 0;

    const currentStreak =
      data.currentStreak ?? 0;

    let playedCount = 0;
    let wonCount = 0;

    for (let key in localStorage) {

      if (key.startsWith("quiz_")) {

        const quiz =
          JSON.parse(localStorage.getItem(key));

        if (quiz) {

          playedCount++;

          if (quiz.correct) {
            wonCount++;
          }

        }

      }

    }

    const winRate =
      playedCount === 0
      ? 0
      : Math.round(
          (wonCount / playedCount) * 100
        );

    score.textContent = totalScore;
    streak.textContent = currentStreak;
    accuracy.textContent = winRate + "%";
    played.textContent = playedCount;

      // =============================
    // Level
    // =============================

    let levelText = "⭐ Level 1";

    if (totalScore >= 1000) {
      levelText = "👑 Level 5";
    } else if (totalScore >= 500) {
      levelText = "💎 Level 4";
    } else if (totalScore >= 250) {
      levelText = "🥇 Level 3";
    } else if (totalScore >= 100) {
      levelText = "🥈 Level 2";
    }

    level.textContent = levelText;

    // =============================
    // Achievements
    // =============================

    let html = "";

    if (playedCount >= 1) {
      html += `
      <div class="achievement-item">
        <span>🥇</span>
        <div>
          <h3>Logo Rookie</h3>
          <p>Completed your first puzzle.</p>
        </div>
      </div>`;
    }

    if (currentStreak >= 7) {
      html += `
      <div class="achievement-item">
        <span>🔥</span>
        <div>
          <h3>7 Day Streak</h3>
          <p>Solved puzzles for 7 consecutive days.</p>
        </div>
      </div>`;
    }

    if (totalScore >= 100) {
      html += `
      <div class="achievement-item">
        <span>⭐</span>
        <div>
          <h3>100 Points Club</h3>
          <p>Earned 100+ points.</p>
        </div>
      </div>`;
    }

    if (playedCount >= 30) {
      html += `
      <div class="achievement-item">
        <span>🎮</span>
        <div>
          <h3>Puzzle Master</h3>
          <p>Played 30 puzzles.</p>
        </div>
      </div>`;
    }

    if (winRate === 100 && playedCount >= 10) {
      html += `
      <div class="achievement-item">
        <span>🎯</span>
        <div>
          <h3>Accuracy Master</h3>
          <p>100% accuracy in 10 puzzles.</p>
        </div>
      </div>`;
    }

    if (html === "") {
      html = `
      <div class="achievement-item">
        <span>🔒</span>
        <div>
          <h3>No Achievements Yet</h3>
          <p>Keep playing to unlock achievements.</p>
        </div>
      </div>`;
    }

    achievementSection.innerHTML =
      "<h2>Achievements</h2>" + html;

    // =============================
    // Logout
    // =============================

    logoutBtn.onclick = async () => {

      await signOut(auth);

      window.location.replace("login.html");

    };

  } catch (err) {

    console.error("Profile Error:", err);
    alert(err.message);

  }

});
