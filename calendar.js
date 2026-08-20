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

let today = new Date();

today.setHours(
    0,
    0,
    0,
    0
);

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

firstPuzzleDate.setHours(
    0,
    0,
    0,
    0
);


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


applyTheme(
    localStorage.getItem("theme") || "default"
);


// =====================================
// FOLLOW SYSTEM THEME
// =====================================

const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );


systemTheme.addEventListener(
    "change",
    () => {

        const savedTheme =
            localStorage.getItem("theme") || "default";


        if (
            savedTheme === "default"
        ) {

            applyTheme("default");

        }

    }
);


// =====================================
// CURRENT STREAK FIRE CSS
// =====================================

const streakStyle =
    document.createElement("style");


streakStyle.textContent = `

.day.current-streak-day {

    position: relative;

    z-index: 2;

    border-color: #ff9f43 !important;

    box-shadow:
        0 0 8px rgba(255,140,50,.70),
        0 0 18px rgba(255,90,50,.55),
        0 0 30px rgba(255,70,40,.30);

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

    filter:
        drop-shadow(
            0 0 4px rgba(245,158,11,.65)
        );

}


.day.correct-day.current-streak-day {

    background: #22c55e !important;

    color: #ffffff !important;

    border-color: #16a34a !important;

}


.day.wrong-day.current-streak-day {

    background: #ef4444 !important;

    color: #ffffff !important;

    border-color: #dc2626 !important;

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

    border-color: #f59e0b !important;

    box-shadow:
        0 0 8px rgba(245,158,11,.55),
        0 0 18px rgba(245,158,11,.40),
        0 0 30px rgba(245,158,11,.25);

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
// PARSE DD-MM-YY
// SAME AS RESULTS.JS
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
// LOCAL DATE ONLY
// =====================================

function getLocalDateOnly(date) {

    const result =
        new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


// =====================================
// ACTUAL PLAY DATE
//
// Supports:
// - Firestore Timestamp
// - JS Date
// - Timestamp-like object
// - Date string
// =====================================

function getActualPlayDate(item) {

    if (
        !item ||
        !item.playedAt
    ) {

        return null;

    }


    let playedAt;


    // Firestore Timestamp

    if (
        typeof item.playedAt.toDate ===
        "function"
    ) {

        playedAt =
            item.playedAt.toDate();

    }


    // JavaScript Date

    else if (
        item.playedAt instanceof Date
    ) {

        playedAt =
            item.playedAt;

    }


    // Firestore timestamp-like object

    else if (
        typeof item.playedAt === "object" &&
        typeof item.playedAt.seconds === "number"
    ) {

        playedAt =
            new Date(
                item.playedAt.seconds * 1000
            );

    }


    // String / number

    else {

        playedAt =
            new Date(
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


    return getLocalDateOnly(
        playedAt
    );
}


// =====================================
// GET ALL GAMES
//
// FIRESTORE HISTORY FIRST
//
// LOCAL STORAGE ONLY FILLS
// MISSING PUZZLES
// =====================================

function getAllGames(
    firestoreHistory
) {

    const games = {};


    // =================================
    // FIRESTORE HISTORY
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


            // Firestore data always wins.

            if (
                !games[dateKey]
            ) {

                games[dateKey] = {
                    ...localQuiz
                };

            }

        }

        catch (error) {

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
// EXACT SAME RULE AS RESULTS.JS
//
// A date counts ONLY when:
//
// puzzle date === actual play date
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


        // =================================
        // IMPORTANT
        //
        // OLD PUZZLE PLAYED LATER
        // DOES NOT COUNT FOR THAT OLD DATE
        // =================================

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


    // =================================
    // OLD → NEW
    // =================================

    uniqueDates.sort(
        (a, b) =>
            a.getTime() -
            b.getTime()
    );


    return uniqueDates;
}


// =====================================
// CURRENT STREAK
//
// SAME AS RESULTS.JS
// =====================================

function calculateCurrentStreak(
    streakDates
) {

    if (
        streakDates.length === 0
    ) {

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


    // Today's puzzle must
    // have been completed today.

    if (
        latest.getTime() !==
        today.getTime()
    ) {

        return 0;

    }


    let streak = 1;


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

            streak++;

        }

        else {

            break;

        }

    }


    return streak;
}


// =====================================
// GET CURRENT STREAK DATES
//
// ONLY THESE DATES GET 🔥
// =====================================

function getCurrentStreakDates(
    streakDates
) {

    const currentDates = [];


    if (
        streakDates.length === 0
    ) {

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


    // No current streak if
    // today's puzzle is not completed.

    if (
        latest.getTime() !==
        today.getTime()
    ) {

        return currentDates;

    }


    // Today belongs to current streak.

    currentDates.push(
        latest
    );


    // Go backwards through
    // consecutive dates.

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

            currentDates.push(
                previous
            );

        }

        else {

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
    // MONTH TITLE
    // =================================

    monthTitle.textContent =
        `${months[currentMonth]} ${currentYear}`;


    // =================================
    // CURRENT STREAK DATA
    // =================================

    const streakDates =
        getStreakDates(
            allGames
        );


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
    // MONTH INFORMATION
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
    // EMPTY BOXES
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
            document.createElement("div");


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
        // GAME RESULT
        //
        // FIRESTORE FIRST
        // =================================

        const quiz =
            allGames[dateKey];


        // =================================
        // CORRECT
        // =================================

        if (
            quiz &&
            quiz.correct === true
        ) {

            cell.classList.add(
                "correct-day"
            );

        }


        // =================================
        // WRONG
        // =================================

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

            cell.classList.add(
                "today"
            );

        }


        // =================================
        // DATE STATE
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
            // FIRESTORE HISTORY
            // + LOCAL BACKUP
            // =================================

            allGames =
                getAllGames(
                    history
                );


            // =================================
            // VERIFY STREAK
            // =================================

            const streakDates =
                getStreakDates(
                    allGames
                );


            const currentStreak =
                calculateCurrentStreak(
                    streakDates
                );


            const currentStreakDates =
                getCurrentStreakDates(
                    streakDates
                );


            console.log(
                "================================"
            );

            console.log(
                "FIRESTORE HISTORY:",
                history
            );

            console.log(
                "STREAK ELIGIBLE DATES:",
                streakDates
            );

            console.log(
                "CURRENT STREAK:",
                currentStreak
            );

            console.log(
                "CURRENT STREAK DATES:",
                currentStreakDates
            );

            console.log(
                "================================"
            );


            // =================================
            // IMPORTANT:
            // RENDER AFTER FIRESTORE LOAD
            // =================================

            renderCalendar();

        }

        catch (error) {

            console.error(
                "CALENDAR FIRESTORE ERROR:",
                error
            );


            // =================================
            // FALLBACK
            // =================================

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
