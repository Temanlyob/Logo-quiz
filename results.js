import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

// Result Elements
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const scoreValue = document.getElementById("scoreValue");

// Load result
const result = localStorage.getItem("lastResult");
const score = Number(localStorage.getItem("lastScore")) || 0;
const processed =
localStorage.getItem("resultProcessed") === "true";

const isCorrect = result === "correct";

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const userRef = doc(db, "users", user.uid);

  let totalScore = 0;
  let gamesWon = 0;
  let gamesLost = 0;
  let currentStreak = 0;
  let bestStreak = 0;

  const snap = await getDoc(userRef);

  if (snap.exists()) {

    const d = snap.data();

    totalScore = d.totalScore || 0;
    gamesWon = d.gamesWon || 0;
    gamesLost = d.gamesLost || 0;
    currentStreak = d.currentStreak || 0;
    bestStreak = d.bestStreak || 0;

  }

  if (!processed) {

    if (isCorrect) {

      gamesWon++;
      currentStreak++;
      totalScore += score;

      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }

    } else {

      gamesLost++;
      currentStreak = 0;

    }

    await setDoc(userRef, {

      totalScore,
      gamesWon,
      gamesLost,
      currentStreak,
      bestStreak

    }, { merge: true });

    localStorage.setItem(
      "resultProcessed",
      "true"
    );

  }

  const totalGames = gamesWon + gamesLost;

  const winRate =
    totalGames === 0
      ? 0
      : Math.round((gamesWon / totalGames) * 100);

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

homeBtn.onclick = () => {

  window.location.href = "home.html";

};

calendarBtn.onclick = () => {

  window.location.href = "calendar.html";

};
