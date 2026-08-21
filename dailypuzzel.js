import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

console.log("DAILY PUZZLE JS LOADED");

// ======================================
// THEME
// ======================================

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

    if (currentTheme === "default") {

      applyTheme("default");

    }

  }
);


// ======================================
// ELEMENTS
// ======================================

const option1 =
  document.getElementById("option1");

const option2 =
  document.getElementById("option2");

const img1 =
  document.getElementById("img1");

const img2 =
  document.getElementById("img2");

const badge1 =
  document.getElementById("badge1");

const badge2 =
  document.getElementById("badge2");

const resultSection =
  document.getElementById("resultSection");

const resultCircle =
  document.getElementById("resultCircle");

const resultTitle =
  document.getElementById("resultTitle");

const resultText =
  document.getElementById("resultText");

const pointsCard =
  document.getElementById("pointsCard");

const infoTitle =
  document.getElementById("infoTitle");

const infoText =
  document.getElementById("infoText");

const infoIcon =
  document.querySelector(".info-icon");

const showResultsBtn =
  document.getElementById("showResultsBtn");


// ======================================
// CURRENT USER
// ======================================

let currentUser = null;


// ======================================
// PUZZLE DATE
// ======================================

const params =
  new URLSearchParams(
    window.location.search
  );

let todayKey =
  params.get("date");


if (!todayKey) {

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

  todayKey =
    `${day}-${month}-${year}`;

}

console.log(
  "Puzzle Date:",
  todayKey
);


// ======================================
// DATE HELPERS
// ======================================

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


function getTodayDateOnly() {

  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;

}


// ======================================
// IS THIS TODAY'S PUZZLE?
// ======================================

function isTodaysPuzzle() {

  const puzzleDate =
    parseDateKey(todayKey);

  const today =
    getTodayDateOnly();

  if (!puzzleDate) {

    return false;

  }

  return (
    puzzleDate.getTime() ===
    today.getTime()
  );

}


// ======================================
// SCORE RULE
//
// Today's puzzle  = +10
// Previous puzzle = +5
// Wrong            = 0
// ======================================

function getPuzzleScore(correct) {

  // Wrong answer = 0
  if (!correct) {
    return 0;
  }

  // Today's puzzle = +10
  if (isTodaysPuzzle()) {
    return 10;
  }

  // Any previous-day puzzle completed today = +5
  return 5;
}


// ======================================
// IMAGE PATHS
// ======================================

const rightImage =
  `images/${todayKey}right.png`;

const wrongImage =
  `images/${todayKey}wrong.png`;


console.log(
  "Right Image:",
  rightImage
);

console.log(
  "Wrong Image:",
  wrongImage
);


// ======================================
// IMAGE ERROR
// ======================================

img1.onerror = () => {

  console.error(
    "IMAGE 1 NOT FOUND:",
    img1.src
  );

};

img2.onerror = () => {

  console.error(
    "IMAGE 2 NOT FOUND:",
    img2.src
  );

};


// ======================================
// RANDOM POSITION
// ======================================

let randomPosition =
  localStorage.getItem(
    "random_" + todayKey
  );


if (randomPosition === null) {

  randomPosition =
    Math.random() < 0.5
      ? "left"
      : "right";

  localStorage.setItem(
    "random_" + todayKey,
    randomPosition
  );

}


let correctOption;


if (randomPosition === "left") {

  img1.src =
    rightImage;

  img2.src =
    wrongImage;

  correctOption =
    option1;

} else {

  img1.src =
    wrongImage;

  img2.src =
    rightImage;

  correctOption =
    option2;

}


console.log(
  "Correct Option:",
  correctOption.id
);


// ======================================
// ATTEMPT DATA
// ======================================

const saveKey =
  "quiz_" + todayKey;

let answered = false;

const savedQuiz =
  localStorage.getItem(saveKey);


// ======================================
// RESET CARDS
// ======================================

