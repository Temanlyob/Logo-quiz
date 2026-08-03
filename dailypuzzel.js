// ======================================
// DAILY LOGO QUIZ
// PART 1
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

// --------------------------------------
// TODAY
// --------------------------------------

const params=new URLSearchParams(window.location.search);

let todayKey=params.get("date");

if(!todayKey){

const now=new Date();

const day=String(now.getDate()).padStart(2,"0");
const month=String(now.getMonth()+1).padStart(2,"0");
const year=String(now.getFullYear()).slice(-2);

todayKey=`${day}-${month}-${year}`;

}

// Image paths

// Image paths

const rightImage =
`images/${todayKey}right.png`;

const wrongImage =
`images/${todayKey}wrong.png`;

console.log("todayKey =", todayKey);
console.log("Right =", rightImage);
console.log("Wrong =", wrongImage);

img1.onerror = function () {
  alert("Image 1 not found:\n" + rightImage);
};

img2.onerror = function () {
  alert("Image 2 not found:\n" + wrongImage);
};
// --------------------------------------
// RANDOM POSITION
// --------------------------------------

let randomPosition =
localStorage.getItem("random_"+todayKey);

if(randomPosition===null){

randomPosition=
Math.random()<0.5 ? "left":"right";

localStorage.setItem(
"random_"+todayKey,
randomPosition
);

}

let correctOption;

if(randomPosition==="left"){

img1.src=rightImage;
img2.src=wrongImage;

correctOption=option1;

}else{

img1.src=wrongImage;
img2.src=rightImage;

correctOption=option2;

}

// --------------------------------------
// ATTEMPT DATA
// --------------------------------------

const saveKey=
"quiz_"+todayKey;

let savedQuiz=
localStorage.getItem(saveKey);

let answered=false;

// ======================================
// PART 2
// ONE ATTEMPT SYSTEM
// ======================================

// Already attempted?

if(savedQuiz){

answered=true;

const data=JSON.parse(savedQuiz);

restoreResult(data);

option1.style.pointerEvents="none";
option2.style.pointerEvents="none";

}

// -------------------------------
// CLICK EVENTS
// -------------------------------

option1.onclick=function(){

checkAnswer(option1);

};

option2.onclick=function(){

checkAnswer(option2);

};

// -------------------------------
// CHECK ANSWER
// -------------------------------

function checkAnswer(selected){

if(answered) return;

answered=true;

const correct=
selected===correctOption;

const data={

date:todayKey,

correct:correct,

score:correct?10:0,

attempted:true

};

localStorage.setItem(
saveKey,
JSON.stringify(data)
);

localStorage.setItem(
"lastResult",
correct?"correct":"wrong"
);

localStorage.setItem(
"lastScore",
correct?"10":"0"
);

localStorage.setItem(
  "resultProcessed_" + todayKey,
  "false"
);
    
restoreResult(data);

option1.style.pointerEvents="none";
option2.style.pointerEvents="none";

}

// -------------------------------
// SHOW RESULT
// -------------------------------

function restoreResult(data){

resultSection.style.display="block";

if(data.correct){

correctOption.classList.add("correct");

if(correctOption===option1){

badge1.style.display="flex";
badge1.innerHTML="✓";

}else{

badge2.style.display="flex";
badge2.innerHTML="✓";

}

resultCircle.innerHTML="✅";

resultTitle.innerHTML="Correct!";

resultText.innerHTML=
"You selected the real logo.";

pointsCard.innerHTML="+10 Points ⭐";

infoTitle.innerHTML="Great Job!";

infoText.innerHTML=
"You spotted the authentic logo.";

}else{

const wrong=
correctOption===option1?
option2:
option1;

wrong.classList.add("wrong");

correctOption.classList.add("correct");

if(correctOption===option1){

badge1.style.display="flex";
badge1.innerHTML="✓";

badge2.style.display="flex";
badge2.innerHTML="✕";

}else{

badge2.style.display="flex";
badge2.innerHTML="✓";

badge1.style.display="flex";
badge1.innerHTML="✕";

}

resultCircle.innerHTML="❌";

resultTitle.innerHTML="Incorrect!";

resultText.innerHTML=
"That wasn't the authentic logo.";

pointsCard.innerHTML="0 Points";

infoTitle.innerHTML="Correct Answer";

infoText.innerHTML=
"The highlighted logo was the original one.";

}

resultSection.scrollIntoView({

behavior:"smooth"

});

}

showResultsBtn.addEventListener("click", function () {
    window.location.href =
`results.html?date=${todayKey}`;
});
