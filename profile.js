import {
  auth,
  db,
  storage
} from "./firebase.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
doc,
getDoc,
updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
// =============================

// Elements
// =============================

const avatar =
document.getElementById("profilePhoto");

const username =
document.getElementById("username");

const email =
document.getElementById("profileEmail");

const score =
document.getElementById("score");

const streak =
document.getElementById("streak");

const accuracy =
document.getElementById("accuracy");

const played =
document.getElementById("played");

const level =
document.querySelector(".level");

const logoutBtn =
document.querySelector(".logout-btn");

const achievementSection =
document.querySelector(".achievement-section");

// =============================
// EDIT PROFILE ELEMENTS
// =============================

const editProfileBtn =
document.getElementById("editProfileBtn");

const editProfileModal =
document.getElementById("editProfileModal");

const editUsername =
document.getElementById("editUsername");

const editPhotoPreview =
document.getElementById("editPhotoPreview");

const profilePhotoInput =
document.getElementById("profilePhotoInput");

const saveProfileBtn =
document.getElementById("saveProfileBtn");

const cancelProfileBtn =
document.getElementById("cancelProfileBtn");

let selectedPhotoURL = null;
let currentUser = null;
let selectedPhotoFile = null;

// =============================
// Firebase
// =============================

onAuthStateChanged(auth, async(user)=>{

if(!user){

window.location.replace("login.html");
return;

}

currentUser = user;

const snap =
await getDoc(
doc(db,"users",user.uid)
);

if(!snap.exists()){

username.textContent="User";
email.textContent="";
return;

}

const data =
snap.data();
username.textContent =
data.username ||
user.displayName ||
"User";

email.textContent =
data.email ||
user.email ||
"";

avatar.src =
data.photoURL ||
user.photoURL ||
"default-avatar.png";

// Current profile data for Edit Profile
selectedPhotoURL =
data.photoURL ||
user.photoURL ||
"default-avatar.png";

editUsername.value =
data.username ||
user.displayName ||
"User";

editPhotoPreview.src =
selectedPhotoURL;
  
function getCalendarStats() {

  let played = 0;
  let won = 0;

  for (let key in localStorage) {

    if (key.startsWith("quiz_")) {

      const quiz = JSON.parse(localStorage.getItem(key));

      if (quiz) {

        played++;

        if (quiz.correct) {

          won++;

        }

      }

    }

  }

  return {
    played,
    won,
    lost: played - won
  };

}

const totalScore =
data.totalScore ?? 0;

const currentStreak =
data.currentStreak ?? 0;

const stats = getCalendarStats();

const puzzlesPlayed = stats.played;

const gamesWon = stats.won;

const gamesLost = stats.lost;
  
const winRate =
puzzlesPlayed === 0
? 0
: Math.round(
(gamesWon / puzzlesPlayed) * 100
);

score.textContent =
totalScore;

streak.textContent =
currentStreak;

accuracy.textContent =
winRate + "%";

played.textContent =
puzzlesPlayed;

// =============================
// SAVE PROFILE PROGRESS
// Home page will use these exact values
// =============================

localStorage.setItem(
  "profileProgress",
  JSON.stringify({
    score: totalScore,
    streak: currentStreak,
    accuracy: winRate
  })
);

// =============================
// Level
// =============================

let levelText = "⭐ Level 1";

if(totalScore >= 1000){

levelText = "👑 Level 5";

}else if(totalScore >= 500){

levelText = "💎 Level 4";

}else if(totalScore >= 250){

levelText = "🥇 Level 3";

}else if(totalScore >= 100){

levelText = "🥈 Level 2";

}

level.textContent = levelText;

// =============================
// Achievements
// =============================

let html = "";

if(puzzlesPlayed >= 1){

html += `
<div class="achievement-item">
<span>🥇</span>
<div>
<h3>Logo Rookie</h3>
<p>Completed your first puzzle.</p>
</div>
</div>`;

}

if(currentStreak >= 7){

html += `
<div class="achievement-item">
<span>🔥</span>
<div>
<h3>7 Day Streak</h3>
<p>Solved puzzles for 7 consecutive days.</p>
</div>
</div>`;

}

if(totalScore >= 100){

html += `
<div class="achievement-item">
<span>⭐</span>
<div>
<h3>100 Points Club</h3>
<p>Earned 100+ points.</p>
</div>
</div>`;

}

if(puzzlesPlayed >= 30){

html += `
<div class="achievement-item">
<span>🎮</span>
<div>
<h3>Puzzle Master</h3>
<p>Played 30 puzzles.</p>
</div>
</div>`;

}

if(winRate === 100 && puzzlesPlayed >= 10){

html += `
<div class="achievement-item">
<span>🎯</span>
<div>
<h3>Accuracy Master</h3>
<p>100% accuracy in 10 puzzles.</p>
</div>
</div>`;

}

if(html === ""){

html = `
<div class="achievement-item">
<span>🔒</span>
<div>
<h3>No Achievements Yet</h3>
<p>Keep playing to unlock achievements.</p>
</div>
</div>`;

}

achievementSection.innerHTML =
"<h2>Achievements</h2>" + html;

// =============================
// Logout
// =============================

logoutBtn.onclick = async () => {

await signOut(auth);

window.location.replace("login.html");

};

});           

// =============================
// Theme Popup
// =============================

