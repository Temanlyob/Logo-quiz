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

// ----------------------------
// CORRECT ANSWER
// ----------------------------

option1.addEventListener("click", function(){

    if(answered) return;
    answered = true;

    option1.classList.add("correct");

    badge1.style.display="flex";
    badge1.innerHTML="✓";

    resultCircle.innerHTML="✅";

    resultCircle.style.background="#e8fff0";
    resultCircle.style.color="#22c55e";

    resultTitle.innerHTML="Correct!";
    resultTitle.style.color="#22c55e";

    resultText.innerHTML="You selected the real logo.";

    pointsCard.innerHTML="+10 Points ⭐";

    infoTitle.innerHTML="Great Job!";
    infoText.innerHTML="You spotted the authentic logo.";

    resultSection.style.display="block";

    resultSection.scrollIntoView({
        behavior:"smooth"
    });

});

// ----------------------------
// WRONG ANSWER
// ----------------------------

option2.addEventListener("click", function(){

    if(answered) return;
    answered = true;

    option2.classList.add("wrong");
    option1.classList.add("correct");

    badge2.style.display="flex";
    badge2.innerHTML="✕";

    badge1.style.display="flex";
    badge1.innerHTML="✓";

    resultCircle.innerHTML="❌";

    resultCircle.style.background="#ffecec";
    resultCircle.style.color="#ef4444";

    resultTitle.innerHTML="Incorrect!";
    resultTitle.style.color="#ef4444";

    resultText.innerHTML="That wasn't the authentic logo.";

    pointsCard.innerHTML="0 Points";

    infoTitle.innerHTML="Correct Answer";
    infoText.innerHTML="The left logo was the original one.";

    resultSection.style.display="block";

    resultSection.scrollIntoView({
        behavior:"smooth"
    });

});

// ----------------------------
// SHOW RESULTS
// ----------------------------

showResultsBtn.addEventListener("click",function(){

    window.location.href="results.html";

});
