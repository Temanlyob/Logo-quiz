const monthTitle =
document.getElementById("monthTitle");

const calendarGrid =
document.getElementById("calendarGrid");

const prevBtn =
document.getElementById("prevMonth");

const nextBtn =
document.getElementById("nextMonth");


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


let today =
new Date();

today.setHours(0,0,0,0);


let currentMonth =
today.getMonth();

let currentYear =
today.getFullYear();


// =============================
// FIRST PUZZLE DATE
// =============================

const firstPuzzleDate =
new Date(
    2026,
    6,
    28
);

firstPuzzleDate.setHours(
    0,0,0,0
);


// =============================
// THEME
// =============================

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

        if(
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        ){

            document.body.classList.add(
                "theme-dark"
            );

        }

    }

}


applyTheme(
    localStorage.getItem("theme") ||
    "default"
);


const systemTheme =
window.matchMedia(
    "(prefers-color-scheme: dark)"
);


systemTheme.addEventListener(
    "change",
    () => {

        const currentTheme =
        localStorage.getItem("theme") ||
        "default";

        if(
            currentTheme === "default"
        ){

            applyTheme("default");

        }

    }
);


// =============================
// DATE KEY → DATE
// =============================

function parseDateKey(dateKey){

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
        0,0,0,0
    );


    return date;

}


// =============================
// GET ALL PLAYED DATES
// =============================

function getPlayedDates(){

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


            const dateKey =
            key.replace(
                "quiz_",
                ""
            );


            const date =
            parseDateKey(
                dateKey
            );


            if(date){

                dates.push({
                    key: dateKey,
                    date: date
                });

            }

        }

        catch(error){

            console.error(
                "CALENDAR QUIZ ERROR:",
                error
            );

        }

    }


    // Remove duplicate dates

    const uniqueDates = [];


    dates.forEach(
        item => {

            const exists =
            uniqueDates.some(
                existing =>
                    existing.date.getTime() ===
                    item.date.getTime()
            );


            if(!exists){

                uniqueDates.push(item);

            }

        }
    );


    // Old → New

    uniqueDates.sort(
        (a,b) =>
            a.date.getTime() -
            b.date.getTime()
    );


    return uniqueDates;

}


// =============================
// CURRENT STREAK DATES
// =============================

function getCurrentStreakDates(){

    const playedDates =
    getPlayedDates();


    const streakDates =
    new Set();


    if(
        playedDates.length === 0
    ){

        return streakDates;

    }


    // Latest played day

    let latest =
    playedDates[
        playedDates.length - 1
    ];


    streakDates.add(
        latest.key
    );


    // Go backwards

    for(
        let i =
        playedDates.length - 2;

        i >= 0;

        i--
    ){

        const current =
        playedDates[i];


        const diffDays =
        Math.round(
            (
                latest.date.getTime() -
                current.date.getTime()
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

            streakDates.add(
                current.key
            );


            latest =
            current;

        }

        else{

            break;

        }

    }


    return streakDates;

}


// =============================
// RENDER CALENDAR
// =============================

function renderCalendar(){

    calendarGrid.innerHTML =
    "";


    monthTitle.innerHTML =
    months[currentMonth] +
    " " +
    currentYear;


    // Current streak dates

    const currentStreakDates =
    getCurrentStreakDates();


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


    // Empty boxes

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


    // Days

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
            0,0,0,0
        );


        const d =
        String(day)
        .padStart(2,"0");


        const m =
        String(
            currentMonth + 1
        )
        .padStart(2,"0");


        const y =
        String(
            currentYear
        ).slice(-2);


        const dateKey =
        `${d}-${m}-${y}`;


        // =========================
        // QUIZ RESULT
        // =========================

        let quiz = null;


        try{

            quiz =
            JSON.parse(
                localStorage.getItem(
                    "quiz_" + dateKey
                )
            );

        }

        catch(error){

            quiz = null;

        }


        if(
            quiz &&
            quiz.attempted === true
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


        // =========================
        // CURRENT STREAK GLOW
        // =========================

        if(
            currentStreakDates.has(
                dateKey
            )
        ){

            cell.classList.add(
                "streak-day"
            );

        }


        // =========================
        // TODAY
        // =========================

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


        // =========================
        // DISABLED / LOCKED
        // =========================

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


        calendarGrid.appendChild(
            cell
        );

    }

}


// =============================
// PREVIOUS MONTH
// =============================

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


// =============================
// NEXT MONTH
// =============================

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


// =============================
// INITIAL
// =============================

renderCalendar();
