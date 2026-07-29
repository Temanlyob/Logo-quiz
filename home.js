import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Elements
const score = document.getElementById("totalScore");
const streak = document.getElementById("currentStreak");
const acc = document.getElementById("accuracy");
const playBtn = document.querySelector(".play-btn");

// Auth Check
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  try {

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {

      console.warn("User document not found.");
      window.location.replace("login.html");
      return;

    }

    const data = snap.data();

    const totalScore = data.totalScore ?? 0;
    const currentStreak = data.currentStreak ?? 0;
    const gamesWon = data.gamesWon ?? 0;
    const gamesLost = data.gamesLost ?? 0;

    const gamesPlayed = gamesWon + gamesLost;

    const accuracy = gamesPlayed === 0
      ? 0
      : Math.round((gamesWon / gamesPlayed) * 100);

    score.textContent = totalScore;
    streak.textContent = currentStreak;
    acc.textContent = accuracy + "%";

  } catch (err) {

    console.error(err);
    alert(err.message);

  }

});

// Play Button
if (playBtn) {

  playBtn.addEventListener("click", () => {

    window.location.href = "dailypuzzel.html";

  });

}
