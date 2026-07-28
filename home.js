// ==========================
// LOAD STATS
// ==========================

let totalScore = Number(localStorage.getItem("totalScore")) || 0;
let currentStreak = Number(localStorage.getItem("currentStreak")) || 0;
let gamesPlayed = Number(localStorage.getItem("totalGames")) || 0;
let gamesWon = Number(localStorage.getItem("gamesWon")) || 0;

// ==========================
// CALCULATE ACCURACY
// ==========================

let accuracy = 0;

if(gamesPlayed > 0){

accuracy = Math.round((gamesWon / gamesPlayed) * 100);

}

// ==========================
// UPDATE UI
// ==========================

const score = document.getElementById("totalScore");
const streak = document.getElementById("currentStreak");
const acc = document.getElementById("accuracy");

if(score){

score.innerHTML = totalScore;

}

if(streak){

streak.innerHTML = currentStreak;

}

if(acc){

acc.innerHTML = accuracy + "%";

}

// ==========================
// TODAY BUTTON
// ==========================

const playBtn = document.querySelector(".play-btn");

if(playBtn){

playBtn.addEventListener("click",function(){

window.location.href="dailypuzzel.html";

});

}