const themesBtn = document.getElementById("themesBtn");
const themeModal = document.getElementById("themeModal");
const closeTheme = document.getElementById("closeTheme");
const themeOptions = document.querySelectorAll(".theme-option");

themesBtn.addEventListener("click", (e) => {

    e.preventDefault();

    themeModal.style.display = "flex";

});

closeTheme.addEventListener("click", () => {

    themeModal.style.display = "none";

});

themeModal.addEventListener("click", (e) => {

    if (e.target === themeModal) {

        themeModal.style.display = "none";

    }

});

function updateThemeSelection() {

    const currentTheme =
        localStorage.getItem("theme") || "default";

    themeOptions.forEach(option => {

        option.classList.remove("active");

        option.querySelector(".tick").textContent = "";

        if(option.dataset.theme === currentTheme){

            option.classList.add("active");
            option.querySelector(".tick").textContent = "✓";

        }

    });

}

function applyTheme(theme){

document.body.classList.remove(
"theme-light",
"theme-dark"
);

if(theme==="light"){

document.body.classList.add("theme-light");

}else if(theme==="dark"){

document.body.classList.add("theme-dark");

}else{

if(window.matchMedia("(prefers-color-scheme: dark)").matches){

document.body.classList.add("theme-dark");

}

}

}

themeOptions.forEach(option => {

    option.addEventListener("click", () => {

        const selectedTheme = option.dataset.theme;

        localStorage.setItem(
            "theme",
            selectedTheme
        );

      applyTheme(selectedTheme);

      updateThemeSelection();

    });

});

updateThemeSelection();
applyTheme(
localStorage.getItem("theme") || "default"
);

window.matchMedia("(prefers-color-scheme: dark)")
.addEventListener("change",()=>{

const theme =
localStorage.getItem("theme") || "default";

if(theme==="default"){

applyTheme("default");

}

});
// =============================
// EDIT PROFILE
// =============================

editProfileBtn.addEventListener("click", () => {

    editUsername.value =
        username.textContent;

    editPhotoPreview.src =
        avatar.src;

    selectedPhotoURL =
        avatar.src;

    editProfileModal.style.display =
        "flex";

});


// =============================
// CHANGE PHOTO PREVIEW
// =============================

profilePhotoInput.addEventListener(
  "change",
  () => {

    const file =
      profilePhotoInput.files[0];

    if (!file) return;

    selectedPhotoFile = file;

    const reader =
      new FileReader();

    reader.onload = (e) => {

      editPhotoPreview.src =
        e.target.result;

    };

    reader.readAsDataURL(file);

  }
);


// =============================
// CANCEL
// =============================

cancelProfileBtn.addEventListener(
    "click",
    () => {

        editProfileModal.style.display =
            "none";

    }
);


// =============================
// CLOSE OUTSIDE
// =============================

editProfileModal.addEventListener(
    "click",
    (e) => {

        if(e.target === editProfileModal){

            editProfileModal.style.display =
                "none";

        }

    }
);


// =============================
// SAVE PROFILE
// =============================

saveProfileBtn.addEventListener(
  "click",
  async () => {

    if (!currentUser) return;

    const newUsername =
      editUsername.value.trim();

    if (!newUsername) {

      alert("Please enter username.");

      return;

    }

    try {

      saveProfileBtn.disabled = true;

      saveProfileBtn.textContent =
        "Saving...";


      let finalPhotoURL =
        selectedPhotoURL;


      // =================================
      // UPLOAD NEW PROFILE PHOTO
      // =================================

      if (selectedPhotoFile) {

        const photoRef =
          ref(
            storage,
            `profilePhotos/${currentUser.uid}/${Date.now()}_${selectedPhotoFile.name}`
          );


        const uploadResult =
          await uploadBytes(
            photoRef,
            selectedPhotoFile
          );


        finalPhotoURL =
          await getDownloadURL(
            uploadResult.ref
          );

      }


      // =================================
      // SAVE FIRESTORE
      // =================================

      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        {
          username:
            newUsername,

          photoURL:
            finalPhotoURL
        }
      );


      // =================================
      // UPDATE UI
      // =================================

      username.textContent =
        newUsername;

      avatar.src =
        finalPhotoURL;

      editPhotoPreview.src =
        finalPhotoURL;

      selectedPhotoURL =
        finalPhotoURL;

      selectedPhotoFile =
        null;


      editProfileModal.style.display =
        "none";


      alert(
        "Profile updated successfully!"
      );


    } catch (error) {

      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      alert(
        "Failed to update profile: " +
        error.message
      );

    } finally {

      saveProfileBtn.disabled =
        false;

      saveProfileBtn.textContent =
        "Save Changes";

    }

  }
);

          username.textContent =
    newUsername;

avatar.src =
    selectedPhotoURL;

editPhotoPreview.src =
    selectedPhotoURL;

            username.textContent =
                newUsername;

            avatar.src =
                selectedPhotoURL;

            editProfileModal.style.display =
                "none";

            alert("Profile updated successfully!");

        }catch(error){

            console.error(
                "PROFILE UPDATE ERROR:",
                error
            );

            alert(
                "Failed to update profile."
            );

        }finally{

            saveProfileBtn.disabled =
                false;

            saveProfileBtn.textContent =
                "Save Changes";

        }

    }
);
