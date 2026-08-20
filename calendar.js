import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


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

let today = new Date();

today.setHours(0, 0, 0, 0);


let currentMonth =
    today.getMonth();

let currentYear =
    today.getFullYear();


// =====================================
// FIRST PUZZLE DATE
// 28 JULY 2026
// =====================================

const firstPuzzleDate =
    new Date(2026, 6, 28);

firstPuzzleDate.setHours(0, 0, 0, 0);


// =====================================
// ALL GAMES
//
// Firestore = MAIN SOURCE
// localStorage = BACKUP
// =====================================

let allGames = {};


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


// Initial theme

applyTheme(
    localStorage.getItem("theme") || "default"
);


// Follow phone theme

const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );


systemTheme.addEventListener(
    "change",
    () => {

        const currentTheme =
            localStorage.getItem("theme") || "default";


        if (
            currentTheme === "default"
        ) {

            applyTheme("default");

        }

    }
);


// =====================================
// STREAK FIRE CSS
// =====================================

const streakStyle =
    document.createElement("style");


streakStyle.textContent = `

.day.current-streak-day{

    position:relative;

    z-index:2;

    border:2px solid #ff9f43 !important;

    box-shadow:
        0 0 8px rgba(255,140,50,.70),
        0 0 18px rgba(255,90,50,.55),
        0 0 30px rgba(255,70,40,.30);

    animation:
        streakFire 1.4s ease-in-out infinite;

}


.day.current-streak-day::after{

    content:"🔥";

    position:absolute;

    top:-14px;

    right:-7px;

    font-size:18px;

    line-height:1;

    filter:
        drop-shadow(
            0 0 4px rgba(255,120,30,.75)
        );

}


/* GREEN STREAK */

.day.correct-day.current-streak-day{

    background:#22c55e !important;

    color:#ffffff !important;

}


/* RED STREAK */

.day.wrong-day.current-streak-day{

    background:#ef4444 !important;

    color:#ffffff !important;

}


/* FIRE ANIMATION */

@keyframes streakFire{

    0%{

        box-shadow:
            0 0 7px rgba(255,140,50,.55),
            0 0 15px rgba(255,90,50,.35);

        transform:scale(1);

    }

    50%{

        box-shadow:
            0 0 15px rgba(255,170,50,.95),
            0 0 28px rgba(255,80,40,.70),
            0 0 40px rgba(255,60,30,.35);

        transform:scale(1.035);

    }

    100%{

        box-shadow:
            0 0 7px rgba(255,140,50,.55),
            0 0 15px rgba(255,90,50,.35);

        transform:scale(1);

    }

}


/* DARK MODE */

body.theme-dark .day.current-streak-day{

    border-color:#ff9f43 !important;

    box-shadow:
        0 0 10px rgba(255,140,50,.85),
        0 0 22px rgba(255,80,40,.60),
        0 0 35px rgba(255,60,30,.40);

}


body.theme-dark
.day.correct-day.current-streak-day{

    background:#22c55e !important;

    color:#ffffff !important;

}


body.theme-dark
.day.wrong-day.current-streak-day{

    background:#ef4444 !important;

    color:#ffffff !important;

}

`;


document.head.appendChild(
    streakStyle
);


// =====================================
// DATE KEY
// DD-MM-YY
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
// PARSE DATE KEY
// =====================================

function parseDateKey(dateKey) {

    const parts =
        dateKey.split("-");


    if (
        parts.length !== 3
    ) {

        return null;

    }


    const day =
        Number(parts[0]);

    const month =
        Number(parts[1]) - 1;

    const year =
        Number(
            "20" + parts[2]
        );


    const date =
        new Date(
            year,
            month,
            day
        );


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;

}


// =====================================
// ACTUAL PLAY DATE
//
// SAME AS results.js
// =====================================

