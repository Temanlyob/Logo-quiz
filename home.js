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

// Login Check
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  // Pehle UID dikhao
  alert("Logged in UID:\n" + user.uid);

  try {

    const snap = await getDoc(doc(db, "users", user.uid));

    alert("Document Exists: " + snap.exists());

    if (snap.exists()) {
      alert(JSON.stringify(snap.data()));
    }

    if (!snap.exists()) return;

    const data = snap.data();

    const totalScore = data.totalScore || 0;
    const currentStreak = data.currentStreak || 0;
    const gamesWon = data.gamesWon || 0;
    const gamesLost = data.gamesLost || 0;

    const gamesPlayed = gamesWon + gamesLost;

    const accuracy = gamesPlayed > 0
      ? Math.round((gamesWon / gamesPlayed) * 100)
      : 0;

    score.textContent = totalScore;
    streak.textContent = currentStreak;
    acc.textContent = accuracy + "%";

  } catch (e) {
    alert(e.message);
    console.error(e);
  }

});

// Play Button
if (playBtn) {
  playBtn.addEventListener("click", () => {
    window.location.href = "dailypuzzel.html";
  });
}
