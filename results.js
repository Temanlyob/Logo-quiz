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

    document.body.classList.add(
      "theme-light"
    );

  }

  else if (theme === "dark") {

    document.body.classList.add(
      "theme-dark"
    );

  }

  else {

    if (
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ) {

      document.body.classList.add(
        "theme-dark"
      );

    }

    else {

      document.body.classList.add(
        "theme-light"
      );

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

    if (
      currentTheme === "default"
    ) {

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
// RESULT ELEMENTS
// =====================================================

const resultIcon =
  document.getElementById("resultIcon");

const resultTitle =
  document.getElementById("resultTitle");

const scoreValue =
  document.getElementById("scoreValue");


// =====================================================
// PUZZLE DATE
// =====================================================

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

  return (
    d.getFullYear() +
    "-" +
    String(
      d.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      d.getDate()
    ).padStart(2, "0")
  );

}


// =====================================================
// MERGE ALL COMPLETED GAMES
//
// FIRESTORE = MAIN DATA
// LOCAL STORAGE = BACKUP
//
// IMPORTANT:
// We accept BOTH:
//
// played === true
// OR
// attempted === true
//
// Same puzzle key is counted only once.
// =====================================================

function getAllGames(
  firestoreHistory
) {

  const games = {};


  // ===================================================
  // FIRESTORE HISTORY
  // ===================================================

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
        typeof game !== "object"
      ) {

        continue;

      }


      const completed =
        game.played === true ||
        game.attempted === true;


      if (!completed) {

        continue;

      }


      games[key] = {
        ...game,
        played: true
      };

    }

  }


  // ===================================================
  // LOCAL STORAGE
  // ===================================================

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
        typeof game !== "object"
      ) {

        continue;

      }


      const completed =
        game.played === true ||
        game.attempted === true;


      if (!completed) {

        continue;

      }


      const puzzleKey =
        storageKey.substring(
          5
        );


      // Firestore already contains
      // this puzzle.
      //
      // Don't count twice.

      if (
        !games[puzzleKey]
      ) {

        games[puzzleKey] = {
          ...game,
          played: true
        };

      }

    }

    catch (error) {

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
// THIS IS THE IMPORTANT FIX.
//
// Total = every completed game.
//
// Won = correct true
// Lost = correct false
//
// No date restriction.
// No streak restriction.
// No same-day restriction.
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


    // -----------------------------------------------
    // TOTAL
    // -----------------------------------------------

    totalGames++;


    // -----------------------------------------------
    // WON
    // -----------------------------------------------

    if (
      game.correct === true
    ) {

      gamesWon++;

    }


    // -----------------------------------------------
    // LOST
    // -----------------------------------------------

    else if (
      game.correct === false
    ) {

      gamesLost++;

    }

  }


  // -------------------------------------------------
  // SAFETY CHECK
  //
  // Total should always be:
  //
  // Won + Lost
  //
  // If old/broken data has neither true nor false,
  // it is not counted as a completed result.
  // -------------------------------------------------

  totalGames =
    gamesWon +
    gamesLost;


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

    totalGames:
      totalGames,

    gamesWon:
      gamesWon,

    gamesLost:
      gamesLost,

    winRate:
      winRate

  };

}


// =====================================================
// ACTUAL PLAY DATES
//
// STREAK ONLY USES playedAt.
//
// Puzzle's original date is ignored.
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


    if (
      !game.playedAt
    ) {

      continue;

    }


    const playedDate =
      getLocalDateOnly(
        game.playedAt
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
// If today played:
//     today included.
//
// If today NOT played:
//     yesterday can still remain current.
//
// Streak is based on actual playing date.
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


  if (
    played.has(todayId)
  ) {

    cursor =
      today;

  }

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
      dateId(
        cursor
      );


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


    previous.setHours(
      0,
      0,
      0,
      0
    );


    currentDate.setHours(
      0,
      0,
      0,
      0
    );


    const diff =
      Math.round(
        (
          currentDate.getTime() -
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
      diff === 1
    ) {

      current++;

    }

    else {

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
// =====================================================

function getTodayScore(
  allGames
) {

  const today =
    getLocalDateOnly(
      new Date()
    );


  let todayScore = 0;


  for (
    const game of Object.values(
      allGames
    )
  ) {

    if (
      !game ||
      game.played !== true ||
      !game.playedAt
    ) {

      continue;

    }


    const playedDate =
      getLocalDateOnly(
        game.playedAt
      );


    if (
      playedDate &&
      playedDate.getTime() ===
      today.getTime()
    ) {

      todayScore +=
        Number(
          game.score || 0
        );

    }

  }


  return todayScore;

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
      // USER DOCUMENT
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


      let data = {};

      let history = {};

      let totalScore = 0;


      if (
        snap.exists()
      ) {

        data =
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
      // SAVE STREAK
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
      // TODAY SCORE
      // =================================================

      const todayScore =
        getTodayScore(
          allGames
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
      // ELEMENTS
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
      // SHOW TOTAL GAMES
      // =================================================

      if (
        totalGamesElement
      ) {

        totalGamesElement.textContent =
          totalGames;

      }


      // =================================================
      // SHOW WON
      // =================================================

      if (
        gamesWonElement
      ) {

        gamesWonElement.textContent =
          gamesWon;

      }


      // =================================================
      // SHOW LOST
      // =================================================

      if (
        gamesLostElement
      ) {

        gamesLostElement.textContent =
          gamesLost;

      }


      // =================================================
      // SHOW WIN RATE
      // =================================================

      if (
        winRateElement
      ) {

        winRateElement.textContent =
          winRate +
          "%";

      }


      // =================================================
      // SHOW CURRENT STREAK
      // =================================================

      if (
        currentStreakElement
      ) {

        currentStreakElement.textContent =
          currentStreak +
          " Days";

      }


      // =================================================
      // SHOW BEST STREAK
      // =================================================

      if (
        bestStreakElement
      ) {

        bestStreakElement.textContent =
          bestStreak +
          " Days";

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