function resetCards() {

  option1.classList.remove(
    "correct",
    "wrong"
  );

  option2.classList.remove(
    "correct",
    "wrong"
  );

  badge1.style.display =
    "none";

  badge2.style.display =
    "none";

}


// ======================================
// RESTORE RESULT
// ======================================

function restoreResult(data) {

  resetCards();

  resultSection.classList.remove(
    "result-correct",
    "result-wrong"
  );

  resultSection.style.display =
    "block";


  if (data.correct) {

    // ==================================
    // CORRECT
    // ==================================

    resultSection.classList.add(
      "result-correct"
    );

    correctOption.classList.add(
      "correct"
    );


    if (correctOption === option1) {

      badge1.style.display =
        "flex";

      badge1.innerHTML =
        "✓";

    } else {

      badge2.style.display =
        "flex";

      badge2.innerHTML =
        "✓";

    }


    resultCircle.innerHTML =
      "✅";

    resultTitle.innerHTML =
      "Correct!";

    resultText.innerHTML =
      "You selected the real logo.";


    const earnedScore =
      Number(data.score) || 0;


    pointsCard.innerHTML =
      "+" +
      earnedScore +
      " Points ⭐";


    infoTitle.innerHTML =
      "Great Job!";

    infoText.innerHTML =
      "You spotted the authentic logo.";


  } else {

    // ==================================
    // WRONG
    // ==================================

    resultSection.classList.add(
      "result-wrong"
    );


    const wrongOption =
      correctOption === option1
        ? option2
        : option1;


    wrongOption.classList.add(
      "wrong"
    );

    correctOption.classList.add(
      "correct"
    );


    if (correctOption === option1) {

      badge1.style.display =
        "flex";

      badge1.innerHTML =
        "✓";


      badge2.style.display =
        "flex";

      badge2.innerHTML =
        "✕";

    } else {

      badge2.style.display =
        "flex";

      badge2.innerHTML =
        "✓";


      badge1.style.display =
        "flex";

      badge1.innerHTML =
        "✕";

    }


    resultCircle.innerHTML =
      "❌";

    resultTitle.innerHTML =
      "Incorrect!";

    resultText.innerHTML =
      "That wasn't the authentic logo.";

    pointsCard.innerHTML =
      "0 Points";

    infoIcon.innerHTML =
  "🚫";

    infoTitle.innerHTML =
      "Wrong Choice";

    infoText.innerHTML =
      "You selected the wrong logo.";

  }


  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


// ======================================
// CHECK ANSWER
// ======================================

async function checkAnswer(selected) {

  if (answered) {

    return;

  }

  answered = true;


  const correct =
    selected === correctOption;


  // ====================================
  // SCORE
  // ====================================

  const earnedScore =
    getPuzzleScore(correct);


  // ====================================
  // REAL PLAY TIME
  // ====================================

  const playedAt =
    new Date().toISOString();


  // ====================================
  // STREAK ELIGIBILITY
  //
  // Only today's puzzle can create
  // a current streak day.
  //
  // Previous-day puzzle completed today
  // DOES NOT create a streak day.
  // ====================================

  const streakEligible =
    isTodaysPuzzle();


  const data = {

    date:
      todayKey,

    correct:
      correct,

    score:
      earnedScore,

    attempted:
      true,

    played:
      true,

    playedAt:
      playedAt,

    streakEligible:
      streakEligible

  };


  // ====================================
  // SAVE LOCAL
  // ====================================

  localStorage.setItem(
    saveKey,
    JSON.stringify(data)
  );


  localStorage.setItem(
    "lastResult",
    correct
      ? "correct"
      : "wrong"
  );


  localStorage.setItem(
    "lastScore",
    String(earnedScore)
  );


  // ====================================
  // FIRESTORE
  // ====================================

  if (currentUser) {

    try {

      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );


      const snap =
        await getDoc(
          userRef
        );


      let history = {};


      if (snap.exists()) {

        history =
          snap.data().history || {};

      }


      history[todayKey] = {

        played:
          true,

        attempted:
          true,

        correct:
          correct,

        score:
          earnedScore,

        playedAt:
          playedAt,

        streakEligible:
          streakEligible

      };


      await setDoc(
        userRef,
        {
          history:
            history
        },
        {
          merge:
            true
        }
      );


      console.log(
        "Saved puzzle:",
        todayKey
      );

      console.log(
        "Score:",
        earnedScore
      );

      console.log(
        "Streak eligible:",
        streakEligible
      );


    } catch (error) {

      console.error(
        "Firestore Save Error:",
        error
      );

    }

  }


  // ====================================
  // SHOW RESULT
  // ====================================

  restoreResult(
    data
  );


  option1.style.pointerEvents =
    "none";

  option2.style.pointerEvents =
    "none";

}


