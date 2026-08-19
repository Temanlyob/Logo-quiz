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

let today =
    new Date();

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
    new Date(
        2026,
        6,
        28
    );

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


    if(
        theme === "light"
    ){

        document.body.classList.add(
            "theme-light"
        );

    }

    else if(
        theme === "dark"
    ){

        document.body.classList.add(
            "theme-dark"
        );

    }

    else{

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

    localStorage.getItem(
        "theme"
    ) || "default"

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
            localStorage.getItem(
                "theme"
            ) || "default";


        if(
            currentTheme ===
            "default"
        ){

            applyTheme(
                "default"
            );

        }

    }
);


// =====================================
// STREAK CSS
// =====================================

const streakStyle =
    document.createElement(
        "style"
    );


streakStyle.textContent = `

/* =================================
   CURRENT STREAK
================================= */

.day.current-streak-day{

    position:relative;

    z-index:2;

    border-color:#ff8a3d !important;

    box-shadow:

        0 0 8px
        rgba(255,140,50,.70),

        0 0 18px
        rgba(255,90,50,.55),

        0 0 30px
        rgba(255,70,40,.30);

    animation:
        streakFire 1.4s
        ease-in-out infinite;

}


/* =================================
   FIRE
================================= */

.day.current-streak-day::after{

    content:"🔥";

    position:absolute;

    top:-14px;

    right:-7px;

    font-size:20px;

    line-height:1;

    z-index:10;

    filter:
        drop-shadow(
            0 0 5px
            rgba(255,120,30,.75)
        );

}


/* =================================
   CORRECT + STREAK
   Keep GREEN
================================= */

.day.correct-day.current-streak-day{

    background:#22c55e !important;

    color:#ffffff !important;

    border-color:#ff8a3d !important;

}


/* =================================
   WRONG + STREAK
   Keep RED
================================= */

.day.wrong-day.current-streak-day{

    background:#ef4444 !important;

    color:#ffffff !important;

    border-color:#ff8a3d !important;

}


/* =================================
   FIRE ANIMATION
================================= */

@keyframes streakFire{

    0%{

        transform:
            scale(1);

    }

    50%{

        transform:
            scale(1.035);

    }

    100%{

        transform:
            scale(1);

    }

}


/* =================================
   DARK MODE
================================= */

body.theme-dark
.day.current-streak-day{

    border-color:#ff9f43 !important;

    box-shadow:

        0 0 10px
        rgba(255,140,50,.85),

        0 0 22px
        rgba(255,80,40,.60),

        0 0 35px
        rgba(255,60,30,.40);

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
){

    const d =
        String(
            day
        ).padStart(
            2,
            "0"
        );


    const m =
        String(
            month + 1
        ).padStart(
            2,
            "0"
        );


    const y =
        String(
            year
        ).slice(
            -2
        );


    return `${d}-${m}-${y}`;

}


// =====================================
// PARSE DD-MM-YY
// =====================================

function parseDateKey(
    dateKey
){

    const parts =
        dateKey.split(
            "-"
        );


    if(
        parts.length !== 3
    ){

        return null;

    }


    const day =
        Number(
            parts[0]
        );


    const month =
        Number(
            parts[1]
        ) - 1;


    const year =
        Number(
            "20" +
            parts[2]
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
// GET PLAYED PUZZLE DATES
//
// IMPORTANT:
//
// We use the PUZZLE DATE:
//
// quiz_16-08-26
//
// NOT playedAt.
//
// This makes the calendar and streak
// use the same daily puzzle dates.
// =====================================

function getPlayedPuzzleDates(){

    const dates = [];


    for(
        let i = 0;

        i < localStorage.length;

        i++
    ){

        const key =
            localStorage.key(
                i
            );


        if(
            !key ||
            !key.startsWith(
                "quiz_"
            )
        ){

            continue;

        }


        try{

            const raw =
                localStorage.getItem(
                    key
                );


            const quiz =
                JSON.parse(
                    raw
                );


            if(
                !quiz ||
                quiz.attempted !== true
            ){

                continue;

            }


            // =================================
            // PUZZLE DATE
            // =================================

            const dateKey =
                key.replace(
                    "quiz_",
                    ""
                );


            const puzzleDate =
                parseDateKey(
                    dateKey
                );


            if(
                !puzzleDate
            ){

                continue;

            }


            dates.push(
                puzzleDate
            );


        }

        catch(error){

            console.error(
                "CALENDAR QUIZ ERROR:",
                error
            );

        }

    }


    // =====================================
    // REMOVE DUPLICATES
    // =====================================

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


        if(
            !exists
        ){

            uniqueDates.push(
                date
            );

        }

    }


    // =====================================
    // OLD → NEW
    // =====================================

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
// Today played:
//     today counts.
//
// Today NOT played,
// Yesterday played:
//     yesterday's old streak stays.
//
// Today not played until midnight:
//     old streak remains.
//
// After midnight without yesterday/today
// continuation:
//     streak becomes 0.
//
// Example:
//
// 16,17,18 played
// 19 NOT played yet
//
// Current streak = 3
//
// 19 played
//
// Current streak = 4
// =====================================

function calculateCurrentStreak(
    playedDates
){

    if(
        playedDates.length === 0
    ){

        return 0;

    }


    // =====================================
    // TODAY
    // =====================================

    const todayDate =
        new Date();


    todayDate.setHours(
        0,
        0,
        0,
        0
    );


    // =====================================
    // YESTERDAY
    // =====================================

    const yesterdayDate =
        new Date(
            todayDate
        );


    yesterdayDate.setDate(
        yesterdayDate.getDate() - 1
    );


    // =====================================
    // LATEST PLAYED PUZZLE DATE
    // =====================================

    const latest =
        playedDates[
            playedDates.length - 1
        ];


    const latestTime =
        latest.getTime();


    const todayTime =
        todayDate.getTime();


    const yesterdayTime =
        yesterdayDate.getTime();


    // =====================================
    // LATEST MUST BE TODAY OR YESTERDAY
    // =====================================

    if(

        latestTime !==
            todayTime

        &&

        latestTime !==
            yesterdayTime

    ){

        return 0;

    }


    // =====================================
    // START WITH LATEST DAY
    // =====================================

    let streak = 1;


    // =====================================
    // GO BACKWARD
    // =====================================

    for(

        let i =
            playedDates.length - 1;

        i > 0;

        i--

    ){

        const current =
            playedDates[
                i
            ];


        const previous =
            playedDates[
                i - 1
            ];


        const diffDays =
            Math.round(

                (

                    current.getTime() -

                    previous.getTime()

                )

                /

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

            streak++;

        }

        else{

            break;

        }

    }


    return streak;

}


// =====================================
// GET CURRENT STREAK DATES
//
// These are exactly the dates which
// receive 🔥.
//
// If latest = TODAY:
//
//     today + previous consecutive days
//
// If latest = YESTERDAY:
//
//     yesterday + previous consecutive days
//
// If latest is older:
//
//     no current streak.
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


    // =====================================
    // TODAY
    // =====================================

    const todayDate =
        new Date();


    todayDate.setHours(
        0,
        0,
        0,
        0
    );


    // =====================================
    // YESTERDAY
    // =====================================

    const yesterdayDate =
        new Date(
            todayDate
        );


    yesterdayDate.setDate(
        yesterdayDate.getDate() - 1
    );


    // =====================================
    // LATEST
    // =====================================

    const latest =
        playedDates[
            playedDates.length - 1
        ];


    const latestTime =
        latest.getTime();


    // =====================================
    // STREAK EXPIRED
    // =====================================

    if(

        latestTime !==
            todayDate.getTime()

        &&

        latestTime !==
            yesterdayDate.getTime()

    ){

        return streakDates;

    }


    // =====================================
    // ADD LATEST
    // =====================================

    streakDates.push(
        latest
    );


    // =====================================
    // GO BACK
    // =====================================

    for(

        let i =
            playedDates.length - 1;

        i > 0;

        i--

    ){

        const current =
            playedDates[
                i
            ];


        const previous =
            playedDates[
                i - 1
            ];


        const diffDays =
            Math.round(

                (

                    current.getTime() -

                    previous.getTime()

                )

                /

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

    calendarGrid.innerHTML =
        "";


    // =====================================
    // MONTH TITLE
    // =====================================

    monthTitle.innerHTML =

        months[
            currentMonth
        ]

        +

        " "

        +

        currentYear;


    // =====================================
    // PLAYED PUZZLE DATES
    // =====================================

    const playedDates =
        getPlayedPuzzleDates();


    // =====================================
    // CURRENT STREAK DATES
    // =====================================

    const currentStreakDates =
        getCurrentStreakDates(
            playedDates
        );


    // =====================================
    // FIRST DAY OF MONTH
    // =====================================

    const firstDay =
        new Date(
            currentYear,
            currentMonth,
            1
        ).getDay();


    // =====================================
    // DAYS IN MONTH
    // =====================================

    const daysInMonth =
        new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();


    // =====================================
    // EMPTY BOXES
    // =====================================

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


    // =====================================
    // EACH DAY
    // =====================================

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


        // =================================
        // THIS DATE
        // =================================

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


        // =================================
        // DATE KEY
        // =================================

        const dateKey =
            makeDateKey(

                currentYear,

                currentMonth,

                day

            );


        // =================================
        // PUZZLE RESULT
        // =================================

        let quiz = null;


        try{

            const saved =
                localStorage.getItem(

                    "quiz_" +
                    dateKey

                );


            if(
                saved
            ){

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


        // =================================
        // CORRECT / WRONG
        // =================================

        if(
            quiz
        ){

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


        // =================================
        // TODAY
        // =================================

        if(

            day ===
            today.getDate()

            &&

            currentMonth ===
            today.getMonth()

            &&

            currentYear ===
            today.getFullYear()

            &&

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
            thisDate <
            firstPuzzleDate
        ){

            cell.classList.add(
                "disabled"
            );

        }

        else if(
            thisDate >
            today
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


        // =================================
        // ADD CELL
        // =================================

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

            currentMonth =
                11;

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

            currentMonth =
                0;

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

            // Refresh today's date too
            today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );


            renderCalendar();

        }

    }

);
