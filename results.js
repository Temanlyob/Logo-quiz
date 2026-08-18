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
  localStorage.getItem("theme") || "default"
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
      localStorage.getItem("theme") || "default";

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
// PUZZLE DATE FROM URL
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
// ACTUAL PLAY DATE
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
// GET STREAK ELIGIBLE DATES
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


    // Only same-day puzzle counts
    // for streak.

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


  // Remove duplicate dates

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


  // Today's actual puzzle must
  // have been completed today.

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

    const diffDays =
      Math.round(
        (
          streakDates[i].getTime() -
          streakDates[i - 1].getTime()
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
// GET ALL GAMES
//
// Firestore = main source
// localStorage = backup
//
// Same puzzle date counted only once.
// =====================================

function getAllGames(
  firestoreHistory
) {

  const games = {};


  // ===================================
  // FIRESTORE HISTORY
  // ===================================

  for (
    const key in firestoreHistory
  ) {

    const item =
      firestoreHistory[key];


    if (
      !item ||
      item.played !== true
    ) {

      continue;

    }


    games[key] = {
      ...item
    };

  }


  // ===================================
  // LOCAL STORAGE BACKUP
  // ===================================

  for (
    let key in localStorage
  ) {

    if (
      !key.startsWith("quiz_")
    ) {

      continue;

    }


    const dateKey =
      key.replace(
        "quiz_",
        ""
      );


    try {

      const localQuiz =
        JSON.parse(
          localStorage.getItem(key)
        );


      if (
        !localQuiz ||
        localQuiz.attempted !== true
      ) {

        continue;

      }


      // Firestore already has this
      // puzzle → don't duplicate it.

      if (
        !games[dateKey]
      ) {

        games[dateKey] = {
          ...localQuiz
        };

      }

    } catch(error) {

      console.error(
        "LOCAL QUIZ ERROR:",
        error
      );

    }

  }


  return games;

}


// =====================================
// GET TODAY'S TOTAL SCORE
//
// Example:
//
// Previous puzzle completed today = +5
// Today's puzzle completed today   = +10
//
// Today's Score = +15
// =====================================

function getTodayScore(
  allGames
) {

  const today =
    getLocalDateOnly(
      new Date()
    );


  let todayScore = 0;


  for (
    const game of Object.values(allGames)
  ) {

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
        new Date(
          game.playedAt
        )
      );


    if (
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


      // =================================
      // ALL GAMES
      // =================================

      const allGames =
        getAllGames(
          history
        );


      // =================================
      // GAME COUNT
      //
      // COPIED FROM OLD RESULT LOGIC
      //
      // Every quiz_* attempted counts.
      // Previous-day puzzles also count.
      // =================================

      let puzzlesPlayed = 0;

      let gamesWon = 0;

      let gamesLost = 0;


      for (
        let key in localStorage
      ) {

        if (
          key.startsWith("quiz_")
        ) {

          try {

            const quiz =
              JSON.parse(
                localStorage.getItem(key)
              );


            if (
              quiz &&
              quiz.attempted === true
            ) {

              // Total Games
              puzzlesPlayed++;


              // Games Won
              if (
                quiz.correct === true
              ) {

                gamesWon++;

              }


              // Games Lost
              else if (
                quiz.correct === false
              ) {

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
      // CURRENT RESULT
      // =================================

      const currentResult =
        allGames[puzzleDate];


      // =================================
      // TODAY'S TOTAL SCORE
      // =================================

      const todayScore =
        getTodayScore(
          allGames
        );


      // =================================
      // RESULT UI
      // =================================

      if (
        currentResult
      ) {

        // -------------------------------
        // RESULT TITLE ALWAYS
        // -------------------------------

        resultTitle.innerHTML =
          "Today's Result";


        // -------------------------------
        // CURRENT PUZZLE RESULT
        // -------------------------------

        if (
          currentResult.correct === true
        ) {

          resultIcon.innerHTML =
            "🏆";

          resultIcon.style.color =
            "#22c55e";


          scoreValue.style.color =
            "#22c55e";

        } else {

          resultIcon.innerHTML =
            "❌";

          resultIcon.style.color =
            "#ef4444";


          scoreValue.style.color =
            "#ef4444";

        }


        // -------------------------------
        // TODAY'S COMBINED SCORE
        // -------------------------------

        scoreValue.textContent =
          "+" +
          todayScore;

      }


      else {

        // =================================
        // FALLBACK
        // =================================

        resultTitle.innerHTML =
          "Today's Result";


        const lastResult =
          localStorage.getItem(
            "lastResult"
          );


        if (
          lastResult === "correct"
        ) {

          resultIcon.innerHTML =
            "🏆";

          resultIcon.style.color =
            "#22c55e";

          scoreValue.textContent =
            "+" +
            todayScore;

          scoreValue.style.color =
            "#22c55e";

        } else {

          resultIcon.innerHTML =
            "❌";

          resultIcon.style.color =
            "#ef4444";

          scoreValue.textContent =
            "0";

          scoreValue.style.color =
            "#ef4444";

        }

      }


      // =================================
      // STREAK
      // =================================

      const streakDates =
        getStreakDates(
          allGames
        );


      const currentStreak =
        calculateCurrentStreak(
          streakDates
        );


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
      // UI ELEMENTS
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


      // =================================
      // SHOW TOTAL GAMES
      // =================================

      if (
        totalGamesElement
      ) {

        totalGamesElement.textContent =
          puzzlesPlayed;

      }


      // =================================
      // SHOW GAMES WON
      // =================================

      if (
        gamesWonElement
      ) {

        gamesWonElement.textContent =
          gamesWon;

      }


      // =================================
      // SHOW GAMES LOST
      // =================================

      if (
        gamesLostElement
      ) {

        gamesLostElement.textContent =
          gamesLost;

      }


      // =================================
      // SHOW CURRENT STREAK
      // =================================

      if (
        currentStreakElement
      ) {

        currentStreakElement.textContent =
          currentStreak +
          " Days";

      }


      // =================================
      // SHOW BEST STREAK
      // =================================

      if (
        bestStreakElement
      ) {

        bestStreakElement.textContent =
          bestStreak +
          " Days";

      }


      // =================================
      // SHOW WIN RATE
      // =================================

      if (
        winRateElement
      ) {

        winRateElement.textContent =
          winRate +
          "%";

      }


      // =================================
      // DEBUG
      // =================================

      console.log(
        "=============================="
      );

      console.log(
        "TOTAL GAMES:",
        puzzlesPlayed
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
        "TODAY'S SCORE:",
        todayScore
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


    } catch(error) {

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