function getActualPlayDate(item) {

    if (
        !item ||
        !item.playedAt
    ) {

        return null;

    }


    const playedAt =
        new Date(
            item.playedAt
        );


    if (
        Number.isNaN(
            playedAt.getTime()
        )
    ) {

        return null;

    }


    playedAt.setHours(
        0,
        0,
        0,
        0
    );


    return playedAt;

}


// =====================================
// GET ALL GAMES
//
// SAME LOGIC AS results.js
// =====================================

function getAllGames(
    firestoreHistory
) {

    const games = {};


    // =================================
    // FIRESTORE
    // =================================

    for (
        const key in firestoreHistory
    ) {

        const item =
            firestoreHistory[key];


        if (
            !item ||
            item.played !== true
        ) {

            continue;

        }


        games[key] = {
            ...item
        };

    }


    // =================================
    // LOCAL STORAGE BACKUP
    // =================================

    for (
        let key in localStorage
    ) {

        if (
            !key.startsWith("quiz_")
        ) {

            continue;

        }


        const dateKey =
            key.replace(
                "quiz_",
                ""
            );


        try {

            const localQuiz =
                JSON.parse(
                    localStorage.getItem(key)
                );


            if (
                !localQuiz ||
                localQuiz.attempted !== true
            ) {

                continue;

            }


            if (
                !games[dateKey]
            ) {

                games[dateKey] = {
                    ...localQuiz
                };

            }

        }

        catch(error) {

            console.error(
                "LOCAL QUIZ ERROR:",
                error
            );

        }

    }


    return games;

}


// =====================================
// GET STREAK ELIGIBLE DATES
//
// EXACT SAME LOGIC AS results.js
// =====================================

function getStreakDates(history) {

    const dates = [];


    for (
        const key in history
    ) {

        const item =
            history[key];


        if (
            !item ||
            item.played !== true
        ) {

            continue;

        }


        const actualPlayDate =
            getActualPlayDate(
                item
            );


        if (!actualPlayDate) {

            continue;

        }


        const puzzleDateObj =
            parseDateKey(key);


        if (!puzzleDateObj) {

            continue;

        }


        // IMPORTANT
        // Puzzle date and actual
        // play date must be same.

        if (
            puzzleDateObj.getTime() !==
            actualPlayDate.getTime()
        ) {

            continue;

        }


        dates.push(
            actualPlayDate
        );

    }


    // =================================
    // REMOVE DUPLICATES
    // =================================

    const uniqueDates = [];


    for (
        const date of dates
    ) {

        const exists =
            uniqueDates.some(
                existing =>
                    existing.getTime() ===
                    date.getTime()
            );


        if (!exists) {

            uniqueDates.push(
                date
            );

        }

    }


    // OLD → NEW

    uniqueDates.sort(
        (a, b) =>
            a.getTime() -
            b.getTime()
    );


    return uniqueDates;

}


// =====================================
// GET CURRENT STREAK DATES
//
// Example:
//
// 17 + 18 + 19 + 20
//
// Result:
//
// 17 🔥
// 18 🔥
// 19 🔥
// 20 🔥
//
// =====================================

