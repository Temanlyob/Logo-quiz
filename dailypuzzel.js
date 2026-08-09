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
// THEME SYSTEM
// ======================================

function applyTheme(theme){

  document.body.classList.remove(
    "theme-light",
    "theme-dark"
  );

  if(theme === "light"){

    document.body.classList.add("theme-light");

  }else if(theme === "dark"){

    document.body.classList.add("theme-dark");

  }else{

    // DEFAULT = PHONE SYSTEM THEME

    if(
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ){

      document.body.classList.add("theme-dark");

    }

  }

}

// Load saved theme
applyTheme(
  localStorage.getItem("theme") || "default"
);


// Follow phone theme when Default is selected
const systemTheme =
window.matchMedia(
  "(prefers-color-scheme: dark)"
);

systemTheme.addEventListener("change",()=>{

  const currentTheme =
  localStorage.getItem("theme") || "default";

  if(currentTheme === "default"){

    applyTheme("default");

  }

});

// ======================================
// DAILY LOGO QUIZ
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
// Current User
// ======================================

let currentUser = null;

onAuthStateChanged(auth,(user)=>{

if(!user){

window.location.replace("login.html");
return;

}

currentUser = user;

});

// ======================================
// Puzzle Date
// ======================================

const params =
new URLSearchParams(window.location.search);

let todayKey =
params.get("date");

if(!todayKey){

const now = new Date();

const day =
String(now.getDate()).padStart(2,"0");

const month =
String(now.getMonth()+1).padStart(2,"0");

const year =
String(now.getFullYear()).slice(-2);

todayKey =
`${day}-${month}-${year}`;

}

// ======================================
// Image Paths
// ======================================

const rightImage =
`images/${todayKey}right.png`;

const wrongImage =
`images/${todayKey}wrong.png`;

img1.onerror = ()=>{

console.error(
"Missing:",
rightImage
);

};

img2.onerror = ()=>{

console.error(
"Missing:",
wrongImage
);

};

// ======================================
// Random Position
// ======================================

let randomPosition =
localStorage.getItem(
"random_"+todayKey
);

if(randomPosition===null){

randomPosition =
Math.random()<0.5
? "left"
: "right";

localStorage.setItem(

"random_"+todayKey,

randomPosition

);

}

let correctOption;

if(randomPosition==="left"){

img1.src = rightImage;
img2.src = wrongImage;

correctOption = option1;

}else{

img1.src = wrongImage;
img2.src = rightImage;

correctOption = option2;

}

// ======================================
// Attempt Data
// ======================================

const saveKey =
"quiz_"+todayKey;

let savedQuiz =
localStorage.getItem(saveKey);

let answered = false;

  // ======================================
// Already Attempted
// ======================================

if(savedQuiz){

answered = true;

const data =
JSON.parse(savedQuiz);

restoreResult(data);

option1.style.pointerEvents = "none";
option2.style.pointerEvents = "none";

}

// ======================================
// Click Events
// ======================================

option1.onclick = function(){

checkAnswer(option1);

};

option2.onclick = function(){

checkAnswer(option2);

};

// ======================================
// Check Answer
// ======================================

async function checkAnswer(selected){

if(answered) return;

answered = true;

const correct =
selected === correctOption;

const data = {

date: todayKey,

correct: correct,

score: correct ? 10 : 0,

attempted: true

};

// Save Local

localStorage.setItem(

saveKey,

JSON.stringify(data)

);

localStorage.setItem(

"lastResult",

correct ? "correct" : "wrong"

);

localStorage.setItem(

"lastScore",

correct ? "10" : "0"

);

localStorage.setItem(

"resultProcessed_" + todayKey,

"false"

);

// Save Firestore

if(currentUser){

const userRef =
doc(db,"users",currentUser.uid);

const snap =
await getDoc(userRef);

let history = {};

if(snap.exists()){

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

}

// Restore Result

restoreResult(data);

option1.style.pointerEvents = "none";
option2.style.pointerEvents = "none";

  }

// ======================================
// Restore Result
// ======================================

function restoreResult(data){

resultSection.style.display = "block";

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

pointsCard.innerHTML=
"+10 Points ⭐";

infoTitle.innerHTML=
"Great Job!";

infoText.innerHTML=
"You spotted the authentic logo.";

}else{

const wrong =
correctOption===option1
? option2
: option1;

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

pointsCard.innerHTML=
"0 Points";

infoTitle.innerHTML=
"Correct Answer";

infoText.innerHTML=
"The highlighted logo was the original one.";

}

resultSection.scrollIntoView({

behavior

// ======================================
// Firestore Sync (Already Played)
// ======================================

if(currentUser){

try{

const userRef =
doc(db,"users",currentUser.uid);

const snap =
await getDoc(userRef);

if(snap.exists()){

const history =
snap.data().history || {};

if(history[todayKey]){

answered = true;

restoreResult(history[todayKey]);

option1.style.pointerEvents = "none";
option2.style.pointerEvents = "none";

}

}

}catch(err){

console.error(err);

}

}

// ======================================
// Image Preload
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
// Disable Browser Drag
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
// End Of File
// ======================================

// ======================================
// Reset Daily Process Flag
// ======================================

window.addEventListener("pageshow",()=>{

const key =
"resultProcessed_"+todayKey;

if(!localStorage.getItem(key)){

localStorage.setItem(
key,
"false"
);

}

});

// ======================================
// Reset Card Styles
// ======================================

function resetCards(){

option1.classList.remove(
"correct",
"wrong"
);

option2.classList.remove(
"correct",
"wrong"
);

badge1.style.display="none";
badge2.style.display="none";

}

// ======================================
// Browser Back Support
// ======================================

window.addEventListener("popstate",()=>{

location.reload();

});

// ======================================
// Visibility Change
// ======================================

document.addEventListener(
"visibilitychange",
()=>{

if(document.visibilityState==="visible"){

console.log(
"Puzzle Active:",
todayKey
);

}

}
);

// ======================================
// Keyboard Support
// ======================================

document.addEventListener(
"keydown",
(e)=>{

if(answered) return;

if(e.key==="ArrowLeft"){

checkAnswer(option1);

}

if(e.key==="ArrowRight"){

checkAnswer(option2);

}

}
);

// ======================================
// End
// ======================================
