import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

console.log("HOME JS LOADED");


// =====================================================
// ELEMENTS
// =====================================================

const score =
  document.getElementById("totalScore");

const streak =
  document.getElementById("currentStreak");

const accuracy =
  document.getElementById("accuracy");

const achievementList =
  document.getElementById("achievementList");


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


// =====================================================
// PHONE THEME CHANGE
// =====================================================

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

  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


// =====================================================
// MERGE ALL GAMES
//
// Firestore + localStorage
//
// Same puzzle counted only once.
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
// GAME STATS
//
// ALL COMPLETED GAMES COUNT
//
// Puzzle date doesn't matter.
// How/when it was played doesn't matter.
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
// STREAK USES ONLY playedAt.
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
      game.played !== true ||
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
// TODAY PLAYED:
//   start from today.
//
// TODAY NOT PLAYED:
//   start from yesterday.
//
// Previous-day puzzle played today
// STILL COUNTS FOR TODAY.
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


  let currentStreak = 0;


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


    currentStreak++;


    cursor =
      new Date(cursor);

    cursor.setDate(
      cursor.getDate() - 1
    );

  }


  return currentStreak;

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
      0, 0, 0, 0
    );


    currentDate.setHours(
      0, 0, 0, 0
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
// LOAD PROGRESS
// =====================================================

async function loadProgress(user) {

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


    let data = {};


    if (
      snap.exists()
    ) {

      data =
        snap.data();

    }


    // =================================================
    // TOTAL SCORE
    // =================================================

    const totalScore =
      Number(
        data.totalScore || 0
      );


    // =================================================
    // ALL GAMES
    // =================================================

    const history =
      data.history || {};


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
    // UPDATE HOME
    // =================================================

    if (score) {

      score.textContent =
        totalScore;

    }


    if (streak) {

      streak.textContent =
        currentStreak;

    }


    if (accuracy) {

      accuracy.textContent =
        stats.winRate +
        "%";

    }


    // =================================================
    // ACHIEVEMENTS
    // =================================================

    renderAchievements({

      totalScore:
        totalScore,

      currentStreak:
        currentStreak,

      puzzlesPlayed:
        stats.totalGames,

      winRate:
        stats.winRate

    });


    // =================================================
    // LOCAL BACKUP
    // =================================================

    localStorage.setItem(
      "profileProgress",
      JSON.stringify({

        score:
          totalScore,

        streak:
          currentStreak,

        accuracy:
          stats.winRate,

        played:
          stats.totalGames

      })
    );


    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "HOME PROGRESS:",
      {

        score:
          totalScore,

        streak:
          currentStreak,

        bestStreak:
          bestStreak,

        played:
          stats.totalGames,

        won:
          stats.gamesWon,

        lost:
          stats.gamesLost,

        accuracy:
          stats.winRate,

        playDates:
          playDateIds

      }
    );

  }

  catch (error) {

    console.error(
      "HOME PROGRESS ERROR:",
      error
    );

  }

}


// =====================================================
// ACHIEVEMENTS
// =====================================================

function renderAchievements(stats) {

  if (!achievementList) {

    return;

  }


  let html = "";


  // ---------------------------------------------------
  // FIRST PUZZLE
  // ---------------------------------------------------

  if (
    stats.puzzlesPlayed >= 1
  ) {

    html += `

      <div class="achievement-item">

        <span>🥇</span>

        <div>

          <h3>Logo Rookie</h3>

          <p>
            Completed your first puzzle.
          </p>

        </div>

      </div>

    `;

  }


  // ---------------------------------------------------
  // 7 DAY STREAK
  // ---------------------------------------------------

  if (
    stats.currentStreak >= 7
  ) {

    html += `

      <div class="achievement-item">

        <span>🔥</span>

        <div>

          <h3>7 Day Streak</h3>

          <p>
            Solved puzzles for 7 consecutive days.
          </p>

        </div>

      </div>

    `;

  }


  // ---------------------------------------------------
  // 100 POINTS
  // ---------------------------------------------------

  if (
    stats.totalScore >= 100
  ) {

    html += `

      <div class="achievement-item">

        <span>⭐</span>

        <div>

          <h3>100 Points Club</h3>

          <p>
            Earned 100+ points.
          </p>

        </div>

      </div>

    `;

  }


  // ---------------------------------------------------
  // 30 PUZZLES
  // ---------------------------------------------------

  if (
    stats.puzzlesPlayed >= 30
  ) {

    html += `

      <div class="achievement-item">

        <span>🎮</span>

        <div>

          <h3>Puzzle Master</h3>

          <p>
            Played 30 puzzles.
          </p>

        </div>

      </div>

    `;

  }


  // ---------------------------------------------------
  // ACCURACY MASTER
  // ---------------------------------------------------

  if (
    stats.puzzlesPlayed >= 10 &&
    stats.winRate === 100
  ) {

    html += `

      <div class="achievement-item">

        <span>🎯</span>

        <div>

          <h3>Accuracy Master</h3>

          <p>
            100% accuracy in 10 puzzles.
          </p>

        </div>

      </div>

    `;

  }


  // ---------------------------------------------------
  // NO ACHIEVEMENT
  // ---------------------------------------------------

  if (
    html === ""
  ) {

    html = `

      <div class="achievement-item">

        <span>🔒</span>

        <div>

          <h3>No Achievements Yet</h3>

          <p>
            Keep playing to unlock achievements.
          </p>

        </div>

      </div>

    `;

  }


  achievementList.innerHTML =
    html;

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


    await loadProgress(
      user
    );

  }
);


// =====================================================
// REFRESH WHEN RETURNING
// =====================================================

window.addEventListener(
  "pageshow",
  async () => {

    const user =
      auth.currentUser;

    if (user) {

      await loadProgress(
        user
      );

    }

  }
);


// =====================================================
// REFRESH WHEN VISIBLE
// =====================================================

document.addEventListener(
  "visibilitychange",
  async () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      const user =
        auth.currentUser;

      if (user) {

        await loadProgress(
          user
        );

      }

    }

  }
);
