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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];


// =====================================
// TODAY
// =====================================

function todayDate() {

    const d = new Date();

    d.setHours(0, 0, 0, 0);

    return d;
}


let today = todayDate();

let currentMonth =
    today.getMonth();

let currentYear =
    today.getFullYear();


// =====================================
// FIRST PUZZLE
// =====================================

const firstPuzzleDate =
    new Date(2026, 6, 28);

firstPuzzleDate.setHours(
    0, 0, 0, 0
);


// =====================================
// THEME
// =====================================

function applyTheme(theme) {

    document.body.classList.remove(
        "theme-light",
        "theme-dark"
    );


    if (theme === "light") {

        document.body.classList.add(
            "theme-light"
        );

    }

    else if (theme === "dark") {

        document.body.classList.add(
            "theme-dark"
        );

    }

    else {

        if (
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        ) {

            document.body.classList.add(
                "theme-dark"
            );

        }

        else {

            document.body.classList.add(
                "theme-light"
            );

        }

    }

}


applyTheme(
    localStorage.getItem("theme") || "default"
);


// =====================================
// SYSTEM THEME
// =====================================

const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );


systemTheme.addEventListener(
    "change",
    () => {

        const theme =
            localStorage.getItem("theme")
            || "default";

        if (theme === "default") {

            applyTheme("default");

        }

    }
);


// =====================================
// STREAK CSS
// =====================================

const streakStyle =
    document.createElement("style");


streakStyle.textContent = `

.day.current-streak-day {

    position: relative;

    border: 3px solid #f59e0b !important;

    box-shadow:
        0 0 8px rgba(245,158,11,.65),
        0 0 18px rgba(245,158,11,.45),
        0 0 30px rgba(245,158,11,.25);

    z-index: 10;

}


.day.current-streak-day::after {

    content: "🔥";

    position: absolute;

    top: -18px;

    right: -7px;

    font-size: 21px;

    line-height: 1;

    z-index: 50;

    pointer-events: none;

}


.day.correct-day.current-streak-day {

    background: #22c55e !important;

    color: white !important;

    border-color: #16a34a !important;

}


.day.wrong-day.current-streak-day {

    background: #ef4444 !important;

    color: white !important;

    border-color: #dc2626 !important;

}


body.theme-dark
.day.current-streak-day {

    border-color: #f59e0b !important;

}

`;

document.head.appendChild(
    streakStyle
);


// =====================================
// DATE KEY
// =====================================

function makeDateKey(
    year,
    month,
    day
) {

    const d =
        String(day).padStart(2, "0");

    const m =
        String(month + 1).padStart(2, "0");

    const y =
        String(year).slice(-2);

    return `${d}-${m}-${y}`;
}


// =====================================
// DATE FROM KEY
// =====================================

function parseDateKey(key) {

    const parts =
        key.split("-");

    if (parts.length !== 3) {
        return null;
    }

    const day =
        Number(parts[0]);

    const month =
        Number(parts[1]) - 1;

    const year =
        Number("20" + parts[2]);

    const date =
        new Date(
            year,
            month,
            day
        );

    date.setHours(
        0, 0, 0, 0
    );

    return date;
}


// =====================================
// GET PUZZLE DATA
// =====================================

function getQuiz(key) {

    try {

        const raw =
            localStorage.getItem(
                "quiz_" + key
            );

        if (!raw) {
            return null;
        }

        return JSON.parse(raw);

    }

    catch (error) {

        console.error(
            "QUIZ ERROR:",
            error
        );

        return null;
    }
}


// =====================================
// GET SAME-DAY PLAYED DATES
//
// VERY IMPORTANT:
//
// quiz_17-08-26
//
// playedAt = 21 Aug
//
// => 17 IS NOT VALID
//
// quiz_17-08-26
//
// playedAt = 17 Aug
//
// => 17 IS VALID
// =====================================

