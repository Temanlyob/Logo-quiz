const option1 = document.getElementById("option1");
const option2 = document.getElementById("option2");

const resultSection = document.getElementById("resultSection");
const resultHeading = document.getElementById("resultHeading");
const resultMessage = document.getElementById("resultMessage");

const showResultsBtn = document.getElementById("showResultsBtn");

let answered = false;

// Correct Answer
option1.addEventListener("click", function () {

    if(answered) return;
    answered = true;

    option1.classList.add("correct");

    resultHeading.innerHTML = "✅ Correct!";
    resultHeading.style.color = "#20b44b";

    resultMessage.innerHTML = "You selected the real logo.";

    resultSection.style.display = "block";

    resultSection.scrollIntoView({
        behavior: "smooth"
    });

});

// Wrong Answer
option2.addEventListener("click", function () {

    if(answered) return;
    answered = true;

    option2.classList.add("wrong");
    option1.classList.add("correct");

    resultHeading.innerHTML = "❌ Wrong!";
    resultHeading.style.color = "#ef4444";

    resultMessage.innerHTML = "The correct answer was Option 1.";

    resultSection.style.display = "block";

    resultSection.scrollIntoView({
        behavior: "smooth"
    });

});

// Show Results button
showResultsBtn.addEventListener("click", function(){

    alert("Results page will be added next.");

});
