import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

console.log("RESULTS PAGE LOADED");

// =====================================
// THEME
// =====================================

function applyTheme(theme) {

  document.body.classList.remove(
    "theme-light",
    "theme-dark"
  );

  if (theme === "light") {

    document.body.classList.add("theme-light");

  } else if (theme === "dark") {

    document.body.classList.add("theme-dark");

  } else {

    // Default = follow phone system theme

    if (
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ) {

      document.body.classList.add("theme-dark");

    }

  }

}

applyTheme(
  localStorage.getItem("theme") || "default"
);

// If phone system theme changes
window.matchMedia(
  "(prefers-color-scheme: dark)"
).addEventListener("change", () => {

  const currentTheme =
    localStorage.getItem("theme") || "default";

  if (currentTheme === "default") {

    applyTheme("default");

  }

});

// =====================================
// BUTTONS
// =====================================

const homeBtn =
  document.getElementById("homeBtn");

const calendarBtn =
  document.getElementById("calendarBtn");

// =====================================
// RESULT UI
// =====================================

const resultIcon =
  document.getElementById("resultIcon");

const resultTitle =
  document.getElementById("resultTitle");

const scoreValue =
  document.getElementById("scoreValue");

// =====================================
// PUZZLE RESULT
// =====================================

const result =
  localStorage.getItem("lastResult");

const score =
  Number(
    localStorage.getItem("lastScore")
  ) || 0;

const isCorrect =
  result === "correct";

// =====================================
// PUZZLE DATE
// =====================================

const params =
  new URLSearchParams(
    window.location.search
  );

const puzzleDate =
  params.get("date") ||
  new Date()
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");

// =====================================
// PROCESS FLAG
// =====================================

const processedKey =
  "resultProcessed_" + puzzleDate;

const processed =
  localStorage.getItem(
    processedKey
  ) === "true";

// =====================================
// FIREBASE LOGIN
// =====================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.replace(
        "login.html"
      );

      return;

    }

    try {

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      // =====================================
      // DEFAULT VALUES
      // =====================================

      let totalScore = 0;
      let puzzlesPlayed = 0;
      let gamesWon = 0;
      let gamesLost = 0;
      let currentStreak = 0;
      let bestStreak = 0;
      let lastPlayed = null;

      // =====================================
      // READ FIRESTORE
      // =====================================

      const snap =
        await getDoc(userRef);

      if (snap.exists()) {

        const data =
          snap.data();

        totalScore =
          data.totalScore ?? 0;

        const history =
  data.history ?? {};

// =====================================
// GAME COUNT
// SAME DATA AS HOME PAGE
// =====================================

puzzlesPlayed = 0;
gamesWon = 0;
gamesLost = 0;

// Read all played puzzles from localStorage
for (let key in localStorage) {

  if (key.startsWith("quiz_")) {

    try {

      const quiz =
        JSON.parse(
          localStorage.getItem(key)
        );

      if (quiz && quiz.attempted === true) {

        // Total played
        puzzlesPlayed++;

        // Correct
        if (quiz.correct === true) {

          gamesWon++;

        }

        // Wrong
        else if (quiz.correct === false) {

          gamesLost++;

        }

      }

    } catch (error) {

      console.error(
        "Result quiz data error:",
        error
      );

    }

  }

}

        currentStreak =
          data.currentStreak ?? 0;

        bestStreak =
          data.bestStreak ?? 0;

        lastPlayed =
          data.lastPlayed ?? null;

      }

      // =====================================
      // UPDATE STATS
      // =====================================

      // =====================================
// UPDATE STREAK
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

  // Remove time from date
  puzzleDateObj.setHours(0, 0, 0, 0);

  if (!lastPlayed) {

    // First played puzzle
    currentStreak = 1;

  } else {

    const lastDate =
      new Date(lastPlayed);

    lastDate.setHours(0, 0, 0, 0);

    const diffDays =
      Math.round(
        (puzzleDateObj - lastDate) /
        (1000 * 60 * 60 * 24)
      );

    if (diffDays === 1) {

      // Played yesterday + today
      currentStreak++;

    } else if (diffDays === 0) {

      // Same day — don't increase
      currentStreak =
        currentStreak || 1;

    } else {

      // One or more days missed
      currentStreak = 1;

    }

  }

  // Best streak
  if (currentStreak > bestStreak) {

    bestStreak =
      currentStreak;

  }

  // Add score only if answer is correct
  if (isCorrect) {

    totalScore += score;

  }

  // Save latest played date
  lastPlayed =
    puzzleDateObj.toISOString();

  // =====================================
  // SAVE FIRESTORE
  // =====================================

  await setDoc(
    userRef,
    {
      totalScore,
      currentStreak,
      bestStreak,
      lastPlayed
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
        // SAVE FIRESTORE
        // =====================================

        await setDoc(
          userRef,
          {
            totalScore,
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
      // CALCULATE STATS
      // =====================================

      const winRate =
        puzzlesPlayed === 0
          ? 0
          : Math.round(
              (gamesWon /
                puzzlesPlayed) *
              100
            );

      // =====================================
      // UPDATE UI
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
      // RESULT UI
      // =====================================

      if (isCorrect) {

        resultIcon.innerHTML =
          "🏆";

        resultTitle.innerHTML =
          "Today's Result";

        scoreValue.innerHTML =
          "+" + score;

        scoreValue.style.color =
          "#22c55e";

      } else {

        resultIcon.innerHTML =
          "❌";

        resultTitle.innerHTML =
          "Better Luck Tomorrow";

        scoreValue.innerHTML =
          "0";

        scoreValue.style.color =
          "#ef4444";

      }

    } catch (error) {

      console.error(
        "RESULTS ERROR:",
        error
      );

    }

  }
);

// =====================================
// BUTTONS
// =====================================

homeBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "home.html";

  }
);

calendarBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "calendar.html";

  }
);
