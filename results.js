import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Buttons
const homeBtn = document.getElementById("homeBtn");
const calendarBtn = document.getElementById("calendarBtn");

// Result UI
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const scoreValue = document.getElementById("scoreValue");

// Last Puzzle Result
const result =
localStorage.getItem("lastResult");

const score =
Number(localStorage.getItem("lastScore")) || 0;

const isCorrect =
result === "correct";

// Date
const params =
new URLSearchParams(window.location.search);

const puzzleDate =
params.get("date") ||
new Date().toLocaleDateString(
"en-GB"
).replace(/\//g,"-");

// Processed Flag
const processedKey =
"resultProcessed_" + puzzleDate;

const processed =
localStorage.getItem(processedKey) === "true";

// Login
onAuthStateChanged(auth, async(user)=>{

if(!user){

window.location.replace("login.html");
return;

}

const userRef =
doc(db,"users",user.uid);

// Default Values

let totalScore=0;
let puzzlesPlayed=0;
let gamesWon=0;
let gamesLost=0;
let currentStreak=0;
let bestStreak=0;
let lastPlayed=null;

// Read Firestore

const snap=
await getDoc(userRef);

if(snap.exists()){

const d=snap.data();

totalScore=d.totalScore||0;
puzzlesPlayed=d.puzzlesPlayed||0;
gamesWon=d.gamesWon||0;
gamesLost=d.gamesLost||0;
currentStreak=d.currentStreak||0;
bestStreak=d.bestStreak||0;
lastPlayed=d.lastPlayed||null;

}

// =====================================
// Update Stats
// =====================================

if (!processed) {

  puzzlesPlayed++;

  const today =
  new Date().toISOString().split("T")[0];

  if (isCorrect) {

    gamesWon++;
    totalScore += score;

    if (!lastPlayed) {

      currentStreak = 1;

    } else {

      const last =
      new Date(lastPlayed);

      const now =
      new Date(today);

      const diffDays =
      Math.floor(
      (now-last)/(1000*60*60*24)
      );

      if (diffDays === 1) {

        currentStreak++;

      } else if (diffDays > 1) {

        currentStreak = 1;

      }

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
      lastPlayed: today

    },

    {

      merge:true

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
totalGames===0
?0
:Math.round(
(gamesWon/totalGames)*100
);

// =====================================
// Update UI
// =====================================

document.getElementById("totalGames").textContent =
totalGames;

document.getElementById("gamesWon").textContent =
gamesWon;

document.getElementById("gamesLost").textContent =
gamesLost;

document.getElementById("currentStreak").textContent =
currentStreak + " Days";

document.getElementById("bestStreak").textContent =
bestStreak + " Days";

document.getElementById("winRate").textContent =
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

homeBtn.onclick = function () {

  window.location.href = "home.html";

};

calendarBtn.onclick = function () {

  window.location.href = "calendar.html";

};                   
