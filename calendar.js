// =====================================
// PUZZLE CALENDAR
// FINAL STREAK LOGIC
// =====================================


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
// MONTH NAMES
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

function getToday() {

    const date =
        new Date();

    date.setHours(
        0,
        0,
        0,
        0
    );

    return date;

}


let today =
    getToday();


let currentMonth =
    today.getMonth();


let currentYear =
    today.getFullYear();


// =====================================
// FIRST PUZZLE
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
    localStorage.getItem(
        "theme"
    ) || "default"
);


// =====================================
// FIRE CSS
// =====================================

const streakStyle =
    document.createElement(
        "style"
    );


streakStyle.textContent = `

.day.current-streak-day {

    position: relative;

    z-index: 5;

    border: 3px solid #ff8a3d !important;

    box-shadow:

        0 0 8px
        rgba(255,140,50,.75),

        0 0 18px
        rgba(255,100,40,.55),

        0 0 30px
        rgba(255,70,30,.30);

}


.day.current-streak-day::after {

    content: "🔥";

    position: absolute;

    top: -20px;

    right: -7px;

    font-size: 23px;

    line-height: 1;

    z-index: 20;

    pointer-events: none;

    filter:
        drop-shadow(
            0 0 5px
            rgba(255,120,20,.75)
        );

}


/* Keep solved GREEN */

.day.correct-day.current-streak-day {

    background: #22c55e !important;

    color: #ffffff !important;

}


/* Keep wrong RED */

.day.wrong-day.current-streak-day {

    background: #ef4444 !important;

    color: #ffffff !important;

}


@keyframes streakGlow {

    0% {

        box-shadow:
            0 0 5px
            rgba(255,130,40,.45);

    }

    50% {

        box-shadow:
            0 0 20px
            rgba(255,100,30,.80);

    }

    100% {

        box-shadow:
            0 0 5px
            rgba(255,130,40,.45);

    }

}

`;


document.head.appendChild(
    streakStyle
);


// =====================================
// DATE KEY
//
// Example:
// 19-08-26
// =====================================

function makeDateKey(
    year,
    month,
    day
) {

    const dd =
        String(day)
            .padStart(
                2,
                "0"
            );


    const mm =
        String(month + 1)
            .padStart(
                2,
                "0"
            );


    const yy =
        String(year)
            .slice(-2);


    return (
        dd +
        "-" +
        mm +
        "-" +
        yy
    );

}


// =====================================
// PARSE DATE KEY
//
// 19-08-26
// → Date object
// =====================================

