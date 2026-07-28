// Cards

const option1 = document.getElementById("option1");
const option2 = document.getElementById("option2");

// Correct option

option1.addEventListener("click", function () {

    option1.classList.add("correct");

    option2.style.pointerEvents = "none";

    setTimeout(function () {

        alert("✅ Correct!");

        // Baad me yahan Show Results page kholenge
        // window.location.href="results.html";

    },600);

});


// Wrong option

option2.addEventListener("click", function () {

    option2.classList.add("wrong");

    option1.classList.add("correct");

    option1.style.pointerEvents = "none";

    option2.style.pointerEvents = "none";

    setTimeout(function () {

        alert("❌ Wrong!");

        // Baad me yahan Show Results page kholenge

    },600);

});
