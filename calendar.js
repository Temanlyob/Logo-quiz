const monthTitle = document.getElementById("monthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const months = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];

let today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// =============================
// THEME SYSTEM
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

    }else if(theme === "dark"){

        document.body.classList.add(
            "theme-dark"
        );

    }else{

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

    }

}


// Load theme saved from Profile
applyTheme(
    localStorage.getItem("theme") || "default"
);


// Follow phone theme when Default is selected
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

// First available puzzle
const firstPuzzleDate = new Date(2026, 6, 28); // 27 July 2026

// =============================
// STREAK SYSTEM
// =============================

function getPlayedDates(){

    const dates = [];

    for(let key in localStorage){

        if(!key.startsWith("quiz_")) continue;

        const dateKey =
            key.replace("quiz_","");

        const parts =
            dateKey.split("-");

        if(parts.length !== 3) continue;

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

        date.setHours(0,0,0,0);

        if(!isNaN(date.getTime())){

            dates.push(date);

        }

    }

    // Remove duplicate dates

    const uniqueDates =
        dates.filter(
            (date,index,array) => {

                return index ===
                    array.findIndex(
                        other =>
                            other.getTime() ===
                            date.getTime()
                    );

            }
        );

    // Old → New

    uniqueDates.sort(
        (a,b) =>
            a.getTime() - b.getTime()
    );

    return uniqueDates;

}


// =============================
// DATE DIFFERENCE
// =============================

function dayDifference(date1,date2){

    return Math.round(
        (
            date2.getTime() -
            date1.getTime()
        ) /
        (1000 * 60 * 60 * 24)
    );

}


// =============================
// STREAK INFO
// =============================

function calculateStreak(){

    const dates =
        getPlayedDates();

    const streakCard =
        document.querySelector(
            ".streak-card"
        );

    const streakTitle =
        document.getElementById(
            "streakTitle"
        );

    const streakDates =
        document.getElementById(
            "streakDates"
        );

    const streakCount =
        document.getElementById(
            "streakCount"
        );

    const bestStreak =
        document.getElementById(
            "bestStreak"
        );


    if(!streakCard) return;


    // No games yet

    if(dates.length === 0){

        streakCard.classList.remove(
            "active",
            "ended"
        );

        streakTitle.textContent =
            "Current Streak";

        streakDates.textContent =
            "Play your first puzzle to start a streak.";

        streakCount.textContent =
            "0 Days";

        bestStreak.textContent =
            "Best: 0 Days";

        return;

    }


    // =============================
    // FIND ALL STREAKS
    // =============================

    const streaks = [];

    let streakStart =
        dates[0];

    let previous =
        dates[0];


    for(let i=1;i<dates.length;i++){

        const current =
            dates[i];

        const diff =
            dayDifference(
                previous,
                current
            );


        if(diff === 1){

            // Same streak

            previous =
                current;

        }else{

            // Streak ended

            streaks.push({
                start:streakStart,
                end:previous,
                days:
                    dayDifference(
                        streakStart,
                        previous
                    ) + 1
            });


            // New streak

            streakStart =
                current;

            previous =
                current;

        }

    }


    // Add final streak

    streaks.push({
        start:streakStart,
        end:previous,
        days:
            dayDifference(
                streakStart,
                previous
            ) + 1
    });


    // =============================
    // BEST STREAK
    // =============================

    let best =
        streaks[0];

    streaks.forEach(streak => {

        if(
            streak.days >
            best.days
        ){

            best =
                streak;

        }

    });


    // =============================
    // LATEST STREAK
    // =============================

    const latest =
        streaks[streaks.length - 1];


    // Today's date

    const todayDate =
        new Date();

    todayDate.setHours(
        0,0,0,0
    );


    const latestIsToday =
        latest.end.getTime() ===
        todayDate.getTime();


    // =============================
    // ACTIVE STREAK
    // =============================

    if(latestIsToday){

        streakCard.classList.add(
            "active"
        );

        streakCard.classList.remove(
            "ended"
        );

        streakTitle.textContent =
            "🔥 Current Streak";

        streakDates.textContent =
            formatDateRange(
                latest.start,
                latest.end
            );

        streakCount.textContent =
            latest.days + " Days";

    }

    // =============================
    // STREAK ENDED / AT RISK
    // =============================

    else{

        streakCard.classList.add(
            "ended"
        );

        streakCard.classList.remove(
            "active"
        );

        streakTitle.textContent =
            "🔥 Last Streak";

        streakDates.textContent =
            formatDateRange(
                latest.start,
                latest.end
            ) +
            " • Play today to start a new streak";

        streakCount.textContent =
            latest.days + " Days";

    }


    bestStreak.textContent =
        "Best: " +
        best.days +
        " Days";

}


// =============================
// FORMAT DATE RANGE
// =============================

function formatDateRange(
    start,
    end
){

    const options = {
        day:"numeric",
        month:"short"
    };


    const startText =
        start.toLocaleDateString(
            "en-IN",
            options
        );

    const endText =
        end.toLocaleDateString(
            "en-IN",
            options
        );


    if(
        start.getTime() ===
        end.getTime()
    ){

        return startText;

    }


    return (
        startText +
        " → " +
        endText
    );

}

function renderCalendar(){

calendarGrid.innerHTML="";

monthTitle.innerHTML =
months[currentMonth] + " " + currentYear;

const firstDay =
new Date(currentYear,currentMonth,1).getDay();

const daysInMonth =
new Date(currentYear,currentMonth+1,0).getDate();

for(let i=0;i<firstDay;i++){

const empty=document.createElement("div");

empty.className="day empty";

calendarGrid.appendChild(empty);

}

for(let day=1;day<=daysInMonth;day++){

const cell=document.createElement("div");

cell.className="day";

cell.innerHTML=day;

const thisDate =
new Date(currentYear,currentMonth,day);

const d = String(day).padStart(2,"0");
const m = String(currentMonth+1).padStart(2,"0");
const y = String(currentYear).slice(-2);

const dateKey = `${d}-${m}-${y}`;

const quiz =
JSON.parse(
localStorage.getItem("quiz_"+dateKey)
);

if(quiz){

if(quiz.correct){

cell.classList.add("correct-day");

}else{

cell.classList.add("wrong-day");

}

}    

if(
day===today.getDate() &&
currentMonth===today.getMonth() &&
currentYear===today.getFullYear() &&
!quiz
){

cell.classList.add("today");

}

if(thisDate < firstPuzzleDate){

cell.classList.add("disabled");

}else if(thisDate > today){

cell.classList.add("locked");

}else{

cell.onclick=function(){

window.location.href=
`dailypuzzel.html?date=${dateKey}`;

};

}

calendarGrid.appendChild(cell);

}

}

prevBtn.onclick=function(){

currentMonth--;

if(currentMonth<0){

currentMonth=11;

currentYear--;

}

renderCalendar();
calculateStreak();

};

nextBtn.onclick=function(){

currentMonth++;

if(currentMonth>11){

currentMonth=0;

currentYear++;

}

renderCalendar();

};

renderCalendar();
