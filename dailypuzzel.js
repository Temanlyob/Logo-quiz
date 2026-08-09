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
// THEME SYSTEM
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

    // DEFAULT = PHONE SYSTEM THEME

    if (
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ) {

      document.body.classList.add("theme-dark");

    }

  }

  console.log("Theme applied:", theme);
}


// Load saved Profile setting
const savedTheme =
  localStorage.getItem("theme") || "default";

applyTheme(savedTheme);


// Follow phone theme if Default is selected
const systemTheme =
  window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

systemTheme.addEventListener("change", () => {

  const currentTheme =
    localStorage.getItem("theme") || "default";

  if (currentTheme === "default") {

    applyTheme("default");

  }

});


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

  const now = new Date();

  const day =
    String(now.getDate()).padStart(2, "0");

  const month =
    String(now.getMonth() + 1).padStart(2, "0");

  const year =
    String(now.getFullYear()).slice(-2);

  todayKey =
    `${day}-${month}-${year}`;

}


console.log(
  "Puzzle Date:",
  todayKey
);


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
// IMAGE ERROR CHECK
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

  img1.src = rightImage;
  img2.src = wrongImage;

  correctOption = option1;

} else {

  img1.src = wrongImage;
  img2.src = rightImage;

  correctOption = option2;

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
// RESET CARD STYLES
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

  badge1.style.display = "none";
  badge2.style.display = "none";

}


// ======================================
// RESTORE RESULT
// ======================================

function restoreResult(data) {

  resetCards();

  resultSection.style.display = "block";


  if (data.correct) {

    correctOption.classList.add(
      "correct"
    );


    if (correctOption === option1) {

      badge1.style.display = "flex";
      badge1.innerHTML = "✓";

    } else {

      badge2.style.display = "flex";
      badge2.innerHTML = "✓";

    }


    resultCircle.innerHTML = "✅";

    resultTitle.innerHTML =
      "Correct!";

    resultText.innerHTML =
      "You selected the real logo.";

    pointsCard.innerHTML =
      "+10 Points ⭐";

    infoTitle.innerHTML =
      "Great Job!";

    infoText.innerHTML =
      "You spotted the authentic logo.";


  } else {

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

      badge1.style.display = "flex";
      badge1.innerHTML = "✓";

      badge2.style.display = "flex";
      badge2.innerHTML = "✕";

    } else {

      badge2.style.display = "flex";
      badge2.innerHTML = "✓";

      badge1.style.display = "flex";
      badge1.innerHTML = "✕";

    }


    resultCircle.innerHTML = "❌";

    resultTitle.innerHTML =
      "Incorrect!";

    resultText.innerHTML =
      "That wasn't the authentic logo.";

    pointsCard.innerHTML =
      "0 Points";

    infoTitle.innerHTML =
      "Correct Answer";

    infoText.innerHTML =
      "The highlighted logo was the original one.";

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

  if (answered) return;

  answered = true;


  const correct =
    selected === correctOption;


  const data = {

    date: todayKey,

    correct: correct,

    score: correct ? 10 : 0,

    attempted: true

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
    correct
      ? "10"
      : "0"
  );


  localStorage.setItem(
    "resultProcessed_" + todayKey,
    "false"
  );


  // ====================================
  // SAVE FIRESTORE
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
        await getDoc(userRef);


      let history = {};


      if (snap.exists()) {

        history =
          snap.data().history || {};

      }


      history[todayKey] = {

        played: true,

        correct: correct,

        score: correct ? 10 : 0,

        playedAt:
          new Date().toISOString()

      };


      await setDoc(
        userRef,
        {
          history: history
        },
        {
          merge: true
        }
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

  restoreResult(data);


  option1.style.pointerEvents =
    "none";

  option2.style.pointerEvents =
    "none";

}


// ======================================
// CLICK EVENTS
// ======================================

option1.onclick = () => {

  checkAnswer(option1);

};


option2.onclick = () => {

  checkAnswer(option2);

};


// ======================================
// FIRESTORE SYNC
// ======================================

async function syncFirestoreHistory() {

  if (!currentUser) return;


  try {

    const userRef =
      doc(
        db,
        "users",
        currentUser.uid
      );


    const snap =
      await getDoc(userRef);


    if (!snap.exists()) return;


    const history =
      snap.data().history || {};


    if (history[todayKey]) {

      answered = true;


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


    currentUser = user;


    // Check local result first
    if (savedQuiz) {

      try {

        const data =
          JSON.parse(savedQuiz);

        answered = true;

        restoreResult(data);

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


    // Then sync Firestore
    await syncFirestoreHistory();

  }
);


// ======================================
// SHOW RESULTS BUTTON
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

img1.draggable = false;
img2.draggable = false;

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
// DAILY PROCESS FLAG
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
// BROWSER BACK SUPPORT
// ======================================

window.addEventListener(
  "popstate",
  () => {

    location.reload();

  }
);


// ======================================
// VISIBILITY CHANGE
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
// KEYBOARD SUPPORT
// ======================================

document.addEventListener(
  "keydown",
  (e) => {

    if (answered) return;


    if (e.key === "ArrowLeft") {

      checkAnswer(option1);

    }


    if (e.key === "ArrowRight") {

      checkAnswer(option2);

    }

  }
);
