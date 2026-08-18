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
// DATE HELPERS
// =====================================

function getLocalDateOnly(date) {

  const result =
    new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;

}


function dateKeyFromDate(date) {

  const d =
    String(
      date.getDate()
    ).padStart(2, "0");

  const m =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const y =
    String(
      date.getFullYear()
    ).slice(-2);

  return `${d}-${m}-${y}`;

}


// =====================================
// GET ACTUAL PLAYED DATES
//
// IMPORTANT:
// This uses playedAt.
// NOT the puzzle date.
//
// Example:
//
// 17 Aug puzzle completed on 18 Aug
// => played date = 18 Aug
//
// Therefore 17 Aug does NOT count
// as a streak day.
// =====================================

function getActualPlayedDates(history) {

  const dates = [];

  for (const key in history) {

    const item =
      history[key];

    if (
      !item ||
      item.played !== true
    ) {

      continue;

    }


    // playedAt is the REAL day
    // user completed the puzzle.

    if (!item.playedAt) {

      continue;

    }


    const playedAt =
      new Date(
        item.playedAt
      );


    if (
      Number.isNaN(
        playedAt.getTime()
      )
    ) {

      continue;

    }


    const localDate =
      getLocalDateOnly(
        playedAt
      );


    dates.push(
      localDate
    );

  }


  // Remove duplicate actual
  // calendar days.

  const uniqueDates = [];


  for (
    const date of dates
  ) {

    const exists =
      uniqueDates.some(
        existing =>
          existing.getTime() ===
          date.getTime()
      );


    if (!exists) {

      uniqueDates.push(
        date
      );

    }

  }


  // Old → New

  uniqueDates.sort(
    (a, b) =>
      a.getTime() -
      b.getTime()
  );


  return uniqueDates;

}


// =====================================
// CURRENT STREAK
//
// RULE:
//
// Today played       = streak starts
// Yesterday played   = +1
// Previous day       = +1
//
// Any missing day
// immediately breaks
// the current streak.
//
// If user has NOT played today:
// Current Streak = 0
// =====================================

function calculateCurrentStreak(
  playedDates
) {

  if (
    playedDates.length === 0
  ) {

    return 0;

  }


  const today =
    getLocalDateOnly(
      new Date()
    );


  const latestPlayed =
    playedDates[
      playedDates.length - 1
    ];


  // User hasn't played today.
  // Therefore current streak is 0.

  if (
    latestPlayed.getTime() !==
    today.getTime()
  ) {

    return 0;

  }


  // Today counts as 1.

  let streak = 1;


  // Move backwards.

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


    if (
      diffDays === 1
    ) {

      // Consecutive day

      streak++;

    } else {

      // A day was missed.
      // STOP immediately.

      break;

    }

  }


  return streak;

}


// =====================================
// BEST STREAK
//
// Best streak is calculated from
// ALL actual played dates.
//
// Old streaks remain recorded
// as best streak.
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

    const currentDate =
      playedDates[i];

    const previousDate =
      playedDates[i - 1];


    const diffDays =
      Math.round(
        (
          currentDate.getTime() -
          previousDate.getTime()
        ) /
        (
          1000 *
          60 *
          60 *
          24
        )
      );


    if (
      diffDays === 1
    ) {

      current++;

    } else {

      // Streak broken.
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
// FIREBASE AUTH
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

      // =================================
      // USER DOCUMENT
      // =================================

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );


      const snap =
        await getDoc(
          userRef
        );


      let totalScore = 0;

      let history = {};


      if (
        snap.exists()
      ) {

        const data =
          snap.data();


        totalScore =
          Number(
            data.totalScore ?? 0
          );


        history =
          data.history ?? {};

      }


      // =================================
      // GAME COUNTS
      // =================================

      const playedGames =
        Object.values(
          history
        ).filter(
          item =>
            item &&
            item.played === true
        );


      const puzzlesPlayed =
        playedGames.length;


      const gamesWon =
        playedGames.filter(
          item =>
            item.correct === true
        ).length;


      const gamesLost =
        playedGames.filter(
          item =>
            item.correct === false
        ).length;


      // =================================
      // ACTUAL PLAYED DATES
      // =================================

      const playedDates =
        getActualPlayedDates(
          history
        );


      // =================================
      // CURRENT STREAK
      // =================================

      const currentStreak =
        calculateCurrentStreak(
          playedDates
        );


      // =================================
      // BEST STREAK
      // =================================

      const bestStreak =
        calculateBestStreak(
          playedDates
        );


      // =================================
      // SAVE STREAK
      // =================================

      await setDoc(
        userRef,
        {
          currentStreak:
            currentStreak,

          bestStreak:
            bestStreak
        },
        {
          merge: true
        }
      );


      // =================================
      // WIN RATE
      // =================================

      const winRate =
        puzzlesPlayed === 0
          ? 0
          : Math.round(
              (
                gamesWon /
                puzzlesPlayed
              ) * 100
            );


      // =================================
      // UPDATE UI
      // =================================

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


      if (
        totalGamesElement
      ) {

        totalGamesElement.textContent =
          puzzlesPlayed;

      }


      if (
        gamesWonElement
      ) {

        gamesWonElement.textContent =
          gamesWon;

      }


      if (
        gamesLostElement
      ) {

        gamesLostElement.textContent =
          gamesLost;

      }


      if (
        currentStreakElement
      ) {

        currentStreakElement.textContent =
          currentStreak +
          " Days";

      }


      if (
        bestStreakElement
      ) {

        bestStreakElement.textContent =
          bestStreak +
          " Days";

      }


      if (
        winRateElement
      ) {

        winRateElement.textContent =
          winRate +
          "%";

      }


      // =================================
      // TODAY'S RESULT
      // =================================

      if (
        isCorrect
      ) {

        resultIcon.innerHTML =
          "🏆";

        resultTitle.innerHTML =
          "Today's Result";

        scoreValue.innerHTML =
          "+" +
          score;

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
