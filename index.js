import { auth } from "./auth.js";

import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

onAuthStateChanged(auth,(user)=>{

if(user){

window.location.replace("home.html");

}else{

window.location.replace("login.html");

}

});
