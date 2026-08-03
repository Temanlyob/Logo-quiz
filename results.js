import { auth, db } from "./firebase.js";

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

puzzlesPlayed =
data.puzzlesPlayed ?? 0;

gamesWon =
data.gamesWon ?? 0;

gamesLost =
data.gamesLost ?? 0;

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

  puzzlesPlayed++;

  const puzzle =
  puzzleDate.split("-");

  const puzzleDateObj =
  new Date(
    Number("20" + puzzle[2]),
    Number(puzzle[1]) - 1,
    Number(puzzle[0])
  );

  if (isCorrect) {

    gamesWon++;
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

    gamesLost++;
    currentStreak = 0;

  }

  await setDoc(

    userRef,

    {

      totalScore,
      puzzlesPlayed,
      gamesWon,
      gamesLost,
      currentStreak,
      bestStreak,
      lastPlayed:
      puzzleDateObj.toISOString()

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
gamesWon + gamesLost;

const winRate =
totalGames === 0
? 0
: Math.round(
(gamesWon / totalGames) * 100
);

// =====================================
// Update UI
// =====================================

document.getElementById(
"totalGames"
).textContent =
totalGames;

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
  resultTitle.innerHTML = "Today's Result";
  scoreValue.innerHTML = "+" + score;
  scoreValue.style.color = "#22c55e";

} else {

  resultIcon.innerHTML = "❌";
  resultTitle.innerHTML = "Better Luck Tomorrow";
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

