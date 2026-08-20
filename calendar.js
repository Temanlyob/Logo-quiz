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
// THEME SYSTEM
// =====================================

function applyTheme(theme){

    document.body.classList.remove(
        "theme-light",
        "theme-dark"
    );


    if(theme === "light"){

        document.body.classList.add(
            "theme-light"
        );

    }

    else if(theme === "dark"){

        document.body.classList.add(
            "theme-dark"
        );

    }

    else{

        // DEFAULT = PHONE SYSTEM THEME

        if(
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        ){

            document.body.classList.add(
                "theme-dark"
            );

        }

        else{

            document.body.classList.add(
                "theme-light"
            );

        }

    }

}


// =====================================
// LOAD SAVED THEME
// =====================================

applyTheme(
    localStorage.getItem("theme") || "default"
);


// =====================================
// FOLLOW PHONE THEME
// =====================================

const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );


systemTheme.addEventListener(
    "change",
    () => {

        const currentTheme =
            localStorage.getItem("theme") || "default";


        if(currentTheme === "default"){

            applyTheme("default");

        }

    }
);


// =====================================
// INJECT STREAK CSS
// =====================================

const streakStyle =
document.createElement("style");

streakStyle.textContent = `

/* =================================
   CURRENT STREAK FIRE
================================= */

.day.current-streak-day{

    position:relative;

    background:#fff3cd !important;

    color:#d97706 !important;

    border:2px solid #f59e0b !important;

    box-shadow:
        0 0 8px rgba(245,158,11,.45),
        0 0 18px rgba(245,158,11,.35),
        0 0 30px rgba(245,158,11,.20);

    animation:
        streakFire 1.4s ease-in-out infinite;

}


/* Small fire */

.day.current-streak-day::after{

    content:"🔥";

    position:absolute;

    top:-13px;

    right:-7px;

    font-size:18px;

    line-height:1;

    filter:
        drop-shadow(
            0 0 4px rgba(245,158,11,.65)
        );

}


/* =================================
   CORRECT + STREAK
================================= */

.day.correct-day.current-streak-day{

    background:#22c55e !important;

    color:#ffffff !important;

    border-color:#16a34a !important;

    box-shadow:
        0 0 8px rgba(34,197,94,.60),
        0 0 18px rgba(34,197,94,.45),
        0 0 30px rgba(245,158,11,.35);

}


/* =================================
   WRONG + STREAK
================================= */

.day.wrong-day.current-streak-day{

    background:#ef4444 !important;

    color:#ffffff !important;

    border-color:#dc2626 !important;

    box-shadow:
        0 0 8px rgba(239,68,68,.60),
        0 0 18px rgba(239,68,68,.45),
        0 0 30px rgba(245,158,11,.35);

}


/* =================================
   FIRE ANIMATION
================================= */

@keyframes streakFire{

    0%{

        transform:scale(1);

    }

    50%{

        transform:scale(1.035);

    }

    100%{

        transform:scale(1);

    }

}


/* =================================
   DARK MODE
================================= */

body.theme-dark
.day.current-streak-day{

    background:#3a2d12 !important;

    color:#fbbf24 !important;

    border-color:#f59e0b !important;

    box-shadow:
        0 0 8px rgba(245,158,11,.55),
        0 0 18px rgba(245,158,11,.40),
        0 0 30px rgba(245,158,11,.25);

}


body.theme-dark
.day.correct-day.current-streak-day{

    background:#22c55e !important;

    color:#ffffff !important;

    border-color:#16a34a !important;

}


body.theme-dark
.day.wrong-day.current-streak-day{

    background:#ef4444 !important;

    color:#ffffff !important;

    border-color:#dc2626 !important;

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
){

    const d =
        String(day).padStart(2,"0");

    const m =
        String(month + 1).padStart(2,"0");

    const y =
        String(year).slice(-2);

    return `${d}-${m}-${y}`;

}


// =====================================
// PARSE DD-MM-YY
// =====================================

function parseDateKey(
    dateKey
){

    const parts =
        dateKey.split("-");


    if(parts.length !== 3){

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
        0,
        0,
        0,
        0
    );


    return date;

}


// =====================================
// GET ACTUAL PLAYED DATES
//
// IMPORTANT:
//
// Puzzle date ≠ actual played date.
//
// Example:
//
// quiz_17-08-26
// playedAt = 18-08-26
//
// Streak counts 18-08-26.
// It does NOT count 17-08-26.
// =====================================

function getActualPlayedDates(){

    const dates = [];


    for(
        let key in localStorage
    ){

        if(
            !key.startsWith("quiz_")
        ){

            continue;

        }


        try{

            const quiz =
                JSON.parse(
                    localStorage.getItem(key)
                );


            if(
                !quiz ||
                quiz.attempted !== true
            ){

                continue;

            }


            // --------------------------------
            // ACTUAL PLAY DATE
            // --------------------------------

            if(!quiz.playedAt){

                continue;

            }


            const playedAt =
                new Date(
                    quiz.playedAt
                );


            if(
                Number.isNaN(
                    playedAt.getTime()
                )
            ){

                continue;

            }


            playedAt.setHours(
                0,
                0,
                0,
                0
            );


            dates.push(
                playedAt
            );

        }

        catch(error){

            console.error(
                "CALENDAR QUIZ ERROR:",
                error
            );

        }

    }


    // --------------------------------
    // REMOVE DUPLICATES
    // --------------------------------

    const uniqueDates = [];


    for(
        const date of dates
    ){

        const exists =
            uniqueDates.some(
                existing =>
                    existing.getTime() ===
                    date.getTime()
            );


        if(!exists){

            uniqueDates.push(
                date
            );

        }

    }


    // --------------------------------
    // OLD → NEW
    // --------------------------------

    uniqueDates.sort(
        (a,b) =>
            a.getTime() -
            b.getTime()
    );


    return uniqueDates;

}


// =====================================
// CALCULATE CURRENT STREAK
//
// RULE:
//
// Today played = 1
//
// Yesterday + today = 2
//
// One missed day = BREAK
//
// Late completion of an old puzzle
// does NOT restore the old date.
// =====================================

function calculateCurrentStreak(
    playedDates
){

    if(
        playedDates.length === 0
    ){

        return 0;

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
        playedDates[
            playedDates.length - 1
        ];


    // --------------------------------
    // MUST HAVE PLAYED TODAY
    // --------------------------------

    if(
        latest.getTime() !==
        todayDate.getTime()
    ){

        return 0;

    }


    // Today = 1

    let streak = 1;


    // --------------------------------
    // GO BACKWARDS
    // --------------------------------

    for(
        let i =
            playedDates.length - 1;

        i > 0;

        i--
    ){

        const current =
            playedDates[i];

        const previous =
            playedDates[i - 1];


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


        // Consecutive date

        if(
            diffDays === 1
        ){

            streak++;

        }

        else{

            // A day was missed.
            // STOP HERE.

            break;

        }

    }


    return streak;

}


// =====================================
// GET CURRENT STREAK DATES
//
// Returns only the dates that belong
// to the CURRENT streak.
//
// These dates will receive 🔥 glow.
// =====================================

function getCurrentStreakDates(
    playedDates
){

    const streakDates = [];


    if(
        playedDates.length === 0
    ){

        return streakDates;

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
        playedDates[
            playedDates.length - 1
        ];


    // --------------------------------
    // If today wasn't played,
    // there is no current streak.
    // --------------------------------

    if(
        latest.getTime() !==
        todayDate.getTime()
    ){

        return streakDates;

    }


    // --------------------------------
    // Start from today
    // --------------------------------

    streakDates.push(
        latest
    );


    // --------------------------------
    // Go backwards
    // --------------------------------

    for(
        let i =
            playedDates.length - 1;

        i > 0;

        i--
    ){

        const current =
            playedDates[i];

        const previous =
            playedDates[i - 1];


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


        if(
            diffDays === 1
        ){

            streakDates.push(
                previous
            );

        }

        else{

            break;

        }

    }


    return streakDates;

}


// =====================================
// RENDER CALENDAR
// =====================================

function renderCalendar(){

    calendarGrid.innerHTML = "";


    // --------------------------------
    // MONTH TITLE
    // --------------------------------

    monthTitle.innerHTML =
        months[currentMonth] +
        " " +
        currentYear;


    // --------------------------------
    // ACTUAL PLAYED DATES
    // --------------------------------

    const playedDates =
        getActualPlayedDates();


    // --------------------------------
    // CURRENT STREAK DATES
    // --------------------------------

    const currentStreakDates =
        getCurrentStreakDates(
            playedDates
        );


    // --------------------------------
    // FIRST DAY OF MONTH
    // --------------------------------

    const firstDay =
        new Date(
            currentYear,
            currentMonth,
            1
        ).getDay();


    // --------------------------------
    // DAYS IN MONTH
    // --------------------------------

    const daysInMonth =
        new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();


    // --------------------------------
    // EMPTY BOXES
    // --------------------------------

    for(
        let i = 0;
        i < firstDay;
        i++
    ){

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

    for(
        let day = 1;
        day <= daysInMonth;
        day++
    ){

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


        // --------------------------------
        // PUZZLE RESULT
        // --------------------------------

        let quiz = null;


        try{

            const saved =
                localStorage.getItem(
                    "quiz_" + dateKey
                );


            if(saved){

                quiz =
                    JSON.parse(
                        saved
                    );

            }

        }

        catch(error){

            console.error(
                "QUIZ READ ERROR:",
                error
            );

        }


        // --------------------------------
        // CORRECT / WRONG
        // --------------------------------

        if(quiz){

            if(
                quiz.correct === true
            ){

                cell.classList.add(
                    "correct-day"
                );

            }

            else if(
                quiz.correct === false
            ){

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


        if(
            isCurrentStreakDate
        ){

            cell.classList.add(
                "current-streak-day"
            );

            cell.title =
                "🔥 Current Streak Day";

        }


        // --------------------------------
        // TODAY
        // --------------------------------

        if(
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear() &&
            !quiz
        ){

            cell.classList.add(
                "today"
            );

        }


        // =================================
        // DISABLED / LOCKED / PLAYABLE
        // =================================

        if(
            thisDate < firstPuzzleDate
        ){

            cell.classList.add(
                "disabled"
            );

        }

        else if(
            thisDate > today
        ){

            cell.classList.add(
                "locked"
            );

        }

        else{

            cell.onclick =
                function(){

                    window.location.href =
                        `dailypuzzel.html?date=${dateKey}`;

                };

        }


        // --------------------------------
        // ADD TO GRID
        // --------------------------------

        calendarGrid.appendChild(
            cell
        );

    }

}


// =====================================
// PREVIOUS MONTH
// =====================================

prevBtn.onclick =
    function(){

        currentMonth--;


        if(
            currentMonth < 0
        ){

            currentMonth = 11;

            currentYear--;

        }


        renderCalendar();

    };


// =====================================
// NEXT MONTH
// =====================================

nextBtn.onclick =
    function(){

        currentMonth++;


        if(
            currentMonth > 11
        ){

            currentMonth = 0;

            currentYear++;

        }


        renderCalendar();

    };


// =====================================
// INITIAL RENDER
// =====================================

renderCalendar();


// =====================================
// REFRESH WHEN PAGE BECOMES VISIBLE
// =====================================

document.addEventListener(
    "visibilitychange",
    () => {

        if(
            document.visibilityState ===
            "visible"
        ){

            renderCalendar();

        }

    }
);
