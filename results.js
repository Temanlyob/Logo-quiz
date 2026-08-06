import { auth, db } from "./firebase.js";

import { getTranslation } from "./translations.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// =====================================
// Buttons
// =====================================

const homeBtn =
document.getElementById("homeBtn");

const calendarBtn =
document.getElementById("calendarBtn");

// =====================================
// Result UI
// =====================================

const resultIcon =
document.getElementById("resultIcon");

const resultTitle =
document.getElementById("resultTitle");

const scoreValue =
document.getElementById("scoreValue");

// =====================================
// Puzzle Result
// =====================================

const result =
localStorage.getItem("lastResult");

const score =
Number(localStorage.getItem("lastScore")) || 0;

const isCorrect =
result === "correct";

// =====================================
// Puzzle Date
// =====================================

const params =
new URLSearchParams(window.location.search);

const puzzleDate =
params.get("date") ||
new Date()
.toLocaleDateString("en-GB")
.replace(/\//g,"-");

// =====================================
// Process Flag
// =====================================

const processedKey =
"resultProcessed_" + puzzleDate;

const processed =
localStorage.getItem(processedKey) === "true";

// =====================================
// Firebase Login
// =====================================

onAuthStateChanged(auth, async(user)=>{

if(!user){

window.location.replace("login.html");
return;

}

const userRef =
doc(db,"users",user.uid);

const language =
localStorage.getItem("language") || "en";

const t =
getTranslation(language);

// Bottom Navigation

const nav =
document.querySelectorAll(".bottom-nav span");

if(nav.length >= 4){

nav[0].textContent = t.home;
nav[1].textContent = t.calendar;
nav[2].textContent = t.results;
nav[3].textContent = t.profile;

}

// =====================================
// Default Values
// =====================================

let totalScore = 0;
let puzzlesPlayed = 0;
let gamesWon = 0;
let gamesLost = 0;
let currentStreak = 0;
let bestStreak = 0;
let lastPlayed = null;
let history = {};

// =====================================
// Read Firestore
// =====================================

const snap =
await getDoc(userRef);

if(snap.exists()){

const data =
snap.data();

totalScore =
data.totalScore ?? 0;

history =
data.history ?? {};

puzzlesPlayed =
Object.keys(history).length;

gamesWon =
Object.values(history)
.filter(item => item.correct === true)
.length;

gamesLost =
puzzlesPlayed - gamesWon;
currentStreak =
data.currentStreak ?? 0;

bestStreak =
data.bestStreak ?? 0;

lastPlayed =
data.lastPlayed ?? null;

}

// =====================================
// Update Stats
// =====================================

if (!processed) {

  const puzzle =
  puzzleDate.split("-");

  const puzzleDateObj =
  new Date(
    Number("20" + puzzle[2]),
    Number(puzzle[1]) - 1,
    Number(puzzle[0])
  );

  if (isCorrect) {

    totalScore += score;

    if (!lastPlayed) {

      currentStreak = 1;

    } else {

      const lastDate =
      new Date(lastPlayed);

      const diffDays =
      Math.floor(
        (puzzleDateObj - lastDate) /
        (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {

        currentStreak++;

      } else if (diffDays > 1) {

        currentStreak = 1;

      }

      // Same day or older puzzle
      // current streak unchanged

    }

    if (currentStreak > bestStreak) {

      bestStreak = currentStreak;

    }

  } else {

    currentStreak = 0;

  }

  history[puzzleDate] = {
  correct: isCorrect,
  score: score
};

  puzzlesPlayed = Object.keys(history).length;

gamesWon = Object.values(history)
.filter(item => item.correct)
.length;

gamesLost = puzzlesPlayed - gamesWon;

  await setDoc(
  userRef,
  {
    totalScore,
    currentStreak,
    bestStreak,
    lastPlayed: puzzleDateObj.toISOString(),
    history
  },
  {
    merge: true
  }
);

  localStorage.setItem(
    processedKey,
    "true"
  );

}

// =====================================
// Calculate Stats
// =====================================

const totalGames =
puzzlesPlayed;

const winRate =
puzzlesPlayed === 0
? 0
: Math.round(
(gamesWon / puzzlesPlayed) * 100
);

// =====================================
// Update UI
// =====================================

document.getElementById(
"totalGames"
).textContent =
puzzlesPlayed;

document.getElementById(
"gamesWon"
).textContent =
gamesWon;

document.getElementById(
"gamesLost"
).textContent =
gamesLost;

document.getElementById(
"currentStreak"
).textContent =
currentStreak + " Days";

document.getElementById(
"bestStreak"
).textContent =
bestStreak + " Days";

document.getElementById(
"winRate"
).textContent =
winRate + "%";

// =====================================
// Result Theme
// =====================================

if (isCorrect) {

  resultIcon.innerHTML = "🏆";
  resultTitle.innerHTML = t.todaysResult || "Today's Result";
  scoreValue.innerHTML = "+" + score;
  scoreValue.style.color = "#22c55e";

} else {

  resultIcon.innerHTML = "❌";
  resultTitle.innerHTML =
t.betterLuckTomorrow || "Better Luck Tomorrow";
  scoreValue.innerHTML = "0";
  scoreValue.style.color = "#ef4444";

}

});

// =====================================
// Buttons
// =====================================

homeBtn.addEventListener("click", () => {

  window.location.href = "home.html";

});

calendarBtn.addEventListener("click", () => {

  window.location.href = "calendar.html";

});

