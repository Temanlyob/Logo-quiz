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

    // DEFAULT = FOLLOW PHONE THEME

    if (
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ) {

      document.body.classList.add("theme-dark");

    } else {

      document.body.classList.add("theme-light");

    }

  }

}


// Initial theme
applyTheme(
  localStorage.getItem("theme") || "default"
);


// Follow phone theme changes
const systemTheme =
  window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

systemTheme.addEventListener(
  "change",
  () => {

    const currentTheme =
      localStorage.getItem("theme") || "default";

    if (currentTheme === "default") {

      applyTheme("default");

    }

  }
);


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

let puzzleDate =
  params.get("date");


if (!puzzleDate) {

  const now =
    new Date();

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const year =
    String(
      now.getFullYear()
    ).slice(-2);

  puzzleDate =
    `${day}-${month}-${year}`;

}


// =====================================
// PROCESS FLAG
// =====================================

const processedKey =
  "resultProcessed_" +
  puzzleDate;

const processed =
  localStorage.getItem(
    processedKey
  ) === "true";


// =====================================
// DATE HELPER
// =====================================

function parsePuzzleDate(dateKey) {

  const parts =
    dateKey.split("-");

  if (parts.length !== 3) {

    return null;

  }

  const day =
    Number(parts[0]);

  const month =
    Number(parts[1]);

  const year =
    Number("20" + parts[2]);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;

}


// =====================================
// GET PLAYED DATES
// FIRESTORE HISTORY
// =====================================

function getPlayedDates(history) {

  const dates = [];

  for (
    const key in history
  ) {

    const item =
      history[key];

    if (
      item &&
      item.played === true
    ) {

      const date =
        parsePuzzleDate(key);

      if (date) {

        dates.push(date);

      }

    }

  }

  // Remove duplicate dates
  const uniqueDates =
    dates.filter(
      (date, index, array) => {

        return index ===
          array.findIndex(
            other =>
              other.getTime() ===
              date.getTime()
          );

      }
    );

  // Old → New
  uniqueDates.sort(
    (a, b) =>
      a.getTime() -
      b.getTime()
  );

  return uniqueDates;

}


// =====================================
// CALCULATE CURRENT STREAK
// =====================================

function calculateCurrentStreak(
  playedDates
) {

  if (
    playedDates.length === 0
  ) {

    return 0;

  }


  // Start from latest played date
  let streak = 1;

  for (
    let i =
      playedDates.length - 1;
    i > 0;
    i--
  ) {

    const current =
      playedDates[i];

    const previous =
      playedDates[i - 1];

    const diffDays =
      Math.round(
        (
          current.getTime() -
          previous.getTime()
        ) /
        (
          1000 *
          60 *
          60 *
          24
        )
      );


    if (diffDays === 1) {

      streak++;

    } else {

      break;

    }

  }

  return streak;

}


// =====================================
// CALCULATE BEST STREAK
// =====================================

function calculateBestStreak(
  playedDates
) {

  if (
    playedDates.length === 0
  ) {

    return 0;

  }


  let best = 1;
  let current = 1;


  for (
    let i = 1;
    i < playedDates.length;
    i++
  ) {

    const diffDays =
      Math.round(
        (
          playedDates[i].getTime() -
          playedDates[i - 1].getTime()
        ) /
        (
          1000 *
          60 *
          60 *
          24
        )
      );


    if (diffDays === 1) {

      current++;

    } else {

      current = 1;

    }


    if (
      current > best
    ) {

      best = current;

    }

  }

  return best;

}


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

      let history = {};


      // =====================================
      // READ FIRESTORE
      // =====================================

      const snap =
        await getDoc(userRef);


      if (snap.exists()) {

        const data =
          snap.data();


        totalScore =
          Number(
            data.totalScore ?? 0
          );


        history =
          data.history ?? {};


        lastPlayed =
          data.lastPlayed ?? null;

      }


      // =====================================
      // COUNT GAMES
      // =====================================

      const playedGames =
        Object.values(history)
          .filter(
            item =>
              item &&
              item.played === true
          );


      puzzlesPlayed =
        playedGames.length;


      // =====================================
      // WON
      // =====================================

      gamesWon =
        playedGames.filter(
          item =>
            item.correct === true
        ).length;


      // =====================================
      // LOST
      // =====================================

      gamesLost =
        playedGames.filter(
          item =>
            item.correct === false
        ).length;


      // =====================================
      // PLAYED DATES
      // =====================================

      const playedDates =
        getPlayedDates(history);


      // =====================================
      // CURRENT STREAK
      // =====================================

      currentStreak =
        calculateCurrentStreak(
          playedDates
        );


      // =====================================
      // BEST STREAK
      // =====================================

      bestStreak =
        calculateBestStreak(
          playedDates
        );


      // =====================================
      // SAVE CORRECT CURRENT STREAK
      // =====================================

      /*
        Only save when we have played data.
        Streak is based ONLY on consecutive
        played dates.
      */

      if (
        playedDates.length > 0
      ) {

        const latestPlayed =
          playedDates[
            playedDates.length - 1
          ];


        lastPlayed =
          latestPlayed.toISOString();


        await setDoc(
          userRef,
          {
            currentStreak,
            bestStreak,
            lastPlayed
          },
          {
            merge: true
          }
        );

      }


      // =====================================
      // WIN RATE
      // =====================================

      const winRate =
        puzzlesPlayed === 0
          ? 0
          : Math.round(
              (
                gamesWon /
                puzzlesPlayed
              ) * 100
            );


      // =====================================
      // UPDATE UI
      // =====================================

      const totalGamesElement =
        document.getElementById(
          "totalGames"
        );

      const gamesWonElement =
        document.getElementById(
          "gamesWon"
        );

      const gamesLostElement =
        document.getElementById(
          "gamesLost"
        );

      const currentStreakElement =
        document.getElementById(
          "currentStreak"
        );

      const bestStreakElement =
        document.getElementById(
          "bestStreak"
        );

      const winRateElement =
        document.getElementById(
          "winRate"
        );


      if (totalGamesElement) {

        totalGamesElement.textContent =
          puzzlesPlayed;

      }


      if (gamesWonElement) {

        gamesWonElement.textContent =
          gamesWon;

      }


      if (gamesLostElement) {

        gamesLostElement.textContent =
          gamesLost;

      }


      if (currentStreakElement) {

        currentStreakElement.textContent =
          currentStreak + " Days";

      }


      if (bestStreakElement) {

        bestStreakElement.textContent =
          bestStreak + " Days";

      }


      if (winRateElement) {

        winRateElement.textContent =
          winRate + "%";

      }


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

if (homeBtn) {

  homeBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "home.html";

    }
  );

}


if (calendarBtn) {

  calendarBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "calendar.html";

    }
  );

}
