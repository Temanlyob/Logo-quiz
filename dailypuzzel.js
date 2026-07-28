const option1 = document.getElementById("option1");
const option2 = document.getElementById("option2");

const resultBox = document.getElementById("resultBox");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");

option1.onclick = function(){

option1.classList.add("correct");

resultBox.style.display="block";

resultTitle.innerHTML="✅ Correct!";

resultText.innerHTML="You selected the real logo.";

}

option2.onclick=function(){

option2.classList.add("wrong");

resultBox.style.display="block";

resultTitle.innerHTML="❌ Wrong!";

resultTitle.style.color="#ef4444";

resultText.innerHTML="You selected the wrong logo.";

}
