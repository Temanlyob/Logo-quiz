import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const username = document.getElementById("username");
const score = document.getElementById("score");
const streak = document.getElementById("streak");
const accuracy = document.getElementById("accuracy");
const played = document.getElementById("played");
const avatar = document.querySelector(".avatar");
const logoutBtn = document.querySelector(".logout-btn");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  if (user.photoURL) {
    avatar.src = user.photoURL;
  }

  try {

    const snap = await getDoc(doc(db, "users", user.uid));

    console.log("UID:", user.uid);
console.log("Document Exists:", snap.exists());

if (snap.exists()) {
  console.log("Data:", snap.data());
}

    if (!snap.exists()) return;

    const data = snap.data();

    username.textContent = data.username || user.displayName || "Player";

    score.textContent = data.totalScore || 0;

    streak.textContent = data.currentStreak || 0;

    const won = data.gamesWon || 0;
    const lost = data.gamesLost || 0;

    const total = won + lost;

    played.textContent = total;

    const acc =
      total > 0
        ? Math.round((won / total) * 100)
        : 0;

    accuracy.textContent = acc + "%";

  } catch (err) {
    console.error(err);
  }

});

logoutBtn.addEventListener("click", async () => {

  await signOut(auth);

  window.location.replace("login.html");

});
