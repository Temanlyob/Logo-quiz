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


// =====================================================
// THEME
// =====================================================

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


// =====================================================
// BUTTONS
// =====================================================

const homeBtn =
  document.getElementById("homeBtn");

const calendarBtn =
  document.getElementById("calendarBtn");


// =====================================================
// RESULT UI
// =====================================================

const resultIcon =
  document.getElementById("resultIcon");

const resultTitle =
  document.getElementById("resultTitle");

const scoreValue =
  document.getElementById("scoreValue");


// =====================================================
// PUZZLE DATE FROM URL
// =====================================================

const params =
  new URLSearchParams(
    window.location.search
  );

let puzzleDate =
  params.get("date");


if (!puzzleDate) {

  const now = new Date();

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


// =====================================================
// DATE HELPERS
// =====================================================

function getLocalDateOnly(date) {

  const d =
    new Date(date);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {

    return null;

  }

  d.setHours(
    0,
    0,
    0,
    0
  );

  return d;

}


function dateId(date) {

  const d =
    getLocalDateOnly(date);

  if (!d) {

    return "";

  }

  const year =
    d.getFullYear();

  const month =
    String(
      d.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      d.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function daysBetween(a, b) {

  const one =
    getLocalDateOnly(a);

  const two =
    getLocalDateOnly(b);

  if (!one || !two) {

    return 0;

  }

  return Math.round(
    (
      two.getTime() -
      one.getTime()
    ) /
    (
      1000 *
      60 *
      60 *
      24
    )
  );

}


// =====================================================
// GET ACTUAL PLAY DATE
//
// IMPORTANT:
// Puzzle date is NOT used for streak.
//
// Only playedAt matters.
// =====================================================

function getActualPlayDate(game) {

  if (
    !game ||
    !game.playedAt
  ) {

    return null;

  }

  return getLocalDateOnly(
    game.playedAt
  );

}


// =====================================================
// MERGE ALL GAMES
//
// Firestore + localStorage
//
// Same puzzle = one game.
// =====================================================

function getAllGames(
  firestoreHistory
) {

  const games = {};


  // ---------------------------------------------------
  // FIRESTORE
  // ---------------------------------------------------

  if (
    firestoreHistory &&
    typeof firestoreHistory === "object"
  ) {

    for (
      const key in firestoreHistory
    ) {

      const game =
        firestoreHistory[key];

      if (
        !game ||
        game.played !== true
      ) {

        continue;

      }

      games[key] = {
        ...game
      };

    }

  }


  // ---------------------------------------------------
  // LOCAL STORAGE
  // ---------------------------------------------------

  for (
    let i = 0;
    i < localStorage.length;
    i++
  ) {

    const storageKey =
      localStorage.key(i);

    if (
      !storageKey ||
      !storageKey.startsWith("quiz_")
    ) {

      continue;

    }


    try {

      const game =
        JSON.parse(
          localStorage.getItem(
            storageKey
          )
        );


      if (
        !game ||
        game.attempted !== true
      ) {

        continue;

      }


      const puzzleKey =
        storageKey.replace(
          "quiz_",
          ""
        );


      // Firestore already has this
      // puzzle → don't duplicate.

      if (
        !games[puzzleKey]
      ) {

        games[puzzleKey] = {
          ...game,
          played: true
        };

      }

    } catch (error) {

      console.error(
        "LOCAL GAME ERROR:",
        error
      );

    }

  }


  return games;

}


// =====================================================
// GAME STATISTICS
//
// ALL COMPLETED GAMES
//
// No restriction on puzzle date.
// No restriction on play method.
// =====================================================

function calculateGameStats(
  allGames
) {

  let totalGames = 0;

  let gamesWon = 0;

  let gamesLost = 0;


  for (
    const key in allGames
  ) {

    const game =
      allGames[key];


    if (
      !game ||
      game.played !== true
    ) {

      continue;

    }


    totalGames++;


    if (
      game.correct === true
    ) {

      gamesWon++;

    }

    else if (
      game.correct === false
    ) {

      gamesLost++;

    }

  }


  const winRate =
    totalGames === 0
      ? 0
      : Math.round(
          (
            gamesWon /
            totalGames
          ) * 100
        );


  return {

    totalGames,
    gamesWon,
    gamesLost,
    winRate

  };

}


// =====================================================
// GET UNIQUE ACTUAL PLAY DATES
//
// Example:
//
// 1 Sept puzzle played 1 Sept
// 2 Sept puzzle played 3 Sept
// 5 Sept puzzle played 5 Sept
//
// Streak dates:
//
// 1 Sept
// 3 Sept
// 5 Sept
//
// Puzzle date is irrelevant.
// =====================================================

function getActualPlayDates(
  allGames
) {

  const dateSet =
    new Set();


  for (
    const key in allGames
  ) {

    const game =
      allGames[key];


    if (
      !game ||
      game.played !== true
    ) {

      continue;

    }


    const playedDate =
      getActualPlayDate(
        game
      );


    if (!playedDate) {

      continue;

    }


    dateSet.add(
      dateId(
        playedDate
      )
    );

  }


  return Array.from(
    dateSet
  ).sort();

}


// =====================================================
// CURRENT STREAK
//
// RULE:
//
// If user played today:
//     start from today.
//
// If user did NOT play today:
//     start from yesterday.
//
// Then go backward one day at a time.
//
// Any game played that day counts.
// =====================================================

function calculateCurrentStreak(
  playDateIds
) {

  if (
    playDateIds.length === 0
  ) {

    return 0;

  }


  const played =
    new Set(
      playDateIds
    );


  const today =
    getLocalDateOnly(
      new Date()
    );


  const todayId =
    dateId(
      today
    );


  let cursor;


  // ---------------------------------------------------
  // TODAY PLAYED
  // ---------------------------------------------------

  if (
    played.has(todayId)
  ) {

    cursor =
      today;

  }

  // ---------------------------------------------------
  // TODAY NOT PLAYED
  //
  // Yesterday can still be current streak.
  // ---------------------------------------------------

  else {

    cursor =
      new Date(today);

    cursor.setDate(
      cursor.getDate() - 1
    );

  }


  let streak = 0;


  while (true) {

    const id =
      dateId(cursor);


    if (
      !played.has(id)
    ) {

      break;

    }


    streak++;


    cursor =
      new Date(cursor);

    cursor.setDate(
      cursor.getDate() - 1
    );

  }


  return streak;

}


// =====================================================
// BEST STREAK
// =====================================================

function calculateBestStreak(
  playDateIds
) {

  if (
    playDateIds.length === 0
  ) {

    return 0;

  }


  let best = 1;

  let current = 1;


  for (
    let i = 1;
    i < playDateIds.length;
    i++
  ) {

    const previous =
      new Date(
        playDateIds[i - 1]
      );


    const currentDate =
      new Date(
        playDateIds[i]
      );


    const diff =
      daysBetween(
        previous,
        currentDate
      );


    if (
      diff === 1
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


// =====================================================
// TODAY'S SCORE
//
// All games played today.
// =====================================================

function getTodayScore(
  allGames
) {

  const today =
    getLocalDateOnly(
      new Date()
    );


  let score = 0;


  for (
    const key in allGames
  ) {

    const game =
      allGames[key];


    if (
      !game ||
      game.played !== true ||
      !game.playedAt
    ) {

      continue;

    }


    const playedDate =
      getActualPlayDate(
        game
      );


    if (
      playedDate &&
      playedDate.getTime() ===
      today.getTime()
    ) {

      score +=
        Number(
          game.score || 0
        );

    }

  }


  return score;

}


// =====================================================
// AUTH
// =====================================================

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

      // =================================================
      // FIRESTORE USER
      // =================================================

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


      let history = {};

      let totalScore = 0;


      if (
        snap.exists()
      ) {

        const data =
          snap.data();


        history =
          data.history || {};


        totalScore =
          Number(
            data.totalScore || 0
          );

      }


      // =================================================
      // ALL GAMES
      // =================================================

      const allGames =
        getAllGames(
          history
        );


      // =================================================
      // GAME STATS
      // =================================================

      const stats =
        calculateGameStats(
          allGames
        );


      const totalGames =
        stats.totalGames;

      const gamesWon =
        stats.gamesWon;

      const gamesLost =
        stats.gamesLost;

      const winRate =
        stats.winRate;


      // =================================================
      // TODAY SCORE
      // =================================================

      const todayScore =
        getTodayScore(
          allGames
        );


      // =================================================
      // STREAK
      // =================================================

      const playDateIds =
        getActualPlayDates(
          allGames
        );


      const currentStreak =
        calculateCurrentStreak(
          playDateIds
        );


      const bestStreak =
        calculateBestStreak(
          playDateIds
        );


      // =================================================
      // SAVE CALCULATED STREAK
      // =================================================

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


      // =================================================
      // CURRENT PUZZLE
      // =================================================

      const currentResult =
        allGames[puzzleDate];


      // =================================================
      // RESULT UI
      // =================================================

      resultTitle.textContent =
        "Today's Result";


      if (
        currentResult &&
        currentResult.correct === true
      ) {

        resultIcon.textContent =
          "🏆";

        resultIcon.style.color =
          "#22c55e";

        scoreValue.style.color =
          "#22c55e";

        scoreValue.textContent =
          "+" +
          todayScore;

      }

      else if (
        currentResult &&
        currentResult.correct === false
      ) {

        resultIcon.textContent =
          "❌";

        resultIcon.style.color =
          "#ef4444";

        scoreValue.style.color =
          "#ef4444";

        scoreValue.textContent =
          "+" +
          todayScore;

      }

      else {

        const lastResult =
          localStorage.getItem(
            "lastResult"
          );


        if (
          lastResult === "correct"
        ) {

          resultIcon.textContent =
            "🏆";

          resultIcon.style.color =
            "#22c55e";

          scoreValue.style.color =
            "#22c55e";

          scoreValue.textContent =
            "+" +
            todayScore;

        }

        else {

          resultIcon.textContent =
            "❌";

          resultIcon.style.color =
            "#ef4444";

          scoreValue.style.color =
            "#ef4444";

          scoreValue.textContent =
            "0";

        }

      }


      // =================================================
      // UI ELEMENTS
      // =================================================

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


      // =================================================
      // SHOW STATS
      // =================================================

      if (
        totalGamesElement
      ) {

        totalGamesElement.textContent =
          totalGames;

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


      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "=============================="
      );

      console.log(
        "TOTAL GAMES:",
        totalGames
      );

      console.log(
        "GAMES WON:",
        gamesWon
      );

      console.log(
        "GAMES LOST:",
        gamesLost
      );

      console.log(
        "WIN RATE:",
        winRate + "%"
      );

      console.log(
        "CURRENT STREAK:",
        currentStreak
      );

      console.log(
        "BEST STREAK:",
        bestStreak
      );

      console.log(
        "PLAY DATES:",
        playDateIds
      );

      console.log(
        "TOTAL SCORE:",
        totalScore
      );

      console.log(
        "ALL GAMES:",
        allGames
      );

      console.log(
        "=============================="
      );

    }

    catch (error) {

      console.error(
        "RESULTS ERROR:",
        error
      );

    }

  }
);


// =====================================================
// BUTTONS
// =====================================================

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
