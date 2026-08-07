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
const logoutBtn = document.querySelector(".logout-btn");
const achievementSection = document.querySelector(".achievement-section");

const themesBtn = document.getElementById("themesBtn");
const themeModal = document.getElementById("themeModal");
const closeTheme = document.getElementById("closeTheme");
const options = document.querySelectorAll(".theme-option");

// =============================
// Theme Functions
// =============================

function loadTheme() {
  const current = localStorage.getItem("theme") || "default";

  options.forEach(option => {
    option.classList.remove("active");
    const tick = option.querySelector(".tick");
    if (tick) {
      tick.textContent = "";
    }

    if (option.dataset.theme === current) {
      option.classList.add("active");
      if (tick) {
        tick.textContent = "✓";
      }
    }
  });
}

// Initialize theme on load
loadTheme();

// =============================
// Theme Event Listeners
// =============================

if (themesBtn && themeModal) {
  themesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    themeModal.style.display = "flex";
    loadTheme();
  });
}

if (closeTheme && themeModal) {
  closeTheme.addEventListener("click", () => {
    themeModal.style.display = "none";
  });
}

if (themeModal) {
  themeModal.addEventListener("click", (e) => {
    if (e.target === themeModal) {
      themeModal.style.display = "none";
    }
  });
}

options.forEach(option => {
  option.addEventListener("click", () => {
    const theme = option.dataset.theme;
    localStorage.setItem("theme", theme);
    loadTheme();
  });
});

// =============================
// Firebase & Profile Load
// =============================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    username.textContent = "User";
    email.textContent = "";
    return;
  }

  const data = snap.data();
  username.textContent = data.username || user.displayName || "User";
  email.textContent = data.email || user.email || "";
  avatar.src = data.photoURL || user.photoURL || "default-avatar.png";

  function getCalendarStats() {
    let playedCount = 0;
    let wonCount = 0;

    for (let key in localStorage) {
      if (key.startsWith("quiz_")) {
        const quiz = JSON.parse(localStorage.getItem(key));
        if (quiz) {
          playedCount++;
          if (quiz.correct) {
            wonCount++;
          }
        }
      }
    }

    return {
      played: playedCount,
      won: wonCount,
      lost: playedCount - wonCount
    };
  }

  const totalScore = data.totalScore ?? 0;
  const currentStreak = data.currentStreak ?? 0;

  const stats = getCalendarStats();
  const puzzlesPlayed = stats.played;
  const gamesWon = stats.won;

  const winRate =
    puzzlesPlayed === 0
      ? 0
      : Math.round((gamesWon / puzzlesPlayed) * 100);

  score.textContent = totalScore;
  streak.textContent = currentStreak;
  accuracy.textContent = winRate + "%";
  played.textContent = puzzlesPlayed;

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

  if (puzzlesPlayed >= 1) {
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

  if (puzzlesPlayed >= 30) {
    html += `
      <div class="achievement-item">  
        <span>🎮</span>  
        <div>  
          <h3>Puzzle Master</h3>  
          <p>Played 30 puzzles.</p>  
        </div>  
      </div>`;
  }

  if (winRate === 100 && puzzlesPlayed >= 10) {
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

  achievementSection.innerHTML = "<h2>Achievements</h2>" + html;

  // =============================
  // Logout
  // =============================

  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("login.html");
  });
});
