const option1=document.getElementById("option1");
const option2=document.getElementById("option2");

option1.onclick=function(){

option1.classList.add("correct");

setTimeout(function(){

window.location.href="correct.html";

},800);

}

option2.onclick=function(){

option2.classList.add("wrong");

setTimeout(function(){

window.location.href="wrong.html";

},800);

}