function getCurrentStreakDates(
    streakDates
) {

    const result = [];


    if (
        streakDates.length === 0
    ) {

        return result;

    }


    const todayDate =
        new Date();

    todayDate.setHours(
        0,
        0,
        0,
        0
    );


    const latest =
        streakDates[
            streakDates.length - 1
        ];


    // =================================
    // TODAY MUST BE COMPLETED
    // =================================

    if (
        latest.getTime() !==
        todayDate.getTime()
    ) {

        return result;

    }


    // Today belongs to streak.

    result.push(
        latest
    );


    // =================================
    // GO BACKWARDS
    // =================================

    for (
        let i =
            streakDates.length - 1;

        i > 0;

        i--
    ) {

        const current =
            streakDates[i];

        const previous =
            streakDates[i - 1];


        const diffDays =
            Math.round(
                (
                    current.getTime() -
                    previous.getTime()
                ) /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        if (
            diffDays === 1
        ) {

            result.push(
                previous
            );

        }

        else {

            break;

        }

    }


    return result;

}


// =====================================
// RENDER CALENDAR
// =====================================

function renderCalendar() {

    calendarGrid.innerHTML = "";


    // =================================
    // MONTH TITLE
    // =================================

    monthTitle.innerHTML =
        months[currentMonth] +
        " " +
        currentYear;


    // =================================
    // STREAK
    // =================================

    const streakDates =
        getStreakDates(
            allGames
        );


    const currentStreakDates =
        getCurrentStreakDates(
            streakDates
        );


    // =================================
    // FIRST DAY
    // =================================

    const firstDay =
        new Date(
            currentYear,
            currentMonth,
            1
        ).getDay();


    // =================================
    // DAYS IN MONTH
    // =================================

    const daysInMonth =
        new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();


    // =================================
    // EMPTY BOXES
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
    // EACH DAY
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


        cell.innerHTML =
            day;


        const thisDate =
            new Date(
                currentYear,
                currentMonth,
                day
            );


        thisDate.setHours(
            0,
            0,
            0,
            0
        );


        const dateKey =
            makeDateKey(
                currentYear,
                currentMonth,
                day
            );


        // =================================
        // GET RESULT
        // =================================

        const quiz =
            allGames[dateKey];


        // =================================
        // CORRECT / WRONG
        // =================================

        if (quiz) {

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

        const isCurrentStreakDate =
            currentStreakDates.some(
                streakDate =>
                    streakDate.getTime() ===
                    thisDate.getTime()
            );


        if (
            isCurrentStreakDate
        ) {

            cell.classList.add(
                "current-streak-day"
            );

            cell.title =
                "🔥 Current Streak Day";

        }


        // =================================
        // TODAY
        // =================================

        if (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear() &&
            !quiz
        ) {

            cell.classList.add(
                "today"
            );

        }


        // =================================
        // DISABLED / LOCKED
        // =================================

        if (
            thisDate < firstPuzzleDate
        ) {

            cell.classList.add(
                "disabled"
            );

        }

        else if (
            thisDate > today
        ) {

            cell.classList.add(
                "locked"
            );

        }

        else {

            cell.onclick =
                function() {

                    window.location.href =
                        `dailypuzzel.html?date=${dateKey}`;

                };

        }


        calendarGrid.appendChild(
            cell
        );

    }

}


// =====================================
// FIREBASE AUTH
// =====================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "login.html"
            );

            return;

        }


        try {

            // =================================
            // USER DOCUMENT
            // =================================

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


            let history = {};


            if (
                snap.exists()
            ) {

                const data =
                    snap.data();


                history =
                    data.history || {};

            }


            // =================================
            // MERGE DATA
            // =================================

            allGames =
                getAllGames(
                    history
                );


            // =================================
            // DEBUG
            // =================================

            const streakDates =
                getStreakDates(
                    allGames
                );


            const currentStreakDates =
                getCurrentStreakDates(
                    streakDates
                );


            console.log(
                "CALENDAR ALL GAMES:",
                allGames
            );


            console.log(
                "CALENDAR STREAK DATES:",
                currentStreakDates
            );


            console.log(
                "CALENDAR CURRENT STREAK:",
                currentStreakDates.length
            );


            // =================================
            // RENDER AFTER FIRESTORE LOAD
            // =================================

            renderCalendar();

        }

        catch(error) {

            console.error(
                "CALENDAR FIREBASE ERROR:",
                error
            );


            // LocalStorage fallback

            allGames =
                getAllGames({});


            renderCalendar();

        }

    }
);


// =====================================
// PREVIOUS MONTH
// =====================================

prevBtn.onclick =
    function() {

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
    function() {

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
// REFRESH WHEN PAGE VISIBLE
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
