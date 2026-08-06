import { auth, db } from "./firebase.js";

import { getTranslation } from "./translations.js";

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

// Current User & Answer State
let currentUser = null;
let answered = false;

// Today's Key from URL or generated
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

// Preload Images Correctly
const preloadRight = new Image();
preloadRight.src = rightImage;
const preloadWrong = new Image();
preloadWrong.src = wrongImage;

// Image Error Handlers
img1.onerror = () => {
    console.error("Missing Image:", rightImage);
};

img2.onerror = () => {
    console.error("Missing Image:", wrongImage);
};

// Random Position Setup Once Per Day via localStorage
let randomPosition = localStorage.getItem("random_" + todayKey);

if (randomPosition === null) {
    randomPosition = Math.random() < 0.5 ? "left" : "right";
    localStorage.setItem("random_" + todayKey, randomPosition);
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

// Save Key
const saveKey = "quiz_" + todayKey;

// Check Local Storage for Prior Attempt
const savedQuiz = localStorage.getItem(saveKey);

if (savedQuiz) {
    answered = true;
    const data = JSON.parse(savedQuiz);
    restoreResult(data);
    option1.style.pointerEvents = "none";
    option2.style.pointerEvents = "none";
}

// ======================================
// AUTH STATE & FIRESTORE SYNC
// ======================================

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    currentUser = user;

  const language =
localStorage.getItem("language") || "en";

const t =
getTranslation(language);

    // Check Firestore if not already answered locally
    if (!answered) {
        try {
            const userRef = doc(db, "users", currentUser.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                const history = snap.data().history || {};
                if (history[todayKey] && !answered) {
                    answered = true;
                    const data = history[todayKey];
                    
                    // Sync to local storage for consistency
                    localStorage.setItem(saveKey, JSON.stringify(data));
                    
                    restoreResult(data);

                    option1.style.pointerEvents = "none";
                    option2.style.pointerEvents = "none";
                }
            }
        } catch (err) {
            console.error("Error fetching Firestore history:", err);
        }
    }
});

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
// Check Answer Logic
// ======================================

async function checkAnswer(selectedOption) {
    if (answered) return;

    answered = true;

    const isCorrect = selectedOption === correctOption;

    const data = {
        date: todayKey,
        correct: isCorrect,
        score: isCorrect ? 10 : 0,
        attempted: true,
        playedAt: new Date().toISOString()
    };

    // Save Local Storage
    localStorage.setItem(saveKey, JSON.stringify(data));
    localStorage.setItem("lastResult", isCorrect ? "correct" : "wrong");
    localStorage.setItem("lastScore", isCorrect ? "10" : "0");
    localStorage.setItem("resultProcessed_" + todayKey, "false");

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
                playedAt: data.playedAt
            };

            await setDoc(userRef, {
                history
            }, {
                merge: true
            });
        } catch (err) {
            console.error("Error saving to Firestore:", err);
        }
    }

    restoreResult(data);

    option1.style.pointerEvents = "none";
    option2.style.pointerEvents = "none";
}

// ======================================
// Restore Result UI
// ======================================

function restoreResult(data) {
    if (resultSection) {
        resultSection.style.display = "block";
    }

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

        if (resultCircle) resultCircle.innerHTML = "✅";
        if (resultTitle) resultTitle.innerHTML = t.correct;
        if (resultText) resultText.innerHTML =
t.selectedRealLogo || "You selected the real logo.";
        if (pointsCard) pointsCard.innerHTML = "+10 Points ⭐";

        if (infoTitle) infoTitle.innerHTML = t.greatJob;
        if (infoText) infoText.innerHTML =
t.spottedLogo || "You spotted the authentic logo.";
    } else {
        const wrongOption = correctOption === option1 ? option2 : option1;

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

        if (resultCircle) resultCircle.innerHTML = "❌";
        if (resultTitle) resultTitle.innerHTML = t.incorrect;
        if (resultText) resultText.innerHTML =
t.wrongLogo || "That wasn't the authentic logo.";
        if (pointsCard) pointsCard.innerHTML = "0 Points";

        if (infoTitle) infoTitle.innerHTML =
t.correctAnswer || "Correct Answer";
        if (infoText) infoText.innerHTML =
t.originalLogo || "The highlighted logo was the original one.";
    }

    if (resultSection) {
        resultSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}

const language =
localStorage.getItem("language") || "en";

const t =
getTranslation(language);

// ======================================
// Show Results Button Event
// ======================================

if (showResultsBtn) {
    showResultsBtn.addEventListener("click", () => {
        window.location.href = "results.html";
    });
}

// ======================================
// Disable Image Drag & Context Menu
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
document.body.style.msUserSelect = "none";
document.body.style.mozUserSelect = "none";

// ======================================
// Reset Cards Helper
// ======================================

function resetCards() {
    option1.classList.remove("correct", "wrong");
    option2.classList.remove("correct", "wrong");

    badge1.style.display = "none";
    badge2.style.display = "none";
}

// ======================================
// Browser Back History Handling
// ======================================

window.addEventListener("popstate", () => {
    location.reload();
});

// ======================================
// Keyboard Support (Left/Right Arrows)
// ======================================

document.addEventListener("keydown", (e) => {
    if (answered) return;

    if (e.key === "ArrowLeft") {
        checkAnswer(option1);
    } else if (e.key === "ArrowRight") {
        checkAnswer(option2);
    }
});

// ======================================
// Page Show Event
// ======================================

window.addEventListener("pageshow", () => {
    const key = "resultProcessed_" + todayKey;
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "false");
    }
});

// ======================================
// End of dailypuzzel.js
// ======================================
