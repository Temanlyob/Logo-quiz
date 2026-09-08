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
// GET ALL GAMES
//
// Firestore = main source
// localStorage = backup
//
// Same puzzle is counted only once.
// =====================================================

function getAllGames(
  firestoreHistory
) {

  const games = {};


  // ---------------------------------------------------
  // FIRESTORE HISTORY
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
        typeof game !== "object"
      ) {

        continue;

      }


      /*
       * A puzzle is considered completed when
       * either played OR attempted is true.
       */

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

      const raw =
        localStorage.getItem(
          storageKey
        );


      const game =
        JSON.parse(
          raw
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


      /*
       * Firestore already has this puzzle.
       * Therefore don't count it again.
       */

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
// TOTAL SCORE
//
// IMPORTANT:
//
// Total Score is NOT taken from old
// data.totalScore.
//
// It is calculated fresh:
//
// Puzzle 1 score
// + Puzzle 2 score
// + Puzzle 3 score
// + ...
//
// Every completed puzzle is included.
// =====================================================

function calculateTotalScore(
  allGames
) {

  let totalScore = 0;


  for (
    const game of Object.values(
      allGames
    )
  ) {

    if (
      !game ||
      game.played !== true
    ) {

      continue;

    }


    const gameScore =
      Number(
        game.score
      );


    if (
      Number.isFinite(
        gameScore
      )
    ) {

      totalScore +=
        gameScore;

    }

  }


  return totalScore;

}


// =====================================================
// GAME STATS
//
// Total Games = completed games
// Won = correct === true
// Lost = correct === false
//
// Puzzle date does NOT matter.
// =====================================================

function calculateGameStats(
  allGames
) {

  let totalGames = 0;

  let gamesWon = 0;

  let gamesLost = 0;


  for (
    const game of Object.values(
      allGames
    )
  ) {

    if (
      !game ||
      game.played !== true
    ) {

      continue;

    }


    /*
     * Only count games which actually
     * have a result.
     */

    if (
      game.correct !== true &&
      game.correct !== false
    ) {

      continue;

    }


    totalGames++;


    if (
      game.correct === true
    ) {

      gamesWon++;

    }

    else {

      gamesLost++;

    }

  }


  /*
   * Safety:
   * Total must always equal Won + Lost.
   */

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
// Streak uses playedAt.
//
// Puzzle's original date is ignored.
// =====================================================

function getActualPlayDates(
  allGames
) {

  const dateSet =
    new Set();


  for (
    const game of Object.values(
      allGames
    )
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
// If today was played:
//     today counts.
//
// If today was not played:
//     yesterday can still remain active.
//
// Multiple puzzles on same day:
//     counts as ONE streak day.
//
// Previous-day puzzle played today:
//     counts for TODAY.
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
      new Date(
        today
      );

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
      new Date(
        cursor
      );

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
// LOAD PROGRESS
// =====================================================

async function loadProgress(
  user
) {

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
    // HISTORY
    // =================================================

    const history =
      data.history || {};


    // =================================================
    // ALL GAMES
    // =================================================

    const allGames =
      getAllGames(
        history
      );


    // =================================================
    // TOTAL SCORE
    // =================================================
    //
    // Calculate fresh from every puzzle.
    //

    const totalScore =
      calculateTotalScore(
        allGames
      );


    // =================================================
    // GAME STATS
    // =================================================

    const stats =
      calculateGameStats(
        allGames
      );


    // =================================================
    // ACTUAL PLAY DATES
    // =================================================

    const playDateIds =
      getActualPlayDates(
        allGames
      );


    // =================================================
    // CURRENT STREAK
    // =================================================

    const currentStreak =
      calculateCurrentStreak(
        playDateIds
      );


    // =================================================
    // BEST STREAK
    // =================================================

    const bestStreak =
      calculateBestStreak(
        playDateIds
      );


    // =================================================
    // SAVE CALCULATED PROGRESS
    //
    // This updates Firestore so the calculated
    // Total Score and streak remain available.
    // =================================================

    await setDoc(
      userRef,
      {

        totalScore:
          totalScore,

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
          playDateIds,

        allGames:
          allGames

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

function renderAchievements(
  stats
) {

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
// REFRESH WHEN RETURNING TO HOME
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
// REFRESH WHEN PAGE BECOMES VISIBLE
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
