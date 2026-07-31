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

if(
day===today.getDate() &&
currentMonth===today.getMonth() &&
currentYear===today.getFullYear()
){

cell.classList.add("today");

}

if(thisDate>today){

cell.classList.add("locked");

}else{

cell.onclick=function(){

const d=String(day).padStart(2,"0");
const m=String(currentMonth+1).padStart(2,"0");
const y=String(currentYear).slice(-2);

window.location.href=
`dailypuzzel.html?date=${d}-${m}-${y}`;

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
