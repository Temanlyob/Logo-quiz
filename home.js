import { auth, db } from "./firebase.js";

import { getTranslation } from "./translations.js";
import { LANGUAGES } from "./languages.js";

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

    const language =
localStorage.getItem("language") || "en";

const t =
getTranslation(language);

// Today's Puzzle Heading
const heading =
document.querySelector(".hero h1");

if(heading)
heading.textContent =
t.todaysPuzzle;

// Stats Labels
const statLabels =
document.querySelectorAll(".stats-card p, .stat-card p");

if(statLabels.length >= 3){

statLabels[0].textContent =
t.totalScore;

statLabels[1].textContent =
t.currentStreak;

statLabels[2].textContent =
t.accuracy;

}

// Achievement Title
const achievementTitle =
document.querySelector(".achievement-section h2");

if(achievementTitle){

achievementTitle.textContent =
t.achievements;

}
    
    // Bottom Navigation
document.querySelectorAll(".bottom-nav span")[0].textContent =
t.home;

document.querySelectorAll(".bottom-nav span")[1].textContent =
t.calendar;

document.querySelectorAll(".bottom-nav span")[2].textContent =
t.results;

document.querySelectorAll(".bottom-nav span")[3].textContent =
t.profile;

// Play Button
playBtn.textContent =
t.playNow;

    const totalScore =
    data.totalScore ?? 0;

    const currentStreak =
    data.currentStreak ?? 0;

    const history =
data.history ?? {};

const gamesPlayed =
Object.keys(history).length;

const gamesWon =
Object.values(history)
.filter(item => item.correct === true)
.length;

const gamesLost =
gamesPlayed - gamesWon;
    
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
      achievements.push("🥇 " + t.logoRookie);
    
    if (currentStreak >= 7)
      achievements.push("🔥 " + t.sevenDay);

    if (totalScore >= 100)
      achievements.push("⭐ " + t.pointsClub);

    if (gamesPlayed >= 30)
      achievements.push("🎮 " + t.puzzleMaster);

    if (accuracy === 100 && gamesPlayed >= 10)
      achievements.push("🎯 " + t.accuracyMaster);

    if (gamesPlayed >= 100)
      achievements.push("👑 " + t.logoLegend);

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
