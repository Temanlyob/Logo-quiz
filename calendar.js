// =====================================
// CALENDAR.JS
// FINAL CURRENT-STREAK LOGIC
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

    const d = new Date(date);

    d.setHours(
        0,
        0,
        0,
        0
    );

    return d;

}


function addDays(date, amount) {

    const d =
        new Date(date);

    d.setDate(
        d.getDate() + amount
    );

    return startOfDay(d);

}


function sameDate(a, b) {

    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
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
//
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
// PARSE DATE KEY
//
// DD-MM-YY
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
        0 0 8px rgba(255,140,50,.75),
        0 0 18px rgba(255,100,40,.55),
        0 0 30px rgba(255,70,30,.30);

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
// GET PLAYED PUZZLE DATES
//
// Only quiz_ date is used.
// playedAt is NOT used.
//
// attempted === true means played.
// Correct and wrong both count.
// =====================================

function getPlayedPuzzleDates() {

    const playedMap =
        new Map();


    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);


        if (
            !key ||
            !key.startsWith("quiz_")
        ) {

            continue;

        }


        try {

            const raw =
                localStorage.getItem(
                    key
                );


            const quiz =
                JSON.parse(raw);


            if (
                !quiz ||
                quiz.attempted !== true
            ) {

                continue;

            }


            const dateKey =
                key.substring(5);


            const date =
                parseDateKey(
                    dateKey
                );


            if (!date) {

                continue;

            }


            playedMap.set(
                dateKey,
                date
            );


        } catch (error) {

            console.error(
                "Quiz data error:",
                error
            );

        }

    }


    return Array.from(
        playedMap.values()
    ).sort(
        (a, b) =>
            a.getTime() -
            b.getTime()
    );

}


// =====================================
// IS PUZZLE PLAYED?
// =====================================

function isPuzzlePlayed(
    date
) {

    const key =
        "quiz_" +
        makeDateKey(date);


    try {

        const raw =
            localStorage.getItem(
                key
            );


        if (!raw) {

            return false;

        }


        const quiz =
            JSON.parse(raw);


        return (
            quiz &&
            quiz.attempted === true
        );

    } catch (error) {

        return false;

    }

}


// =====================================
// FINAL CURRENT-STREAK LOGIC
//
// VERY IMPORTANT:
//
// 1. Check TODAY.
// 2. If today is played,
//    start from today.
//
// 3. If today is NOT played,
//    today is ignored because
//    today has not ended yet.
//    Start from YESTERDAY.
//
// 4. Go backward one day at a time.
//
// 5. Stop at the FIRST unplayed day.
//
// 6. Every played date after that
//    is current streak.
//
// Example:
//
// 23 played
// 22 played
// 21 played
// 20 played
// 19 played
// 18 played
// 17 NOT played
// 16 played
//
// Result:
// 18,19,20,21,22,23 = 🔥
//
// =====================================

function getCurrentStreakDates() {

    const streakDates = [];


    const todayDate =
        startOfDay(
            new Date()
        );


    // =====================================
    // TODAY
    // =====================================

    const todayPlayed =
        isPuzzlePlayed(
            todayDate
        );


    // =====================================
    // START DATE
    //
    // If today played:
    //     start = today
    //
    // If today not played:
    //     start = yesterday
    // =====================================

    let checkDate;


    if (
        todayPlayed
    ) {

        checkDate =
            todayDate;

    }

    else {

        checkDate =
            addDays(
                todayDate,
                -1
            );

    }


    // =====================================
    // GO BACKWARD
    // =====================================

    while (
        checkDate >=
        firstPuzzleDate
    ) {

        const played =
            isPuzzlePlayed(
                checkDate
            );


        // =================================
        // FIRST MISSED DAY
        //
        // STOP HERE.
        // Do NOT include older days.
        // =================================

        if (
            !played
        ) {

            break;

        }


        // =================================
        // PLAYED DAY
        //
        // ADD FIRE
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

function getCurrentStreakCount() {

    return getCurrentStreakDates().length;

}


// =====================================
// RENDER CALENDAR
// =====================================

function renderCalendar() {

    calendarGrid.innerHTML =
        "";


    // Refresh today
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
        "FIRE DATES:",
        currentStreakDates.map(
            date =>
                makeDateKey(date)
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
        // KEY
        // =================================

        const dateKey =
            makeDateKey(
                thisDate
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

        } catch (error) {

            console.error(
                "Quiz read error:",
                error
            );

        }


        // =================================
        // RESULT COLOR
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
        // Exact date match.
        // =================================

        const isStreakDay =
            currentStreakDates.some(
                streakDate =>
                    sameDate(
                        streakDate,
                        thisDate
                    )
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
            sameDate(
                thisDate,
                today
            ) &&
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
        // OPEN PUZZLE
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
// INITIAL
// =====================================

renderCalendar();
