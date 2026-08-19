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

function dayOnly(date) {

  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  return d;
}


let today =
  dayOnly(new Date());

let currentMonth =
  today.getMonth();

let currentYear =
  today.getFullYear();


// =====================================
// FIRST PUZZLE
// =====================================

const firstPuzzleDate =
  dayOnly(
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
// GET QUIZ
// =====================================

function getQuiz(date) {

  try {

    const raw =
      localStorage.getItem(
        "quiz_" + dateKey(date)
      );

    if (!raw) return null;

    return JSON.parse(raw);

  } catch {

    return null;
  }
}


// =====================================
// SAME-DAY VALIDATION
//
// A puzzle counts for streak ONLY if:
//
// puzzle date == actual played date
//
// Example:
//
// quiz_17-08-26
// playedAt = 21 Aug
//
// => NOT a streak day
// =====================================

function validSameDay(date) {

  const quiz =
    getQuiz(date);

  if (
    !quiz ||
    quiz.attempted !== true ||
    !quiz.playedAt
  ) {

    return false;
  }


  const playedDate =
    dayOnly(
      new Date(
        quiz.playedAt
      )
    );


  return (
    playedDate.getTime() ===
    date.getTime()
  );
}


// =====================================
// FIRE DATES
//
// currentStreak comes directly from
// Results/Firestore.
//
// If currentStreak = 4:
//
// We go backward and take exactly
// 4 VALID SAME-DAY dates.
//
// =====================================

function getFireDates() {

  const fireDates = [];

  if (
    currentStreak <= 0
  ) {

    return fireDates;
  }


  today =
    dayOnly(new Date());


  // ===================================
  // TODAY
  //
  // If today's puzzle was played today,
  // start from today.
  //
  // Otherwise today is still available,
  // so start from yesterday.
  // ===================================

  let date =
    validSameDay(today)
      ? new Date(today)
      : new Date(today);


  if (
    !validSameDay(today)
  ) {

    date.setDate(
      date.getDate() - 1
    );

  }


  date =
    dayOnly(date);


  // ===================================
  // TAKE EXACTLY currentStreak DAYS
  //
  // But stop immediately when a date
  // is not a valid same-day play.
  // ===================================

  for (
    let i = 0;

    i < currentStreak;

    i++
  ) {

    if (
      date < firstPuzzleDate
    ) {

      break;
    }


    if (
      !validSameDay(date)
    ) {

      break;
    }


    fireDates.push(
      new Date(date)
    );


    date.setDate(
      date.getDate() - 1
    );

  }


  return fireDates;
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
    0 0 18px rgba(255,100,40,.55),
    0 0 30px rgba(255,70,30,.30);
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
  color: #fff !important;
}

.day.wrong-day.current-streak-day {
  background: #ef4444 !important;
  color: #fff !important;
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


  // ===================================
  // GET EXACT FIRE DATES
  // ===================================

  const fireDates =
    getFireDates();


  console.log(
    "RESULT CURRENT STREAK:",
    currentStreak
  );

  console.log(
    "FIRE DATES:",
    fireDates.map(
      date => dateKey(date)
    )
  );


  // ===================================
  // MONTH
  // ===================================

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


  // ===================================
  // EMPTY
  // ===================================

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const empty =
      document.createElement("div");

    empty.className =
      "day empty";

    calendarGrid.appendChild(
      empty
    );
  }


  // ===================================
  // DAYS
  // ===================================

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const cell =
      document.createElement("div");

    cell.className =
      "day";

    cell.textContent =
      day;


    const thisDate =
      dayOnly(
        new Date(
          currentYear,
          currentMonth,
          day
        )
      );


    const quiz =
      getQuiz(thisDate);


    // =================================
    // CORRECT / WRONG
    // =================================

    if (
      quiz &&
      quiz.attempted === true
    ) {

      if (
        quiz.correct === true
      ) {

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

    const isFire =
      fireDates.some(
        fireDate =>
          fireDate.getTime() ===
          thisDate.getTime()
      );


    if (isFire) {

      cell.classList.add(
        "current-streak-day"
      );

      cell.title =
        "🔥 Current Streak";
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
    // LOCKED / PLAYABLE
    // =================================

    if (
      thisDate <
      firstPuzzleDate
    ) {

      cell.classList.add(
        "disabled"
      );

    } else if (
      thisDate >
      today
    ) {

      cell.classList.add(
        "locked"
      );

    } else {

      cell.onclick =
        () => {

          window.location.href =
            "dailypuzzel.html?date=" +
            dateKey(thisDate);

        };
    }


    calendarGrid.appendChild(
      cell
    );
  }
}


// =====================================
// FIRESTORE
//
// Read the SAME currentStreak that
// Results page saves.
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


      if (
        snap.exists()
      ) {

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
        "CALENDAR ERROR:",
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

prevBtn.onclick =
  () => {

    currentMonth--;

    if (
      currentMonth < 0
    ) {

      currentMonth = 11;
      currentYear--;

    }

    renderCalendar();
  };


// =====================================
// NEXT MONTH
// =====================================

nextBtn.onclick =
  () => {

    currentMonth++;

    if (
      currentMonth > 11
    ) {

      currentMonth = 0;
      currentYear++;

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
