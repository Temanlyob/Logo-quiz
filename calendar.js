import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// ELEMENTS
// =====================================

const monthTitle =
  document.getElementById("monthTitle");

const calendarGrid =
  document.getElementById("calendarGrid");

const prevBtn =
  document.getElementById("prevMonth");

const nextBtn =
  document.getElementById("nextMonth");


// =====================================
// MONTHS
// =====================================

const months = [
  "January", "February", "March",
  "April", "May", "June",
  "July", "August", "September",
  "October", "November", "December"
];


// =====================================
// DATE
// =====================================

const cleanDate = d => {

  const x = new Date(d);

  x.setHours(0, 0, 0, 0);

  return x;

};


let today =
  cleanDate(new Date());

let month =
  today.getMonth();

let year =
  today.getFullYear();

let currentStreak = 0;


// =====================================
// FIRST PUZZLE
// =====================================

const firstPuzzle =
  cleanDate(
    new Date(2026, 6, 28)
  );


// =====================================
// DATE KEY
// =====================================

function dateKey(date) {

  const d =
    String(date.getDate())
      .padStart(2, "0");

  const m =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const y =
    String(date.getFullYear())
      .slice(-2);

  return `${d}-${m}-${y}`;
}


// =====================================
// TODAY PLAYED?
//
// ONLY used to decide whether fire
// starts from today or yesterday.
//
// We DO NOT calculate streak here.
// =====================================

function todayWasPlayed() {

  try {

    const raw =
      localStorage.getItem(
        "quiz_" + dateKey(today)
      );

    if (!raw) return false;

    const quiz =
      JSON.parse(raw);

    return (
      quiz &&
      quiz.attempted === true
    );

  } catch {

    return false;
  }
}


// =====================================
// FIRE DATES
//
// currentStreak comes directly from
// Results.
//
// Example currentStreak = 4:
//
// today played:
//  today
//  yesterday
//  -2
//  -3
//
// today not played:
//  yesterday
//  -2
//  -3
//  -4
// =====================================

function getFireDates() {

  const dates = [];

  if (currentStreak <= 0) {
    return dates;
  }


  let start =
    cleanDate(today);


  // Today is not played yet.
  // Don't put fire on today.
  if (!todayWasPlayed()) {

    start.setDate(
      start.getDate() - 1
    );

  }


  for (
    let i = 0;
    i < currentStreak;
    i++
  ) {

    const d =
      new Date(start);

    d.setDate(
      start.getDate() - i
    );

    d.setHours(0, 0, 0, 0);

    if (d >= firstPuzzle) {

      dates.push(d);

    }

  }


  return dates;
}


// =====================================
// FIRE CSS
// =====================================

const style =
  document.createElement("style");

style.textContent = `

.day.current-streak-day {
  position: relative;
  z-index: 5;
  border: 3px solid #ff8a3d !important;
  box-shadow:
    0 0 8px rgba(255,140,50,.75),
    0 0 18px rgba(255,90,30,.50);
}

.day.current-streak-day::after {
  content: "🔥";
  position: absolute;
  top: -19px;
  right: -7px;
  font-size: 22px;
  line-height: 1;
  z-index: 20;
  pointer-events: none;
}

.day.correct-day.current-streak-day {
  background: #22c55e !important;
  color: white !important;
}

.day.wrong-day.current-streak-day {
  background: #ef4444 !important;
  color: white !important;
}

`;

document.head.appendChild(style);


// =====================================
// RENDER CALENDAR
// =====================================

function renderCalendar() {

  today =
    cleanDate(new Date());

  calendarGrid.innerHTML = "";

  monthTitle.textContent =
    `${months[month]} ${year}`;


  const fireDates =
    getFireDates();


  console.log(
    "RESULT CURRENT STREAK:",
    currentStreak
  );

  console.log(
    "FIRE:",
    fireDates.map(dateKey)
  );


  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();


  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  // =====================================
  // EMPTY CELLS
  // =====================================

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const empty =
      document.createElement("div");

    empty.className =
      "day empty";

    calendarGrid.appendChild(empty);
  }


  // =====================================
  // DAYS
  // =====================================

  for (
    let day = 1;
    day <= days;
    day++
  ) {

    const cell =
      document.createElement("div");

    cell.className =
      "day";

    cell.textContent =
      day;


    const thisDate =
      cleanDate(
        new Date(
          year,
          month,
          day
        )
      );


    const key =
      dateKey(thisDate);


    // =================================
    // QUIZ RESULT
    // =================================

    let quiz = null;

    try {

      const raw =
        localStorage.getItem(
          "quiz_" + key
        );

      if (raw) {
        quiz = JSON.parse(raw);
      }

    } catch {}


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


    // =================================
    // FIRE
    //
    // NO CALCULATION.
    // Just compare date with the
    // last N dates from Results.
    // =================================

    const fire =
      fireDates.some(
        d =>
          d.getTime() ===
          thisDate.getTime()
      );


    if (fire) {

      cell.classList.add(
        "current-streak-day"
      );

    }


    // =================================
    // TODAY
    // =================================

    if (
      thisDate.getTime() ===
        today.getTime() &&
      !quiz
    ) {

      cell.classList.add(
        "today"
      );

    }


    // =================================
    // LOCK / OPEN
    // =================================

    if (
      thisDate < firstPuzzle
    ) {

      cell.classList.add(
        "disabled"
      );

    } else if (
      thisDate > today
    ) {

      cell.classList.add(
        "locked"
      );

    } else {

      cell.onclick = () => {

        window.location.href =
          "dailypuzzel.html?date=" +
          key;

      };

    }


    calendarGrid.appendChild(cell);

  }

}


// =====================================
// READ RESULTS CURRENT STREAK
// =====================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      location.href =
        "login.html";

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


      currentStreak =
        snap.exists()
          ? Number(
              snap.data().currentStreak || 0
            )
          : 0;


      console.log(
        "FINAL STREAK FROM RESULTS:",
        currentStreak
      );


      renderCalendar();


    } catch (error) {

      console.error(
        "CALENDAR FIRESTORE ERROR:",
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

prevBtn.onclick = () => {

  month--;

  if (month < 0) {

    month = 11;
    year--;

  }

  renderCalendar();

};


// =====================================
// NEXT MONTH
// =====================================

nextBtn.onclick = () => {

  month++;

  if (month > 11) {

    month = 0;
    year++;

  }

  renderCalendar();

};


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