// ======================================
// CLICK EVENTS
// ======================================

option1.onclick = () => {

  checkAnswer(
    option1
  );

};


option2.onclick = () => {

  checkAnswer(
    option2
  );

};


// ======================================
// FIRESTORE SYNC
// ======================================

async function syncFirestoreHistory() {

  if (!currentUser) {

    return;

  }


  try {

    const userRef =
      doc(
        db,
        "users",
        currentUser.uid
      );


    const snap =
      await getDoc(
        userRef
      );


    if (!snap.exists()) {

      return;

    }


    const history =
      snap.data().history || {};


    if (history[todayKey]) {

      answered =
        true;


      restoreResult(
        history[todayKey]
      );


      option1.style.pointerEvents =
        "none";

      option2.style.pointerEvents =
        "none";

    }


  } catch (error) {

    console.error(
      "Firestore Sync Error:",
      error
    );

  }

}


// ======================================
// AUTH
// ======================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.replace(
        "login.html"
      );

      return;

    }


    currentUser =
      user;


    // Local result
    if (savedQuiz) {

      try {

        const data =
          JSON.parse(
            savedQuiz
          );


        answered =
          true;


        restoreResult(
          data
        );


        option1.style.pointerEvents =
          "none";

        option2.style.pointerEvents =
          "none";


      } catch (error) {

        console.error(
          "Saved Quiz Error:",
          error
        );

      }

    }


    // Firestore result
    await syncFirestoreHistory();

  }
);


// ======================================
// SHOW RESULTS
// ======================================

showResultsBtn.onclick = () => {

  window.location.href =
    `results.html?date=${todayKey}`;

};


// ======================================
// IMAGE PRELOAD
// ======================================

const preloadRight =
  new Image();

preloadRight.src =
  rightImage;


const preloadWrong =
  new Image();

preloadWrong.src =
  wrongImage;


// ======================================
// DISABLE IMAGE DRAG
// ======================================

img1.draggable =
  false;

img2.draggable =
  false;

img1.oncontextmenu =
  () => false;

img2.oncontextmenu =
  () => false;


// ======================================
// PREVENT TEXT SELECTION
// ======================================

document.body.style.userSelect =
  "none";

document.body.style.webkitUserSelect =
  "none";


// ======================================
// PAGESHOW
// ======================================

window.addEventListener(
  "pageshow",
  () => {

    const key =
      "resultProcessed_" +
      todayKey;


    if (
      !localStorage.getItem(key)
    ) {

      localStorage.setItem(
        key,
        "false"
      );

    }

  }
);


// ======================================
// VISIBILITY
// ======================================

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      console.log(
        "Puzzle Active:",
        todayKey
      );

    }

  }
);


// ======================================
// KEYBOARD
// ======================================

document.addEventListener(
  "keydown",
  (e) => {

    if (answered) {

      return;

    }


    if (
      e.key === "ArrowLeft"
    ) {

      checkAnswer(
        option1
      );

    }


    if (
      e.key === "ArrowRight"
    ) {

      checkAnswer(
        option2
      );

    }

  }
);
