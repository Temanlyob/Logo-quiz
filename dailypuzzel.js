import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================
// DAILY LOGO PUZZLE
// ======================================

// Cards
const option1 = document.getElementById("option1");
const option2 = document.getElementById("option2");

// Images
const img1 = document.getElementById("img1");
const img2 = document.getElementById("img2");

// Badges
const badge1 = document.getElementById("badge1");
const badge2 = document.getElementById("badge2");

// Result
const resultSection = document.getElementById("resultSection");
const resultCircle = document.getElementById("resultCircle");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const pointsCard = document.getElementById("pointsCard");
const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");
const showResultsBtn = document.getElementById("showResultsBtn");

// Current User
let currentUser = null;

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    currentUser = user;

});

// Today's Key
const params = new URLSearchParams(window.location.search);

let todayKey = params.get("date");

if (!todayKey) {

    const now = new Date();

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);

    todayKey = `${day}-${month}-${year}`;

}

// Image Paths
const rightImage = `images/${todayKey}right.png`;
const wrongImage = `images/${todayKey}wrong.png`;

// Image Error
img1.onerror = () => {

    console.error("Missing Image:", rightImage);

};

img2.onerror = () => {

    console.error("Missing Image:", wrongImage);

};

// Random Position
let randomPosition = localStorage.getItem("random_" + todayKey);

if (randomPosition === null) {

    randomPosition = Math.random() < 0.5 ? "left" : "right";

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

// Save Keys
const saveKey = "quiz_" + todayKey;

let answered = false;

const savedQuiz = localStorage.getItem(saveKey);

// ======================================
// Restore Previous Attempt
// ======================================

if (savedQuiz) {

    answered = true;

    const data = JSON.parse(savedQuiz);

    restoreResult(data);

    option1.style.pointerEvents = "none";
    option2.style.pointerEvents = "none";

}

// ======================================
// Click Events
// ======================================

option1.addEventListener("click", () => {

    checkAnswer(option1);

});

option2.addEventListener("click", () => {

    checkAnswer(option2);

});

// ======================================
// Check Answer
// ======================================

async function checkAnswer(selectedOption) {

    if (answered) return;

    answered = true;

    const isCorrect = selectedOption === correctOption;

    const data = {

        date: todayKey,
        correct: isCorrect,
        score: isCorrect ? 10 : 0,
        attempted: true

    };

    // Save Local

    localStorage.setItem(
        saveKey,
        JSON.stringify(data)
    );

    localStorage.setItem(
        "lastResult",
        isCorrect ? "correct" : "wrong"
    );

    localStorage.setItem(
        "lastScore",
        isCorrect ? "10" : "0"
    );

    localStorage.setItem(
        "resultProcessed_" + todayKey,
        "false"
    );

    // Save Firestore

    if (currentUser) {

        try {

            const userRef = doc(db, "users", currentUser.uid);

            const snap = await getDoc(userRef);

            let history = {};

            if (snap.exists()) {

                history = snap.data().history || {};

            }

            history[todayKey] = {

                played: true,
                correct: isCorrect,
                score: isCorrect ? 10 : 0,
                playedAt: new Date().toISOString()

            };

            await setDoc(userRef, {

                history

            }, {

                merge: true

            });

        } catch (err) {

            console.error(err);

        }

    }

    restoreResult(data);

    option1.style.pointerEvents = "none";
    option2.style.pointerEvents = "none";

}

// ======================================
// Restore Result
// ======================================

function restoreResult(data) {

    resultSection.style.display = "block";

    resetCards();

    if (data.correct) {

        correctOption.classList.add("correct");

        if (correctOption === option1) {

            badge1.style.display = "flex";
            badge1.innerHTML = "✓";

        } else {

            badge2.style.display = "flex";
            badge2.innerHTML = "✓";

        }

        resultCircle.innerHTML = "✅";
        resultTitle.innerHTML = "Correct!";
        resultText.innerHTML = "You selected the real logo.";
        pointsCard.innerHTML = "+10 Points ⭐";

        infoTitle.innerHTML = "Great Job!";
        infoText.innerHTML = "You spotted the authentic logo.";

    } else {

        const wrongOption =
            correctOption === option1
            ? option2
            : option1;

        wrongOption.classList.add("wrong");
        correctOption.classList.add("correct");

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
        resultTitle.innerHTML = "Incorrect!";
        resultText.innerHTML = "That wasn't the authentic logo.";
        pointsCard.innerHTML = "0 Points";

        infoTitle.innerHTML = "Correct Answer";
        infoText.innerHTML =
            "The highlighted logo was the original one.";

    }

    resultSection.scrollIntoView({

        behavior: "smooth"

    });

}

// ======================================
// Firestore Sync (Already Played)
// ======================================

(async () => {

    if (!currentUser) return;

    try {

        const userRef = doc(db, "users", currentUser.uid);

        const snap = await getDoc(userRef);

        if (snap.exists()) {

            const history = snap.data().history || {};

            if (history[todayKey] && !answered) {

                answered = true;

                restoreResult(history[todayKey]);

                option1.style.pointerEvents = "none";
                option2.style.pointerEvents = "none";

            }

        }

    } catch (err) {

        console.error(err);

    }

})();

// ======================================
// Show Results Button
// ======================================

showResultsBtn.addEventListener("click", () => {

    window.location.href = "results.html";

});

// ======================================
// Preload Images
// ======================================

[new Image().src = rightImage];
[new Image().src = wrongImage];

// ======================================
// Disable Drag
// ======================================

img1.draggable = false;
img2.draggable = false;

img1.oncontextmenu = () => false;
img2.oncontextmenu = () => false;

// ======================================
// Prevent Text Selection
// ======================================

document.body.style.userSelect = "none";
document.body.style.webkitUserSelect = "none";

// ======================================
// Reset Cards
// ======================================

function resetCards() {

    option1.classList.remove("correct", "wrong");
    option2.classList.remove("correct", "wrong");

    badge1.style.display = "none";
    badge2.style.display = "none";

}

// ======================================
// Browser Back
// ======================================

window.addEventListener("popstate", () => {

    location.reload();

});

// ======================================
// Keyboard Support
// ======================================

document.addEventListener("keydown", (e) => {

    if (answered) return;

    if (e.key === "ArrowLeft") {

        checkAnswer(option1);

    }

    if (e.key === "ArrowRight") {

        checkAnswer(option2);

    }

});

// ======================================
// Page Show
// ======================================

window.addEventListener("pageshow", () => {

    const key = "resultProcessed_" + todayKey;

    if (!localStorage.getItem(key)) {

        localStorage.setItem(key, "false");

    }

});

// ======================================
// End
// ======================================