function getValidPlayedDates() {

    const validDates = [];

    for (
        const key in localStorage
    ) {

        if (
            !key.startsWith("quiz_")
        ) {

            continue;
        }


        const puzzleKey =
            key.substring(5);


        const puzzleDate =
            parseDateKey(
                puzzleKey
            );


        if (!puzzleDate) {
            continue;
        }


        const quiz =
            getQuiz(
                puzzleKey
            );


        if (
            !quiz ||
            quiz.attempted !== true
        ) {

            continue;
        }


        if (
            !quiz.playedAt
        ) {

            continue;
        }


        const played =
            new Date(
                quiz.playedAt
            );


        if (
            Number.isNaN(
                played.getTime()
            )
        ) {

            continue;
        }


        played.setHours(
            0, 0, 0, 0
        );


        // =================================
        // THE MOST IMPORTANT RULE
        //
        // Puzzle date MUST equal
        // actual played date.
        // =================================

        if (
            played.getTime() ===
            puzzleDate.getTime()
        ) {

            validDates.push(
                puzzleDate
            );

        }

    }


    // =================================
    // REMOVE DUPLICATES
    // =================================

    const unique = [];


    for (
        const date of validDates
    ) {

        if (
            !unique.some(
                d =>
                    d.getTime() ===
                    date.getTime()
            )
        ) {

            unique.push(date);

        }

    }


    // OLD → NEW
    unique.sort(
        (a, b) =>
            a.getTime() -
            b.getTime()
    );


    return unique;
}


// =====================================
// CURRENT STREAK
//
// RULE:
//
// If TODAY played:
//     start from TODAY
//
// If TODAY NOT played:
//     start from YESTERDAY
//
// Then go backwards.
//
// First missing day = STOP.
//
// This means today's unfinished puzzle
// does NOT destroy yesterday's streak.
// =====================================

function getCurrentStreakDates() {

    const playedDates =
        getValidPlayedDates();


    if (
        playedDates.length === 0
    ) {

        return [];

    }


    const today =
        todayDate();


    // =================================
    // CHECK WHETHER TODAY IS VALID
    // =================================

    const todayPlayed =
        playedDates.some(
            date =>
                date.getTime() ===
                today.getTime()
        );


    // =================================
    // START DATE
    // =================================

    let checkDate =
        new Date(today);


    if (!todayPlayed) {

        // Today still has a chance.
        // Start from yesterday.

        checkDate.setDate(
            checkDate.getDate() - 1
        );

    }


    // =================================
    // BUILD CURRENT STREAK
    // =================================

    const streakDates = [];


    while (
        checkDate >= firstPuzzleDate
    ) {

        const found =
            playedDates.some(
                date =>
                    date.getTime() ===
                    checkDate.getTime()
            );


        // =================================
        // FIRST MISS = BREAK
        // =================================

        if (!found) {

            break;

        }


        streakDates.push(
            new Date(checkDate)
        );


        checkDate.setDate(
            checkDate.getDate() - 1
        );

    }


    return streakDates;
}


// =====================================
// RENDER CALENDAR
// =====================================

function renderCalendar() {

    today =
        todayDate();


    calendarGrid.innerHTML =
        "";


    monthTitle.textContent =
        `${months[currentMonth]} ${currentYear}`;


    // =================================
    // CURRENT STREAK DATES
    // =================================

    const streakDates =
        getCurrentStreakDates();


    console.log(
        "CURRENT STREAK:",
        streakDates.length
    );


    console.log(
        "STREAK DATES:",
        streakDates.map(
            date =>
                makeDateKey(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                )
        )
    );


    // =================================
    // MONTH INFO
    // =================================

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


    // =================================
    // EMPTY CELLS
    // =================================

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "day empty";

        calendarGrid.appendChild(
            empty
        );

    }


    // =================================
    // DAYS
    // =================================

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "day";


        cell.textContent =
            day;


        const thisDate =
            new Date(
                currentYear,
                currentMonth,
                day
            );


        thisDate.setHours(
            0, 0, 0, 0
        );


        const key =
            makeDateKey(
                currentYear,
                currentMonth,
                day
            );


        const quiz =
            getQuiz(key);


        // =================================
        // SOLVED / WRONG
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

            }

            else if (
                quiz.correct === false
            ) {

                cell.classList.add(
                    "wrong-day"
                );

            }

        }


        // =================================
        // CURRENT STREAK FIRE
        // =================================

        const isStreak =
            streakDates.some(
                date =>
                    date.getTime() ===
                    thisDate.getTime()
            );


        if (isStreak) {

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
        // LOCK / DISABLED
        // =================================

        if (
            thisDate <
            firstPuzzleDate
        ) {

            cell.classList.add(
                "disabled"
            );

        }

        else if (
            thisDate >
            today
        ) {

            cell.classList.add(
                "locked"
            );

        }

        else {

            cell.onclick =
                () => {

                    window.location.href =
                        "dailypuzzel.html?date=" +
                        key;

                };

        }


        calendarGrid.appendChild(
            cell
        );

    }

}


// =====================================
// BUTTONS
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
// FIRST LOAD
// =====================================

renderCalendar();


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
