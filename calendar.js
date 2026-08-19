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
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

let today = cleanDate(new Date());
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

let currentStreak = 0;

const firstPuzzleDate =
  cleanDate(new Date(2026, 6, 28));

function cleanDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);

  return `${d}-${m}-${y}`;
}

function getQuiz(date) {
  try {
    const raw =
      localStorage.getItem(
        "quiz_" + dateKey(date)
      );

    return raw ? JSON.parse(raw) : null;

  } catch {
    return null;
  }
}


// =====================================
// DID USER PLAY TODAY?
// =====================================

function playedToday() {

  const quiz = getQuiz(today);

  if (!quiz || quiz.attempted !== true) {
    return false;
  }

  return true;
}


// =====================================
// FIRE DATES
//
// ONLY currentStreak NUMBER is used.
//
// Example:
// currentStreak = 3
// today played
//
// 19, 18, 17
//
// =====================================

function getFireDates() {

  const result = [];

  if (currentStreak <= 0) {
    return result;
  }

  let start = cleanDate(today);

  // Today not played yet:
  // don't count today as a fire date.
  if (!playedToday()) {
    start.setDate(start.getDate() - 1);
  }

  for (let i = 0; i < currentStreak; i++) {

    const d = new Date(start);

    d.setDate(
      start.getDate() - i
    );

    d.setHours(0, 0, 0, 0);

    if (d >= firstPuzzleDate) {
      result.push(d);
    }
  }

  return result;
}


// =====================================
// FIRE STYLE
// =====================================

const style = document.createElement("style");

style.textContent = `

.day.current-streak-day {
  position: relative !important;
  z-index: 10 !important;
  border: 3px solid #ff8a3d !important;
  box-shadow:
    0 0 8px rgba(255,140,50,.8),
    0 0 18px rgba(255,90,30,.55) !important;
}

.day.current-streak-day .streak-fire {
  position: absolute;
  top: -23px;
  right: -8px;
  z-index: 999;
  font-size: 23px;
  line-height: 1;
  display: block;
  pointer-events: none;
}

`;

document.head.appendChild(style);


// =====================================
// RENDER
// =====================================

function renderCalendar() {

  today = cleanDate(new Date());

  calendarGrid.innerHTML = "";

  monthTitle.textContent =
    `${months[currentMonth]} ${currentYear}`;

  const fireDates = getFireDates();

  console.log(
    "CURRENT STREAK:",
    currentStreak
  );

  console.log(
    "FIRE DATES:",
    fireDates.map(dateKey)
  );

  const firstDay =
    new Date(
      currentYear,
      currentMonth,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();


  // =====================================
  // EMPTY CELLS
  // =====================================

  for (let i = 0; i < firstDay; i++) {

    const empty =
      document.createElement("div");

    empty.className = "day empty";

    calendarGrid.appendChild(empty);
  }


  // =====================================
  // DAYS
  // =====================================

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const cell =
      document.createElement("div");

    cell.className = "day";

    cell.textContent = day;

    const thisDate =
      cleanDate(
        new Date(
          currentYear,
          currentMonth,
          day
        )
      );

    const key =
      dateKey(thisDate);

    const quiz =
      getQuiz(thisDate);


    // =====================================
    // RESULT COLOR
    // =====================================

    if (
      quiz &&
      quiz.attempted === true
    ) {

      if (quiz.correct === true) {

        cell.classList.add(
          "correct-day"
        );

      } else if (
        quiz.correct === false
      ) {

        cell.classList.add(
          "wrong-day"
        );
      }
    }


    // =====================================
    // FIRE CHECK
    // =====================================

    const isFire =
      fireDates.some(
        fireDate =>
          fireDate.getTime() ===
          thisDate.getTime()
      );


    // =====================================
    // ACTUAL FIRE ELEMENT
    // =====================================

    if (isFire) {

      cell.classList.add(
        "current-streak-day"
      );

      const fire =
        document.createElement("span");

      fire.className =
        "streak-fire";

      fire.textContent = "🔥";

      cell.appendChild(fire);
    }


    // =====================================
    // TODAY
    // =====================================

    if (
      thisDate.getTime() ===
        today.getTime() &&
      !quiz
    ) {

      cell.classList.add("today");
    }


    // =====================================
    // LOCK / OPEN
    // =====================================

    if (
      thisDate < firstPuzzleDate
    ) {

      cell.classList.add("disabled");

    } else if (
      thisDate > today
    ) {

      cell.classList.add("locked");

    } else {

      cell.addEventListener(
        "click",
        () => {

          window.location.href =
            "dailypuzzel.html?date=" +
            key;

        }
      );
    }


    calendarGrid.appendChild(cell);
  }
}


// =====================================
// GET CURRENT STREAK FROM RESULTS
// =====================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {
      location.href = "login.html";
      return;
    }

    try {

      const snap =
        await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );

      if (snap.exists()) {

        currentStreak =
          Number(
            snap.data().currentStreak || 0
          );

      } else {

        currentStreak = 0;
      }

      renderCalendar();

    } catch (error) {

      console.error(
        "Calendar error:",
        error
      );

      currentStreak = 0;

      renderCalendar();
    }
  }
);


// =====================================
// PREVIOUS MONTH
// =====================================

prevBtn.addEventListener(
  "click",
  () => {

    currentMonth--;

    if (currentMonth < 0) {

      currentMonth = 11;
      currentYear--;

    }

    renderCalendar();
  }
);


// =====================================
// NEXT MONTH
// =====================================

nextBtn.addEventListener(
  "click",
  () => {

    currentMonth++;

    if (currentMonth > 11) {

      currentMonth = 0;
      currentYear++;

    }

    renderCalendar();
  }
);


// =====================================
// REFRESH
// =====================================

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      renderCalendar();
    }
  }
);
