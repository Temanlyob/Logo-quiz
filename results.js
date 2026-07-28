// Buttons
const homeBtn = document.getElementById("homeBtn");
const calendarBtn = document.getElementById("calendarBtn");

// Result Elements
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const scoreValue = document.getElementById("scoreValue");

// Demo Data
// Baad me ye values localStorage se aayengi.
const result = localStorage.getItem("lastResult");
const score = localStorage.getItem("lastScore");

let isCorrect = result === "correct";

let currentStreak = 3;
let bestStreak = 8;
let winRate = 82;

// Update Stats
document.getElementById("currentStreak").innerHTML =
currentStreak + " Days";

document.getElementById("bestStreak").innerHTML =
bestStreak + " Days";

document.getElementById("winRate").innerHTML =
winRate + "%";

// Correct / Wrong Theme
if(isCorrect){

    resultIcon.innerHTML = "🏆";

    resultTitle.innerHTML = "Today's Result";

    scoreValue.innerHTML = "+" + score;

}else{

    resultIcon.innerHTML = "❌";

    resultTitle.innerHTML = "Better Luck Tomorrow";

    scoreValue.innerHTML = score;

    scoreValue.style.color = "#ef4444";

    resultIcon.style.background = "#ffecec";

}

// Home
homeBtn.onclick = function(){

    window.location.href = "index.html";

}

// Calendar
calendarBtn.onclick = function(){

    alert("Calendar page coming soon.");

}
