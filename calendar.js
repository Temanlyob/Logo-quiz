import { getTranslation } from "./translations.js";

const monthTitle = document.getElementById("monthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const months = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];

const monthNames = {

en:[
"January","February","March","April","May","June",
"July","August","September","October","November","December"
],

hi:[
"जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून",
"जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
],

gu:[
"જાન્યુઆરી","ફેબ્રુઆરી","માર્ચ","એપ્રિલ","મે",
"જૂન","જુલાઈ","ઑગસ્ટ","સપ્ટેમ્બર",
"ઓક્ટોબર","નવેમ્બર","ડિસેમ્બર"
]

};

let today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// First available puzzle
const firstPuzzleDate = new Date(2026, 6, 27); // 27 July 2026

function renderCalendar(){

  const language =
localStorage.getItem("language") || "en";

const t =
getTranslation(language);

// Bottom Navigation

const nav =
document.querySelectorAll(".bottom-nav span");

if(nav.length >= 4){

nav[0].textContent =
t.home;

nav[1].textContent =
t.calendar;

nav[2].textContent =
t.results;

nav[3].textContent =
t.profile;

}

calendarGrid.innerHTML="";

const months =
monthNames[language] ||
monthNames.en;

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
