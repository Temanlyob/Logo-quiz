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

const monthTitle = document.getElementById("monthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");


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

let today = new Date();

today.setHours(0, 0, 0, 0);

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();


// =====================================
// FIRST PUZZLE DATE
// =====================================

const firstPuzzleDate = new Date(2026, 6, 28);

firstPuzzleDate.setHours(0, 0, 0, 0);


// =====================================
// GAME DATA
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

        document.body.classList.add("theme-light");

    } else if (theme === "dark") {

        document.body.classList.add("theme-dark");

    } else {

        if (
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        ) {

            document.body.classList.add("theme-dark");

        } else {

            document.body.classList.add("theme-light");

        }

    }
}


applyTheme(
    localStorage.getItem("theme") || "default"
);


const systemTheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
);


systemTheme.addEventListener(
    "change",
    () => {

        const savedTheme =
            localStorage.getItem("theme") || "default";

        if (savedTheme === "default") {
            applyTheme("default");
        }

    }
);


// =====================================
// STREAK FIRE STYLE
// =====================================

const streakStyle = document.createElement("style");

streakStyle.textContent = `

.day.current-streak-day {

    position: relative;
    z-index: 2;

    border-color: #ff9f43 !important;

    box-shadow:
        0 0 8px rgba(255,140,50,.70),
        0 0 18px rgba(255,90,50,.55),
        0 0 30px rgba(255,70,40,.30);

    animation: streakFire 1.4s ease-in-out infinite;
}


.day.current-streak-day::after {

    content: "🔥";

    position: absolute;

    top: -14px;
    right: -7px;

    font-size: 18px;
    line-height: 1;

    filter:
        drop-shadow(
            0 0 4px rgba(255,120,30,.75)
        );
}


.day.correct-day.current-streak-day {

    background: #22c55e !important;
    color: #ffffff !important;
}


.day.wrong-day.current-streak-day {

    background: #ef4444 !important;
    color: #ffffff !important;
}


@keyframes streakFire {

    0% {

        box-shadow:
            0 0 7px rgba(255,140,50,.55),
            0 0 15px rgba(255,90,50,.35);

        transform: scale(1);
    }

    50% {

        box-shadow:
            0 0 15px rgba(255,170,50,.95),
            0 0 28px rgba(255,80,40,.70),
            0 0 40px rgba(255,60,30,.35);

        transform: scale(1.035);
    }

    100% {

        box-shadow:
            0 0 7px rgba(255,140,50,.55),
            0 0 15px rgba(255,90,50,.35);

        transform: scale(1);
    }
}


body.theme-dark .day.current-streak-day {

    border-color: #ff9f43 !important;

    box-shadow:
        0 0 10px rgba(255,140,50,.85),
        0 0 22px rgba(255,80,40,.60),
        0 0 35px rgba(255,60,30,.40);
}

`;

document.head.appendChild(streakStyle);


// =====================================
// DATE KEY
// DD-MM-YY
// =====================================

function makeDateKey(year, month, day) {

    const d = String(day).padStart(2, "0");
    const m = String(month + 1).padStart(2, "0");
    const y = String(year).slice(-2);

    return `${d}-${m}-${y}`;
}


// =====================================
// PARSE DD-MM-YY
// =====================================

function parseDateKey(dateKey) {

    const parts = dateKey.split("-");

    if (parts.length !== 3) {
        return null;
    }

    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number("20" + parts[2]);

    const date = new Date(
        year,
        month,
        day
    );

    date.setHours(0, 0, 0, 0);

    return date;
}


// =====================================
// LOCAL DATE ONLY
// =====================================

function getLocalDateOnly(date) {

    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
}


// =====================================
// GET PLAYED DATE
//
// Supports:
//
// 1. Firestore Timestamp
// 2. Date
// 3. Date string
// 4. Timestamp-like object
// =====================================

function getActualPlayDate(item) {

    if (!item || !item.playedAt) {
        return null;
    }

    let playedAt;

    // Firestore Timestamp
    if (
        item.playedAt &&
        typeof item.playedAt.toDate === "function"
    ) {

        playedAt = item.playedAt.toDate();

    }

    // JavaScript Date
    else if (
        item.playedAt instanceof Date
    ) {

        playedAt = item.playedAt;

    }

    // Timestamp-like Firestore object
    else if (
        typeof item.playedAt === "object" &&
        typeof item.playedAt.seconds === "number"
    ) {

        playedAt = new Date(
            item.playedAt.seconds * 1000
        );

    }

    // String / number
    else {

        playedAt = new Date(
            item.playedAt
        );

    }

    if (
        Number.isNaN(
            playedAt.getTime()
        )
    ) {

        return null;
    }

    return getLocalDateOnly(playedAt);
}


// =====================================
// GET ALL GAMES
//
// FIRESTORE HISTORY FIRST
//
// localStorage is used ONLY when
// Firestore doesn't have that puzzle.
// =====================================

