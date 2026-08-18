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
// DATE PARSER
// =====================================

function parseDateKey(dateKey) {

  const parts =
    dateKey.split("-");

  if (parts.length !== 3) {

    return null;

  }

  const day =
    Number(parts[0]);

  const month =
    Number(parts[1]) - 1;

  const year =
    Number("20" + parts[2]);

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


// =====================================
// GET ALL PLAYED DATES
// =====================================

function getPlayedDates() {

  const dates = [];

  for (const key in localStorage) {

    if (!key.startsWith("quiz_")) {
      continue;
    }

    try {

      const quiz =
        JSON.parse(
          localStorage.getItem(key)
        );

      if (
        !quiz ||
        quiz.attempted !== true
      ) {

        continue;

      }

      const dateKey =
        key.replace("quiz_", "");

      const date =
        parseDateKey(dateKey);

      if (date) {

        dates.push({
          key: dateKey,
          date
        });

      }

    } catch (error) {

      console.error(
        "QUIZ DATE ERROR:",
        error
      );

    }

  }


  // Remove duplicates
  const unique = [];

  for (const item of dates) {

    const exists =
      unique.some(
        x =>
          x.date.getTime() ===
          item.date.getTime()
      );

    if (!exists) {

      unique.push(item);

    }

  }


  // Old → New
  unique.sort(
    (a, b) =>
      a.date.getTime() -
      b.date.getTime()
  );

  return unique;

}


// =====================================
// CALCULATE CURRENT STREAK
// =====================================

// =====================================
// CALCULATE CURRENT STREAK
// =====================================

function calculateCurrentStreak(playedDates) {

  if (playedDates.length === 0) {

    return 0;

  }


  // Today — without time
  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  // Latest played date
  const latestPlayed =
    playedDates[
      playedDates.length - 1
    ].date;


  // If user did NOT play today,
  // current streak is broken.
  if (
    latestPlayed.getTime() !==
    today.getTime()
  ) {

    return 0;

  }


  // Today was played
  let streak = 1;


  // Go backwards and check
  // every consecutive day
  for (
    let i =
      playedDates.length - 1;
    i > 0;
    i--
  ) {

    const current =
      playedDates[i].date;

    const previous =
      playedDates[i - 1].date;


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


    // Previous day was also played
    if (
      diffDays === 1
    ) {

      streak++;

    } else {

      // A day was missed.
      // Stop counting the old streak.
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
          playedDates[i].date.getTime() -
          playedDates[i - 1].date.getTime()
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
// FIREBASE
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
      // READ FIRESTORE
      // =====================================

      const snap =
        await getDoc(userRef);

      let totalScore = 0;

      if (snap.exists()) {

        const data =
          snap.data();

        totalScore =
          Number(
            data.totalScore ?? 0
          );

      }


      // =====================================
      // PLAYED GAMES
      // =====================================

      const playedGames = [];

      for (const key in localStorage) {

        if (!key.startsWith("quiz_")) {
          continue;
        }

        try {

          const quiz =
            JSON.parse(
              localStorage.getItem(key)
            );

          if (
            quiz &&
            quiz.attempted === true
          ) {

            playedGames.push(quiz);

          }

        } catch (error) {

          console.error(
            "GAME DATA ERROR:",
            error
          );

        }

      }


      // =====================================
      // GAME COUNTS
      // =====================================

      const puzzlesPlayed =
        playedGames.length;


      const gamesWon =
        playedGames.filter(
          quiz =>
            quiz.correct === true
        ).length;


      const gamesLost =
        playedGames.filter(
          quiz =>
            quiz.correct === false
        ).length;


      // =====================================
      // PLAYED DATES
      // =====================================

      const playedDates =
        getPlayedDates();


      // =====================================
      // STREAK
      // IMPORTANT:
      // CORRECT OR WRONG BOTH COUNT
      // =====================================

      const currentStreak =
        calculateCurrentStreak(
          playedDates
        );


      const bestStreak =
        calculateBestStreak(
          playedDates
        );


      // =====================================
      // SAVE STREAK
      // =====================================

      await setDoc(
        userRef,
        {
          currentStreak,
          bestStreak
        },
        {
          merge: true
        }
      );


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
      // UI
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
          currentStreak +
          " Days";

      }


      if (bestStreakElement) {

        bestStreakElement.textContent =
          bestStreak +
          " Days";

      }


      if (winRateElement) {

        winRateElement.textContent =
          winRate +
          "%";

      }


      // =====================================
      // RESULT
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
