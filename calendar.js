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
// TODAY
// =====================================

function dayOnly(date) {

  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  return d;
}


let today = dayOnly(new Date());

let currentMonth = today.getMonth();

let currentYear = today.getFullYear();

let currentStreak = 0;


// =====================================
// FIRST PUZZLE
// =====================================

const firstPuzzleDate =
  new Date(2026, 6, 28);

firstPuzzleDate.setHours(0, 0, 0, 0);


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
// GET QUIZ
// =====================================

function getQuiz(date) {

  try {

    const data =
      localStorage.getItem(
        "quiz_" + dateKey(date)
      );

    return data
      ? JSON.parse(data)
      : null;

  } catch {

    return null;
  }
}


// =====================================
// DID USER PLAY TODAY?
//
// IMPORTANT:
// Today's fire only starts after
// today's own puzzle was played TODAY.
// =====================================

function playedToday() {

  const quiz =
    getQuiz(today);

  if (
    !quiz ||
    quiz.attempted !== true ||
    !quiz.playedAt
  ) {

    return false;
  }


  const played =
    dayOnly(
      new Date(quiz.playedAt)
    );


  return (
    played.getTime() ===
    today.getTime()
  );
}


// =====================================
// CREATE FIRE DATES
//
// We DON'T calculate streak here.
//
// Results page already calculated
// currentStreak.
//
// We only use that NUMBER.
//
// Example:
//
// streak = 4
//
// Today played:
// Today, -1, -2, -3
//
// Today not played:
// Yesterday, -2, -3, -4
// =====================================

function getFireDates() {

  const dates = [];


  if (currentStreak <= 0) {

    return dates;
  }


  let start =
    new Date(today);


  // Today is still available to play.
  // If not played yet, fire ends yesterday.

  if (!playedToday()) {

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

    dates.push(d);
  }


  return dates;
}


// =====================================
// FIRE CSS
// =====================================

const style =
  document.createElement("style");


style.textContent = `

.day.streak-fire {
  position: relative;
  border: 3px solid #ff8a3d !important;
  box-shadow:
    0 0 8px rgba(255,140,50,.7),
    0 0 18px rgba(255,90,30,.45);
}

.day.streak-fire::after {
  content: "🔥";
  position: absolute;
  top: -17px;
  right: -6px;
  font-size: 21px;
  z-index: 10;
  pointer-events: none;
}

.day.correct-day.streak-fire {
  background: #22c55e !important;
  color: white !important;
}

.day.wrong-day.streak-fire {
  background: #ef4444 !important;
  color: white !important;
}

`;


document.head.appendChild(style);


// =====================================
// RENDER
// =====================================

function renderCalendar() {

  today =
    dayOnly(new Date());

  calendarGrid.innerHTML = "";

  monthTitle.textContent =
    `${months[currentMonth]} ${currentYear}`;


  const fireDates =
    getFireDates();


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


  // Empty cells

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


  // Days

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
      new Date(
        currentYear,
        currentMonth,
        day
      );

    thisDate.setHours(0, 0, 0, 0);


    const quiz =
      getQuiz(thisDate);


    // =================================
    // RESULT COLOR
    // =================================

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
    // =================================

    const hasFire =
      fireDates.some(
        d =>
          d.getTime() ===
          thisDate.getTime()
      );


    if (hasFire) {

      cell.classList.add(
        "streak-fire"
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

      cell.classList.add("today");
    }


    // =================================
    // LOCK / CLICK
    // =================================

    if (
      thisDate < firstPuzzleDate
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

      cell.addEventListener(
        "click",
        () => {

          window.location.href =
            "dailypuzzel.html?date=" +
            dateKey(thisDate);
        }
      );
    }


    calendarGrid.appendChild(cell);
  }
}


// =====================================
// FIREBASE
//
// Read EXACT currentStreak saved by
// results.js.
// =====================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      window.location.replace(
        "login.html"
      );

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


      console.log(
        "RESULT CURRENT STREAK:",
        currentStreak
      );


      renderCalendar();


    } catch (error) {

      console.error(
        "Calendar streak error:",
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
// REFRESH AFTER COMING BACK
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