function getAllGames(firestoreHistory) {

    const games = {};

    // =================================
    // FIRESTORE
    // =================================

    for (const key in firestoreHistory) {

        const item = firestoreHistory[key];

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

    for (const key in localStorage) {

        if (!key.startsWith("quiz_")) {
            continue;
        }

        const dateKey = key.replace(
            "quiz_",
            ""
        );

        try {

            const localQuiz = JSON.parse(
                localStorage.getItem(key)
            );

            if (
                !localQuiz ||
                localQuiz.attempted !== true
            ) {

                continue;
            }

            // Never overwrite Firestore data.

            if (!games[dateKey]) {

                games[dateKey] = {
                    ...localQuiz
                };

            }

        } catch (error) {

            console.error(
                "LOCAL QUIZ ERROR:",
                error
            );

        }
    }

    return games;
}


// =====================================
// GET STREAK DATES
//
// SAME RULE AS RESULTS.JS
//
// A puzzle counts for streak only when:
//
// puzzle date === actual play date
// =====================================

function getStreakDates(history) {

    const dates = [];

    for (const key in history) {

        const item = history[key];

        if (
            !item ||
            item.played !== true
        ) {

            continue;
        }


        const actualPlayDate =
            getActualPlayDate(item);

        if (!actualPlayDate) {
            continue;
        }


        const puzzleDate =
            parseDateKey(key);

        if (!puzzleDate) {
            continue;
        }


        // =================================
        // IMPORTANT STREAK RULE
        // =================================

        if (
            puzzleDate.getTime() !==
            actualPlayDate.getTime()
        ) {

            continue;
        }


        dates.push(actualPlayDate);
    }


    // =================================
    // REMOVE DUPLICATES
    // =================================

    const uniqueDates = [];

    for (const date of dates) {

        const alreadyExists =
            uniqueDates.some(
                existing =>
                    existing.getTime() ===
                    date.getTime()
            );

        if (!alreadyExists) {
            uniqueDates.push(date);
        }
    }


    // =================================
    // OLD → NEW
    // =================================

    uniqueDates.sort(
        (a, b) =>
            a.getTime() - b.getTime()
    );

    return uniqueDates;
}


// =====================================
// CURRENT STREAK
//
// SAME LOGIC AS RESULTS.JS
// =====================================

function calculateCurrentStreak(streakDates) {

    if (streakDates.length === 0) {
        return 0;
    }


    const today =
        getLocalDateOnly(
            new Date()
        );


    const latest =
        streakDates[
            streakDates.length - 1
        ];


    // Today must be completed.

    if (
        latest.getTime() !==
        today.getTime()
    ) {

        return 0;
    }


    let streak = 1;


    for (
        let i = streakDates.length - 1;
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


        if (diffDays === 1) {

            streak++;

        } else {

            break;
        }
    }


    return streak;
}


// =====================================
// GET CURRENT STREAK DATES
//
// These are the ONLY dates that
// receive the 🔥 effect.
// =====================================

function getCurrentStreakDates(streakDates) {

    const currentDates = [];

    if (streakDates.length === 0) {
        return currentDates;
    }


    const today =
        getLocalDateOnly(
            new Date()
        );


    const latest =
        streakDates[
            streakDates.length - 1
        ];


    // Current streak exists only
    // when today's puzzle is completed.

    if (
        latest.getTime() !==
        today.getTime()
    ) {

        return currentDates;
    }


    currentDates.push(latest);


    for (
        let i = streakDates.length - 1;
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


        if (diffDays === 1) {

            currentDates.push(previous);

        } else {

            break;
        }
    }


    return currentDates;
}


// =====================================
// RENDER CALENDAR
// =====================================

function renderCalendar() {

    calendarGrid.innerHTML = "";


    // =================================
    // TITLE
    // =================================

    monthTitle.textContent =
        `${months[currentMonth]} ${currentYear}`;


    // =================================
    // CURRENT STREAK
    // =================================

    const streakDates =
        getStreakDates(allGames);


    const currentStreak =
        calculateCurrentStreak(
            streakDates
        );


    const currentStreakDates =
        getCurrentStreakDates(
            streakDates
        );


    console.log(
        "CALENDAR CURRENT STREAK:",
        currentStreak
    );


    console.log(
        "CALENDAR CURRENT STREAK DATES:",
        currentStreakDates
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
    // EMPTY DAYS
    // =================================

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


    // =================================
    // DAYS
    // =================================

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
        // RESULT
        //
        // Firestore result is already
        // present in allGames.
        // =================================

        const quiz =
            allGames[dateKey];


        if (
            quiz &&
            quiz.correct === true
        ) {

            cell.classList.add(
                "correct-day"
            );

        }

        else if (
            quiz &&
            quiz.correct === false
        ) {

            cell.classList.add(
                "wrong-day"
            );

        }


        // =================================
        // CURRENT STREAK FIRE
        //
        // ONLY CURRENT STREAK DATES
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

            cell.classList.add("today");
        }


        // =================================
        // DISABLED / LOCKED / PLAYABLE
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

            cell.onclick = function() {

                window.location.href =
                    `dailypuzzel.html?date=${dateKey}`;

            };
        }


        calendarGrid.appendChild(cell);
    }
}


// =====================================
// FIREBASE
//
// FIRESTORE HISTORY IS LOADED FIRST
// BEFORE CALENDAR IS RENDERED
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


            if (snap.exists()) {

                const data =
                    snap.data();

                history =
                    data.history || {};
            }


            // =================================
            // FIRESTORE + LOCAL BACKUP
            // =================================

            allGames =
                getAllGames(history);


            // =================================
            // DEBUG
            // =================================

            const streakDates =
                getStreakDates(
                    allGames
                );


            const currentStreak =
                calculateCurrentStreak(
                    streakDates
                );


            console.log(
                "CALENDAR FIRESTORE HISTORY:",
                history
            );


            console.log(
                "CALENDAR STREAK DATES:",
                streakDates
            );


            console.log(
                "CALENDAR CURRENT STREAK:",
                currentStreak
            );


            // =================================
            // RENDER AFTER FIRESTORE LOAD
            // =================================

            renderCalendar();

        }

        catch (error) {

            console.error(
                "CALENDAR FIRESTORE ERROR:",
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

prevBtn.onclick = function() {

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

nextBtn.onclick = function() {

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
// REFRESH WHEN PAGE BECOMES VISIBLE
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
