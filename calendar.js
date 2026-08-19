// =====================================
// CALENDAR.JS
// FINAL SAME-DAY STREAK LOGIC
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
// DATE HELPERS
// =====================================

function startOfDay(date) {

    const d =
        new Date(date);

    d.setHours(
        0,
        0,
        0,
        0
    );

    return d;

}


function addDays(
    date,
    amount
) {

    const d =
        new Date(date);

    d.setDate(
        d.getDate() + amount
    );

    return startOfDay(d);

}


function sameDate(
    a,
    b
) {

    return (

        a.getFullYear() ===
        b.getFullYear()

        &&

        a.getMonth() ===
        b.getMonth()

        &&

        a.getDate() ===
        b.getDate()

    );

}


// =====================================
// TODAY
// =====================================

let today =
    startOfDay(
        new Date()
    );


let currentMonth =
    today.getMonth();


let currentYear =
    today.getFullYear();


// =====================================
// FIRST PUZZLE DATE
// =====================================

const firstPuzzleDate =
    startOfDay(
        new Date(
            2026,
            6,
            28
        )
    );


// =====================================
// DATE KEY
// DD-MM-YY
// =====================================

function makeDateKey(
    date
) {

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const year =
        String(
            date.getFullYear()
        ).slice(
            -2
        );


    return (
        day +
        "-" +
        month +
        "-" +
        year
    );

}


// =====================================
// PARSE DD-MM-YY
// =====================================

function parseDateKey(
    key
) {

    const parts =
        key.split("-");


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


    return startOfDay(
        date
    );

}


// =====================================
// GET QUIZ DATA
// =====================================

function getQuizData(
    date
) {

    const key =
        "quiz_" +
        makeDateKey(
            date
        );


    try {

        const raw =
            localStorage.getItem(
                key
            );


        if (!raw) {

            return null;

        }


        return JSON.parse(
            raw
        );

    } catch (error) {

        console.error(
            "Quiz data error:",
            error
        );


        return null;

    }

}


// =====================================
// CHECK SAME-DAY VALID PLAY
//
// IMPORTANT:
//
// Puzzle date MUST equal
// actual playedAt date.
//
// Example:
//
// quiz_17-08-26
// playedAt = 21 Aug
//
// => INVALID FOR STREAK
//
// quiz_18-08-26
// playedAt = 18 Aug
//
// => VALID FOR STREAK
// =====================================

function wasPlayedOnItsOwnDate(
    puzzleDate
) {

    const quiz =
        getQuizData(
            puzzleDate
        );


    if (
        !quiz ||
        quiz.attempted !== true
    ) {

        return false;

    }


    // =====================================
    // playedAt MUST EXIST
    // =====================================

    if (
        !quiz.playedAt
    ) {

        return false;

    }


    const playedAt =
        new Date(
            quiz.playedAt
        );


    if (
        Number.isNaN(
            playedAt.getTime()
        )
    ) {

        return false;

    }


    const actualPlayDate =
        startOfDay(
            playedAt
        );


    // =====================================
    // SAME-DAY CHECK
    // =====================================

    return sameDate(
        puzzleDate,
        actualPlayDate
    );

}


// =====================================
// GET CURRENT STREAK DATES
//
// FINAL RULE:
//
// 1. If TODAY's puzzle was correctly
//    played on TODAY → start today.
//
// 2. If today's puzzle hasn't been
//    played today → start from YESTERDAY.
//
// 3. Every previous date must have
//    been played on ITS OWN DATE.
//
// 4. First invalid/missed date stops
//    the streak.
//
// 5. Playing an old puzzle late does
//    NOT repair the streak.
//
// =====================================

function getCurrentStreakDates() {

    const streakDates = [];


    const todayDate =
        startOfDay(
            new Date()
        );


    // =====================================
    // CHECK TODAY
    // =====================================

    const todayPlayed =
        wasPlayedOnItsOwnDate(
            todayDate
        );


    // =====================================
    // START DATE
    //
    // Today played:
    //     today
    //
    // Today not played:
    //     yesterday
    //
    // Today is NOT treated as a miss.
    // =====================================

    let checkDate;


    if (
        todayPlayed
    ) {

        checkDate =
            todayDate;

    } else {

        checkDate =
            addDays(
                todayDate,
                -1
            );

    }


    // =====================================
    // WALK BACKWARD
    // =====================================

    while (
        checkDate >=
        firstPuzzleDate
    ) {

        const valid =
            wasPlayedOnItsOwnDate(
                checkDate
            );


        // =================================
        // FIRST BREAK
        // =================================

        if (
            !valid
        ) {

            break;

        }


        // =================================
        // VALID STREAK DAY
        // =================================

        streakDates.push(
            new Date(
                checkDate
            )
        );


        // =================================
        // PREVIOUS DAY
        // =================================

        checkDate =
            addDays(
                checkDate,
                -1
            );

    }


    return streakDates;

}


// =====================================
// CURRENT STREAK NUMBER
// =====================================

function getCurrentStreak() {

    return getCurrentStreakDates().length;

}


// =====================================
// THEME
// =====================================

function applyTheme(
    theme
) {

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
// FIRE STYLE
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

    font-size: 22px;

    line-height: 1;

    z-index: 20;

    pointer-events: none;

}


.day.correct-day.current-streak-day {

    background: #22c55e !important;

    color: #ffffff !important;

}


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

    calendarGrid.innerHTML =
        "";


    // =====================================
    // REFRESH TODAY
    // =====================================

    today =
        startOfDay(
            new Date()
        );


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
    // CURRENT STREAK
    // =====================================

    const currentStreakDates =
        getCurrentStreakDates();


    const currentStreak =
        currentStreakDates.length;


    console.log(
        "CURRENT STREAK:",
        currentStreak
    );


    console.log(
        "CURRENT STREAK DATES:",

        currentStreakDates.map(
            date =>
                makeDateKey(
                    date
                )
        )

    );


    // =====================================
    // MONTH INFO
    // =====================================

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


    // =====================================
    // EMPTY CELLS
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
    // DAYS
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
        // DATE
        // =================================

        const thisDate =
            startOfDay(
                new Date(
                    currentYear,
                    currentMonth,
                    day
                )
            );


        // =================================
        // DATE KEY
        // =================================

        const dateKey =
            makeDateKey(
                thisDate
            );


        // =================================
        // QUIZ
        // =================================

        const quiz =
            getQuizData(
                thisDate
            );


        // =================================
        // RESULT COLOR
        //
        // Correct/wrong both are played.
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
        // FIRE
        //
        // Only if this exact puzzle was
        // played on its own date AND it
        // belongs to current streak.
        // =================================

        const isCurrentStreakDay =
            currentStreakDates.some(
                streakDate =>
                    sameDate(
                        streakDate,
                        thisDate
                    )
            );


        if (
            isCurrentStreakDay
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

            sameDate(
                thisDate,
                today
            )

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
// REFRESH WHEN RETURNING TO PAGE
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
