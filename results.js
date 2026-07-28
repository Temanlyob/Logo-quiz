// Buttons
const homeBtn = document.getElementById("homeBtn");
const calendarBtn = document.getElementById("calendarBtn");

// Result Elements
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const scoreValue = document.getElementById("scoreValue");

// Load last result
const result = localStorage.getItem("lastResult");
const score = Number(localStorage.getItem("lastScore")) || 0;

let isCorrect = result === "correct";

// Load saved stats
let totalGames = Number(localStorage.getItem("totalGames")) || 0;
let gamesWon = Number(localStorage.getItem("gamesWon")) || 0;
let gamesLost = Number(localStorage.getItem("gamesLost")) || 0;
let currentStreak = Number(localStorage.getItem("currentStreak")) || 0;
let bestStreak = Number(localStorage.getItem("bestStreak")) || 0;

// Update stats
totalGames++;

if (isCorrect) {

    gamesWon++;
    currentStreak++;

    if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
    }

} else {

    gamesLost++;
    currentStreak = 0;

}

let winRate = totalGames > 0
    ? Math.round((gamesWon / totalGames) * 100)
    : 0;

// Save stats
localStorage.setItem("totalGames", totalGames);
localStorage.setItem("gamesWon", gamesWon);
localStorage.setItem("gamesLost", gamesLost);
localStorage.setItem("currentStreak", currentStreak);
localStorage.setItem("bestStreak", bestStreak);

// Update UI
document.getElementById("totalGames").innerHTML = totalGames;
document.getElementById("gamesWon").innerHTML = gamesWon;
document.getElementById("gamesLost").innerHTML = gamesLost;

document.getElementById("currentStreak").innerHTML =
currentStreak + " Days";

document.getElementById("bestStreak").innerHTML =
bestStreak + " Days";

document.getElementById("winRate").innerHTML =
winRate + "%";

// Correct / Wrong Theme
if (isCorrect) {

    resultIcon.innerHTML = "🏆";
    resultTitle.innerHTML = "Today's Result";
    scoreValue.innerHTML = "+" + score;
    scoreValue.style.color = "#22c55e";

} else {

    resultIcon.innerHTML = "❌";
    resultTitle.innerHTML = "Better Luck Tomorrow";
    scoreValue.innerHTML = score;
    scoreValue.style.color = "#ef4444";
    resultIcon.style.background = "#ffecec";

}

// Home Button
homeBtn.onclick = function () {
    window.location.href = "index.html";
};

// Calendar Button
calendarBtn.onclick = function () {
    alert("Calendar page coming soon.");
};
