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
// CURRENT DATE
// =====================================

function cleanDate(date) {

    const d = new Date(date);

    d.setHours(
        0,
        0,
        0,
        0
    );

    return d;
}


let today =
    cleanDate(new Date());


let currentMonth =
    today.getMonth();


let currentYear =
    today.getFullYear();


// =====================================
// CURRENT STREAK
//
// SAME AS HOME.JS
// =====================================

let currentStreak = 0;


// =====================================
// FIRST PUZZLE DATE
// =====================================

const firstPuzzleDate =
    cleanDate(
        new Date(
            2026,
            6,
            28
        )
    );


// =====================================
// THEME
// =====================================

function applyTheme(theme) {

    document.body.classList.remove(
        "theme-light",
        "theme-dark"
    );


    if (
        theme === "light"
    ) {

        document.body.classList.add(
            "theme-light"
        );

    }

    else if (
        theme === "dark"
    ) {

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


const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );


systemTheme.addEventListener(
    "change",
    () => {

        const theme =
            localStorage.getItem(
                "theme"
            ) || "default";


        if (
            theme === "default"
        ) {

            applyTheme("default");

        }

    }
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
        String(day)
            .padStart(2, "0");


    const m =
        String(month + 1)
            .padStart(2, "0");


    const y =
        String(year)
            .slice(-2);


    return `${d}-${m}-${y}`;
}


// =====================================
// QUIZ DATA
// =====================================

function getQuiz(
    date
) {

    try {

        const key =
            "quiz_" +
            makeDateKey(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );


        const saved =
            localStorage.getItem(key);


        return saved
            ? JSON.parse(saved)
            : null;

    }

    catch (error) {

        console.error(
            "QUIZ DATA ERROR:",
            error
        );

        return null;
    }
}


// =====================================
// FIRE DATES
//
// IMPORTANT:
//
// NO STREAK CALCULATION HERE.
//
// currentStreak comes directly from
// the same Firestore field used by
// home.js.
//
// If currentStreak = 5:
//
// Today
// Yesterday
// 2 days ago
// 3 days ago
// 4 days ago
//
// = exactly 5 🔥
// =====================================

function getFireDates() {

    const fireDates = [];


    if (
        currentStreak <= 0
    ) {

        return fireDates;
    }


    for (
        let i = 0;
        i < currentStreak;
        i++
    ) {

        const date =
            new Date(today);


        date.setDate(
            today.getDate() - i
        );


        date.setHours(
            0,
            0,
            0,
            0
        );


        if (
            date >= firstPuzzleDate
        ) {

            fireDates.push(
                date
            );

        }

    }


    return fireDates;
}


// =====================================
// STREAK CSS
// =====================================

const streakStyle =
    document.createElement(
        "style"
    );


streakStyle.textContent = `

.day.current-streak-day {

    position: relative;

    background: #fff3cd !important;

    color: #d97706 !important;

    border: 2px solid #f59e0b !important;

    box-shadow:
        0 0 8px rgba(245,158,11,.45),
        0 0 18px rgba(245,158,11,.35),
        0 0 30px rgba(245,158,11,.20);

    animation:
        streakFire 1.4s ease-in-out infinite;

}


.day.current-streak-day::after {

    content: "🔥";

    position: absolute;

    top: -13px;

    right: -7px;

    font-size: 18px;

    line-height: 1;

    z-index: 20;

    filter:
        drop-shadow(
            0 0 4px rgba(245,158,11,.65)
        );

}


.day.correct-day.current-streak-day {

    background: #22c55e !important;

    color: #ffffff !important;

    border-color: #16a34a !important;

    box-shadow:
        0 0 8px rgba(34,197,94,.60),
        0 0 18px rgba(34,197,94,.45),
        0 0 30px rgba(245,158,11,.35);

}


.day.wrong-day.current-streak-day {

    background: #ef4444 !important;

    color: #ffffff !important;

    border-color: #dc2626 !important;

    box-shadow:
        0 0 8px rgba(239,68,68,.60),
        0 0 18px rgba(239,68,68,.45),
        0 0 30px rgba(245,158,11,.35);

}


@keyframes streakFire {

    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.035);
    }

    100% {
        transform: scale(1);
    }

}


body.theme-dark
.day.current-streak-day {

    background: #3a2d12 !important;

    color: #fbbf24 !important;

    border-color: #f59e0b !important;

}


body.theme-dark
.day.correct-day.current-streak-day {

    background: #22c55e !important;

    color: #ffffff !important;

}


body.theme-dark
.day.wrong-day.current-streak-day {

    background: #ef4444 !important;

    color: #ffffff !important;

}

`;


document.head.appendChild(
    streakStyle
);


// =====================================
// RENDER CALENDAR
// =====================================

function renderCalendar() {

    today =
        cleanDate(new Date());


    calendarGrid.innerHTML =
        "";


    monthTitle.textContent =
        months[currentMonth] +
        " " +
        currentYear;


    // =================================
    // FIRE DATES
    //
    // DIRECTLY FROM currentStreak
    // =================================

    const fireDates =
        getFireDates();


    console.log(
        "HOME CURRENT STREAK:",
        currentStreak
    );


    console.log(
        "CALENDAR FIRE DATES:",
        fireDates.map(
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
            cleanDate(
                new Date(
                    currentYear,
                    currentMonth,
                    day
                )
            );


        const dateKey =
            makeDateKey(
                currentYear,
                currentMonth,
                day
            );


        // =================================
        // QUIZ RESULT
        // =================================

        const quiz =
            getQuiz(
                thisDate
            );


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
        //
        // ONLY compares dates.
        // =================================

        const isFire =
            fireDates.some(
                fireDate =>
                    fireDate.getTime() ===
                    thisDate.getTime()
            );


        if (
            isFire
        ) {

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
        // BEFORE FIRST PUZZLE
        // =================================

        if (
            thisDate <
            firstPuzzleDate
        ) {

            cell.classList.add(
                "disabled"
            );

        }


        // =================================
        // FUTURE
        // =================================

        else if (
            thisDate >
            today
        ) {

            cell.classList.add(
                "locked"
            );

        }


        // =================================
        // PLAYABLE
        // =================================

        else {

            cell.onclick =
                () => {

                    window.location.href =
                        "dailypuzzel.html?date=" +
                        dateKey;

                };

        }


        calendarGrid.appendChild(
            cell
        );

    }

}


// =====================================
// LOAD PROGRESS
//
// THIS IS COPIED FROM HOME.JS:
//
// const snap = await getDoc(userRef)
//
// currentStreak =
//     data.currentStreak ?? 0;
//
// =====================================

async function loadProgress(
    user
) {

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const snap =
            await getDoc(
                userRef
            );


        let currentStreakFromDB =
            0;


        if (
            snap.exists()
        ) {

            const data =
                snap.data();


            currentStreakFromDB =
                data.currentStreak ?? 0;

        }


        // =================================
        // EXACT SAME VALUE AS HOME
        // =================================

        currentStreak =
            Number(
                currentStreakFromDB
            );


        console.log(
            "HOME/RESULT CURRENT STREAK:",
            currentStreak
        );


        renderCalendar();


    }

    catch (error) {

        console.error(
            "CALENDAR PROGRESS ERROR:",
            error
        );


        currentStreak = 0;


        renderCalendar();

    }

}


// =====================================
// AUTH
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


        await loadProgress(
            user
        );

    }
);


// =====================================
// PREVIOUS MONTH
// =====================================

prevBtn.addEventListener(
    "click",
    () => {

        currentMonth--;


        if (
            currentMonth < 0
        ) {

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


        if (
            currentMonth > 11
        ) {

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
    async () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            const user =
                auth.currentUser;


            if (user) {

                await loadProgress(
                    user
                );

            }

        }

    }
);


// =====================================
// PAGE SHOW
// =====================================

window.addEventListener(
    "pageshow",
    async () => {

        const user =
            auth.currentUser;


        if (user) {

            await loadProgress(
                user
            );

        }

    }
);
