import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const monthTitle = document.getElementById("monthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const months = [
  "January","February","March","April",
  "May","June","July","August",
  "September","October","November","December"
];

let today = new Date();
today.setHours(0,0,0,0);

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

const firstPuzzleDate = new Date(2026,6,28);
firstPuzzleDate.setHours(0,0,0,0);


// =====================================
// RESULT PAGE SE AAYEGA
// =====================================

let currentStreak = 0;
let streakEndDate = null;


// =====================================
// THEME
// =====================================

function applyTheme(theme){

  document.body.classList.remove(
    "theme-light",
    "theme-dark"
  );

  if(theme === "light"){
    document.body.classList.add("theme-light");
  }
  else if(theme === "dark"){
    document.body.classList.add("theme-dark");
  }
  else{
    document.body.classList.add(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "theme-dark"
        : "theme-light"
    );
  }
}

applyTheme(localStorage.getItem("theme") || "default");


// =====================================
// DATE KEY
// =====================================

function dateKey(date){

  return (
    String(date.getDate()).padStart(2,"0") + "-" +
    String(date.getMonth()+1).padStart(2,"0") + "-" +
    String(date.getFullYear()).slice(-2)
  );
}


function parseDate(key){

  if(!key) return null;

  const [d,m,y] = key.split("-").map(Number);

  const date = new Date(2000+y,m-1,d);
  date.setHours(0,0,0,0);

  return date;
}


// =====================================
// IS THIS ONE OF LAST STREAK DAYS?
// =====================================

function isFireDate(date){

  if(
    currentStreak <= 0 ||
    !streakEndDate
  ){
    return false;
  }

  const end = new Date(streakEndDate);
  end.setHours(0,0,0,0);

  const start = new Date(end);

  start.setDate(
    start.getDate() - (currentStreak - 1)
  );

  return (
    date.getTime() >= start.getTime() &&
    date.getTime() <= end.getTime()
  );
}


// =====================================
// RENDER
// =====================================

function renderCalendar(){

  calendarGrid.innerHTML = "";

  monthTitle.textContent =
    `${months[currentMonth]} ${currentYear}`;

  const firstDay =
    new Date(currentYear,currentMonth,1).getDay();

  const daysInMonth =
    new Date(currentYear,currentMonth+1,0).getDate();


  // Empty boxes

  for(let i=0; i<firstDay; i++){

    const empty = document.createElement("div");
    empty.className = "day empty";

    calendarGrid.appendChild(empty);
  }


  // Days

  for(let day=1; day<=daysInMonth; day++){

    const cell = document.createElement("div");

    cell.className = "day";
    cell.textContent = day;

    const thisDate =
      new Date(currentYear,currentMonth,day);

    thisDate.setHours(0,0,0,0);

    const key = dateKey(thisDate);


    // =================================
    // CORRECT / WRONG
    // =================================

    try{

      const quiz =
        JSON.parse(
          localStorage.getItem("quiz_" + key)
        );

      if(quiz?.attempted === true){

        cell.classList.add(
          quiz.correct === true
            ? "correct-day"
            : "wrong-day"
        );
      }

    }catch(e){}


    // =================================
    // FIRE
    // =================================

    if(isFireDate(thisDate)){

      cell.classList.add(
        "current-streak-day"
      );
    }


    // =================================
    // TODAY
    // =================================

    if(
      thisDate.getTime() === today.getTime()
    ){
      cell.classList.add("today");
    }


    // =================================
    // LOCK / CLICK
    // =================================

    if(thisDate < firstPuzzleDate){

      cell.classList.add("disabled");

    }
    else if(thisDate > today){

      cell.classList.add("locked");

    }
    else{

      cell.onclick = () => {

        window.location.href =
          "dailypuzzel.html?date=" + key;
      };
    }


    calendarGrid.appendChild(cell);
  }
}


// =====================================
// FIREBASE
// GET EXACT RESULT STREAK
// =====================================

onAuthStateChanged(
  auth,
  async user => {

    if(!user){

      window.location.replace("login.html");
      return;
    }


    try{

      const snap =
        await getDoc(
          doc(db,"users",user.uid)
        );


      if(snap.exists()){

        const data = snap.data();

        currentStreak =
          Number(data.currentStreak || 0);

        streakEndDate =
          parseDate(data.streakEndDate);


        console.log(
          "RESULT CURRENT STREAK:",
          currentStreak
        );

        console.log(
          "STREAK END:",
          data.streakEndDate
        );
      }


      renderCalendar();

    }
    catch(error){

      console.error(
        "CALENDAR LOAD ERROR:",
        error
      );

      renderCalendar();
    }
  }
);


// =====================================
// MONTH BUTTONS
// =====================================

prevBtn.onclick = () => {

  currentMonth--;

  if(currentMonth < 0){
    currentMonth = 11;
    currentYear--;
  }

  renderCalendar();
};


nextBtn.onclick = () => {

  currentMonth++;

  if(currentMonth > 11){
    currentMonth = 0;
    currentYear++;
  }

  renderCalendar();
};