function parseDateKey(
    dateKey
) {

    if (
        !dateKey
    ) {

        return null;

    }


    const parts =
        dateKey.split(
            "-"
        );


    if (
        parts.length !== 3
    ) {

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


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;

}


// =====================================
// DATE DIFFERENCE
// =====================================

function differenceInDays(
    firstDate,
    secondDate
) {

    const oneDay =
        24 *
        60 *
        60 *
        1000;


    return Math.round(

        (
            secondDate.getTime() -
            firstDate.getTime()
        )

        /

        oneDay

    );

}


// =====================================
// GET ALL PLAYED PUZZLE DATES
//
// IMPORTANT:
//
// We DO NOT use playedAt.
//
// The puzzle key itself is the
// official puzzle date.
//
// quiz_19-08-26
//
// means:
// 19 August 2026 was played.
//
// This is the same date shown
// on the calendar.
// =====================================

function getPlayedPuzzleDates() {

    const dates = [];


    for (
        let i = 0;

        i < localStorage.length;

        i++
    ) {

        const key =
            localStorage.key(
                i
            );


        if (
            !key ||
            !key.startsWith(
                "quiz_"
            )
        ) {

            continue;

        }


        try {

            const raw =
                localStorage.getItem(
                    key
                );


            const quiz =
                JSON.parse(
                    raw
                );


            // =================================
            // PLAYED MEANS ATTEMPTED
            //
            // Correct OR wrong both count.
            // =================================

            if (
                !quiz ||
                quiz.attempted !== true
            ) {

                continue;

            }


            // =================================
            // GET PUZZLE DATE FROM KEY
            // =================================

            const dateKey =
                key.substring(
                    5
                );


            const date =
                parseDateKey(
                    dateKey
                );


            if (
                !date
            ) {

                continue;

            }


            dates.push(
                date
            );


        }

        catch(error) {

            console.error(
                "Calendar quiz error:",
                error
            );

        }

    }


    // =====================================
    // REMOVE DUPLICATES
    // =====================================

    const uniqueDates = [];


    dates.forEach(
        date => {

            const exists =
                uniqueDates.some(
                    existing =>

                        existing.getTime() ===
                        date.getTime()

                );


            if (
                !exists
            ) {

                uniqueDates.push(
                    date
                );

            }

        }
    );


    // =====================================
    // SORT OLD → NEW
    // =====================================

    uniqueDates.sort(
        (
            a,
            b
        ) =>

            a.getTime() -
            b.getTime()

    );


    return uniqueDates;

}


// =====================================
// GET CURRENT STREAK DATES
//
// THIS IS THE IMPORTANT PART.
//
// Rule:
//
// If latest played = TODAY
// → streak ends today.
//
// If latest played = YESTERDAY
// → streak ends yesterday.
//
// If latest played is older
// → streak = 0.
//
// Then walk backwards one day
// at a time.
//
// Correct/wrong doesn't matter.
// =====================================

function getCurrentStreakDates(
    playedDates
) {

    const result = [];


    if (
        playedDates.length === 0
    ) {

        return result;

    }


    const today =
        getToday();


    const yesterday =
        new Date(
            today
        );


    yesterday.setDate(
        yesterday.getDate() - 1
    );


    // =====================================
    // FIND LATEST PLAYED DATE
    // =====================================

    const latest =
        playedDates[
            playedDates.length - 1
        ];


    // =====================================
    // IMPORTANT
    //
    // Latest must be TODAY or YESTERDAY.
    //
    // Otherwise streak is expired.
    // =====================================

    if (

        latest.getTime() !==
            today.getTime()

        &&

        latest.getTime() !==
            yesterday.getTime()

    ) {

        return result;

    }


    // =====================================
    // LATEST DATE IS FIRST STREAK DAY
    // =====================================

    result.push(
        latest
    );


    // =====================================
    // WALK BACKWARDS
    // =====================================

    for (

        let i =
            playedDates.length - 1;

        i > 0;

        i--

    ) {

        const current =
            playedDates[
                i
            ];


        const previous =
            playedDates[
                i - 1
            ];


        const difference =
            differenceInDays(
                previous,
                current
            );


        // =================================
        // EXACTLY ONE DAY BEFORE
        // =================================

        if (
            difference === 1
        ) {

            result.push(
                previous
            );

        }

        else {

            // Streak broken
            break;

        }

    }


    return result;

}


// =====================================
// CURRENT STREAK NUMBER
// =====================================

function calculateCurrentStreak(
    playedDates
) {

    const streakDates =
        getCurrentStreakDates(
            playedDates
        );


    return streakDates.length;

}


// =====================================
// RENDER CALENDAR
// =====================================

function renderCalendar() {

    calendarGrid.innerHTML =
        "";


    // =====================================
    // REFRESH TODAY
    // =====================================

    today =
        getToday();


    // =====================================
    // TITLE
    // =====================================

    monthTitle.textContent =

        months[
            currentMonth
        ]

        +

        " "

        +

        currentYear;


    // =====================================
    // ALL PLAYED DATES
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
    // CURRENT STREAK
    // =====================================

    const currentStreak =
        calculateCurrentStreak(
            playedDates
        );


    console.log(
        "CALENDAR CURRENT STREAK:",
        currentStreak
    );


    console.log(
        "CALENDAR STREAK DATES:",
        currentStreakDates.map(
            date =>
                makeDateKey(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                )
        )
    );


    // =====================================
    // FIRST DAY
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
    // EMPTY DAYS
    // =====================================

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


    // =====================================
    // EACH DAY
    // =====================================

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
        // QUIZ DATA
        // =================================

        let quiz = null;


        try {

            const saved =
                localStorage.getItem(

                    "quiz_" +
                    dateKey

                );


            if (
                saved
            ) {

                quiz =
                    JSON.parse(
                        saved
                    );

            }

        }

        catch(error) {

            console.error(
                "Calendar result error:",
                error
            );

        }


        // =================================
        // PLAYED RESULT
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
        //
        // This checks DATE only.
        //
        // Therefore every consecutive
        // streak day gets 🔥.
        // =================================

        const isStreakDay =
            currentStreakDates.some(

                streakDate =>

                    streakDate.getTime() ===
                    thisDate.getTime()

            );


        if (
            isStreakDay
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
            today.getTime()

            &&

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

            cell.addEventListener(
                "click",
                () => {

                    window.location.href =

                        "dailypuzzel.html?date=" +
                        dateKey;

                }
            );

        }


        // =================================
        // ADD TO CALENDAR
        // =================================

        calendarGrid.appendChild(
            cell
        );

    }

}


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

            currentMonth =
                11;


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

            currentMonth =
                0;


            currentYear++;

        }


        renderCalendar();

    }
);


// =====================================
// REFRESH WHEN RETURNING
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


// =====================================
// INITIAL RENDER
// =====================================

renderCalendar();
