// =============================
// THEME
// =============================

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

    // Default = phone system theme

    if(
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ){

      document.body.classList.add("theme-dark");

    }

  }

}

// Apply saved theme
applyTheme(
  localStorage.getItem("theme") || "default"
);

// Follow phone theme when Default is selected
window.matchMedia(
  "(prefers-color-scheme: dark)"
).addEventListener("change",()=>{

  const currentTheme =
    localStorage.getItem("theme") || "default";

  if(currentTheme === "default"){

    applyTheme("default");

  }

});

const monthTitle = document.getElementById("monthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const months = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];

let today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// First available puzzle
const firstPuzzleDate = new Date(2026, 6, 27); // 27 July 2026

function renderCalendar(){

calendarGrid.innerHTML="";

monthTitle.innerHTML =
months[currentMonth] + " " + currentYear;

const firstDay =
new Date(currentYear,currentMonth,1).getDay();

const daysInMonth =
new Date(currentYear,currentMonth+1,0).getDate();

for(let i=0;i<firstDay;i++){

const empty=document.createElement("div");

empty.className="day empty";

calendarGrid.appendChild(empty);

}

for(let day=1;day<=daysInMonth;day++){

const cell=document.createElement("div");

cell.className="day";

cell.innerHTML=day;

const thisDate =
new Date(currentYear,currentMonth,day);

const d = String(day).padStart(2,"0");
const m = String(currentMonth+1).padStart(2,"0");
const y = String(currentYear).slice(-2);

const dateKey = `${d}-${m}-${y}`;

const quiz =
JSON.parse(
localStorage.getItem("quiz_"+dateKey)
);

if(quiz){

if(quiz.correct){

cell.classList.add("correct-day");

}else{

cell.classList.add("wrong-day");

}

}    

if(
day===today.getDate() &&
currentMonth===today.getMonth() &&
currentYear===today.getFullYear() &&
!quiz
){

cell.classList.add("today");

}

if(thisDate < firstPuzzleDate){

cell.classList.add("disabled");

}else if(thisDate > today){

cell.classList.add("locked");

}else{

cell.onclick=function(){

window.location.href=
`dailypuzzel.html?date=${dateKey}`;

};

}

calendarGrid.appendChild(cell);

}

}

prevBtn.onclick=function(){

currentMonth--;

if(currentMonth<0){

currentMonth=11;

currentYear--;

}

renderCalendar();

};

nextBtn.onclick=function(){

currentMonth++;

if(currentMonth>11){

currentMonth=0;

currentYear++;

}

renderCalendar();

};

renderCalendar();
