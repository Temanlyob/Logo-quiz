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

    document.body.classList.add(
      "theme-light"
    );

  } else if (theme === "dark") {

    document.body.classList.add(
      "theme-dark"
    );

  } else {

    if (
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ) {

      document.body.classList.add(
        "theme-dark"
      );

    } else {

      document.body.classList.add(
        "theme-light"
      );

    }

  }

}


// Initial theme
applyTheme(
  localStorage.getItem("theme") ||
  "default"
);


// Follow phone theme
const systemTheme =
  window.matchMedia(
    "(prefers-color-scheme: dark)"
  );


systemTheme.addEventListener(
  "change",
  () => {

    const currentTheme =
      localStorage.getItem("theme") ||
      "default";

    if (
      currentTheme === "default"
    ) {

      applyTheme("default");

    }

  }
);


// =====================================
// BUTTONS
// =====================================

const homeBtn =
  document.getElementById(
    "homeBtn"
  );

const calendarBtn =
  document.getElementById(
    "calendarBtn"
  );


// =====================================
// RESULT UI
// =====================================

const resultIcon =
  document.getElementById(
    "resultIcon"
  );

const resultTitle =
  document.getElementById(
    "resultTitle"
  );

const scoreValue =
  document.getElementById(
    "scoreValue"
  );


// =====================================
// URL PUZZLE DATE
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


console.log(
  "RESULT PUZZLE DATE:",
  puzzleDate
);


// =====================================
// DATE HELPERS
// =====================================

function parseDateKey(dateKey) {

  const parts =
    dateKey.split("-");


  if (
    parts.length !== 3
  ) {

    return null;

  }


  const day =
    Number(parts[0]);

  const month =
    Number(parts[1]) - 1;

  const year =
    Number(
      "20" + parts[2]
    );


  const date =
    new Date(
      year,
      month,
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


// =====================================
// GET ACTUAL PLAY DATE
// =====================================

function getActualPlayDate(item) {

  if (
    !item ||
    !item.playedAt
  ) {

    return null;

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

    return null;

  }


  return getLocalDateOnly(
    playedAt
  );

}


// =====================================
// GET STREAK-ELIGIBLE DATES
//
// IMPORTANT:
//
// A puzzle completed late does NOT
// create a streak.
//
// Example:
//
// 17 Aug puzzle completed on 18 Aug
//
// 18 Aug = actual play date
// BUT if it was 17 Aug puzzle,
// it does NOT create a streak day.
//
// Only the puzzle of the actual day
// can create a streak day.
// =====================================

function getStreakDates(history) {

  const dates = [];


  for (
    const key in history
  ) {

    const item =
      history[key];


    if (
      !item ||
      item.played !== true
    ) {

      continue;

    }


    const actualPlayDate =
      getActualPlayDate(
        item
      );


    if (!actualPlayDate) {

      continue;

    }


    const puzzleDateObj =
      parseDateKey(key);


    if (!puzzleDateObj) {

      continue;

    }


    // =================================
    // ONLY SAME-DAY PUZZLES COUNT
    // =================================

    if (
      puzzleDateObj.getTime() !==
      actualPlayDate.getTime()
    ) {

      continue;

    }


    dates.push(
      actualPlayDate
    );

  }


  // =================================
  // REMOVE DUPLICATE DAYS
  // =================================

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
// Rules:
//
// Today played = streak active.
//
// Yesterday + today = 2.
//
// If ANY calendar day was missed,
// streak breaks.
//
// Previous puzzle completed later
// cannot revive old streak.
// =====================================

function calculateCurrentStreak(
  streakDates
) {

  if (
    streakDates.length === 0
  ) {

    return 0;

  }


  const today =
    getLocalDateOnly(
      new Date()
    );


  const latest =
    streakDates[
      streakDates.length - 1
    ];


  // User did not play today's
  // actual daily puzzle.
  if (
    latest.getTime() !==
    today.getTime()
  ) {

    return 0;

  }


  let streak = 1;


  for (
    let i =
      streakDates.length - 1;
    i > 0;
    i--
  ) {

    const current =
      streakDates[i];

    const previous =
      streakDates[i - 1];


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

      streak++;

    } else {

      // A day was missed.
      // Stop here.
      break;

    }

  }


  return streak;

}


// =====================================
// BEST STREAK
// =====================================

function calculateBestStreak(
  streakDates
) {

  if (
    streakDates.length === 0
  ) {

    return 0;

  }


  let best = 1;

  let current = 1;


  for (
    let i = 1;
    i < streakDates.length;
    i++
  ) {

    const currentDate =
      streakDates[i];

    const previousDate =
      streakDates[i - 1];


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

      current = 1;

    }


    if (
      current > best
    ) {

      best =
        current;

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


      if (!snap.exists()) {

        console.error(
          "User document not found."
        );

        return;

      }


      const data =
        snap.data();


      const history =
        data.history || {};


      const totalScore =
        Number(
          data.totalScore || 0
        );


      // =================================
      // CURRENT RESULT
      // =================================

      const currentResult =
        history[puzzleDate];


      if (
        currentResult
      ) {

        const actualScore =
          Number(
            currentResult.score || 0
          );


        // =================================
        // SHOW ACTUAL SCORE
        // =================================

        scoreValue.textContent =
          currentResult.correct
            ? "+" + actualScore
            : "0";


        // =================================
        // RESULT COLOR
        // =================================

        if (
          currentResult.correct
        ) {

          scoreValue.style.color =
            "#22c55e";

        } else {

          scoreValue.style.color =
            "#ef4444";

        }


        // =================================
        // RESULT TITLE
        // =================================

        if (
          currentResult.correct
        ) {

          resultIcon.innerHTML =
            "🏆";

          resultTitle.innerHTML =
            "Correct!";

        } else {

          resultIcon.innerHTML =
            "❌";

          resultTitle.innerHTML =
            "Incorrect!";

        }

      } else {

        // Fallback
        // If no history exists.

        const lastResult =
          localStorage.getItem(
            "lastResult"
          );


        const lastScore =
          Number(
            localStorage.getItem(
              "lastScore"
            )
          ) || 0;


        if (
          lastResult ===
          "correct"
        ) {

          scoreValue.textContent =
            "+" + lastScore;

          scoreValue.style.color =
            "#22c55e";

          resultIcon.innerHTML =
            "🏆";

          resultTitle.innerHTML =
            "Correct!";

        } else {

          scoreValue.textContent =
            "0";

          scoreValue.style.color =
            "#ef4444";

          resultIcon.innerHTML =
            "❌";

          resultTitle.innerHTML =
            "Incorrect!";

        }

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
      // STREAK DATES
      // =================================

      const streakDates =
        getStreakDates(
          history
        );


      // =================================
      // CURRENT STREAK
      // =================================

      const currentStreak =
        calculateCurrentStreak(
          streakDates
        );


      // =================================
      // BEST STREAK
      // =================================

      const bestStreak =
        calculateBestStreak(
          streakDates
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
          merge:
            true
        }
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


      console.log(
        "Total games:",
        puzzlesPlayed
      );

      console.log(
        "Won:",
        gamesWon
      );

      console.log(
        "Lost:",
        gamesLost
      );

      console.log(
        "Current streak:",
        currentStreak
      );

      console.log(
        "Best streak:",
        bestStreak
      );

      console.log(
        "Win rate:",
        winRate
      );

      console.log(
        "Total score:",
        totalScore
      );


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
