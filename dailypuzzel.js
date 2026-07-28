// ==========================
// TODAY'S DATE
// ==========================

const today = new Date();

const dd = String(today.getDate()).padStart(2, "0");
const mm = String(today.getMonth() + 1).padStart(2, "0");
const yy = String(today.getFullYear()).slice(-2);

const todayKey = `${dd}-${mm}-${yy}`;

// Image filenames
const rightImage = `images/${todayKey}right.png`;
const wrongImage = `images/${todayKey}wrong.png`;

// Image elements
const img1 = document.getElementById("img1");
const img2 = document.getElementById("img2");

// ==========================
// RANDOM POSITION
// (same for whole day)
// ==========================

let randomSide = localStorage.getItem("random_" + todayKey);

if (!randomSide) {

    randomSide = Math.random() < 0.5 ? "left" : "right";

    localStorage.setItem("random_" + todayKey, randomSide);

}

let correctOption;

if (randomSide === "left") {

    img1.src = rightImage;
    img2.src = wrongImage;

    correctOption = option1;

} else {

    img1.src = wrongImage;
    img2.src = rightImage;

    correctOption = option2;

}

const option1 = document.getElementById("option1");
const option2 = document.getElementById("option2");

const badge1 = document.getElementById("badge1");
const badge2 = document.getElementById("badge2");

const resultSection = document.getElementById("resultSection");
const resultCircle = document.getElementById("resultCircle");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");

const pointsCard = document.getElementById("pointsCard");

const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");

const showResultsBtn = document.getElementById("showResultsBtn");

let answered = false;

// ==========================
// CHECK ANSWER
// ==========================

function checkAnswer(selectedOption){

    if(answered) return;

    answered = true;

    const isCorrect = selectedOption === correctOption;

    const wrongOption =
        correctOption === option1 ? option2 : option1;

    // Correct option
    correctOption.classList.add("correct");

    if(correctOption === option1){

        badge1.style.display="flex";
        badge1.innerHTML="✓";

    }else{

        badge2.style.display="flex";
        badge2.innerHTML="✓";

    }

    if(isCorrect){

        resultCircle.innerHTML="✅";
        resultCircle.style.background="#e8fff0";
        resultCircle.style.color="#22c55e";

        resultTitle.innerHTML="Correct!";
        resultTitle.style.color="#22c55e";

        resultText.innerHTML="You selected the real logo.";

        pointsCard.innerHTML="+10 Points ⭐";

        infoTitle.innerHTML="Great Job!";
        infoText.innerHTML="You spotted the authentic logo.";

        localStorage.setItem("lastResult","correct");
        localStorage.setItem("lastScore","10");

    }else{

        wrongOption.classList.add("wrong");

        if(wrongOption===option1){

            badge1.style.display="flex";
            badge1.innerHTML="✕";

        }else{

            badge2.style.display="flex";
            badge2.innerHTML="✕";

        }

        resultCircle.innerHTML="❌";
        resultCircle.style.background="#ffecec";
        resultCircle.style.color="#ef4444";

        resultTitle.innerHTML="Incorrect!";
        resultTitle.style.color="#ef4444";

        resultText.innerHTML="That wasn't the authentic logo.";

        pointsCard.innerHTML="0 Points";

        infoTitle.innerHTML="Correct Answer";
        infoText.innerHTML="The highlighted logo was the original one.";

        localStorage.setItem("lastResult","wrong");
        localStorage.setItem("lastScore","0");

    }

    resultSection.style.display="block";

    resultSection.scrollIntoView({
        behavior:"smooth"
    });

}

// ----------------------------
// SHOW RESULTS
// ----------------------------

showResultsBtn.addEventListener("click",function(){

    window.location.href="results.html";

});
