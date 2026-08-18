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

const levelProgressFill =
document.getElementById("levelProgressFill");

const levelProgressText =
document.getElementById("levelProgressText");

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

// =============================
// LEVEL SYSTEM
// =============================
// Har level ke liye required XP (totalScore) aur badge define kiya gaya hai.
// Level 6+ ke liye har 1000 XP par ek naya level milta rehta hai (endless growth).

const LEVELS = [
  { level: 1, title: "Rookie",     emoji: "⭐", min: 0 },
  { level: 2, title: "Explorer",   emoji: "🥈", min: 100 },
  { level: 3, title: "Achiever",   emoji: "🥇", min: 250 },
  { level: 4, title: "Expert",     emoji: "💎", min: 500 },
  { level: 5, title: "Master",     emoji: "👑", min: 1000 },
  { level: 6, title: "Champion",   emoji: "🏆", min: 2000 },
  { level: 7, title: "Legend",     emoji: "🔥", min: 3500 },
  { level: 8, title: "Mythic",     emoji: "🌟", min: 5000 }
];

function getLevelInfo(totalScore){

  let current = LEVELS[0];
  let next = LEVELS[1] || null;

  for(let i = 0; i < LEVELS.length; i++){

    if(totalScore >= LEVELS[i].min){

      current = LEVELS[i];
      next = LEVELS[i + 1] || null;

    }

  }

  // Level 8 ke baad (max defined level), har 2000 XP par endless level badhta hai
  if(!next && totalScore >= LEVELS[LEVELS.length - 1].min){

    const base = LEVELS[LEVELS.length - 1];
    const extraLevels = Math.floor((totalScore - base.min) / 2000);

    current = {
      level: base.level + extraLevels,
      title: base.title,
      emoji: base.emoji,
      min: base.min + (extraLevels * 2000)
    };

    next = {
      min: current.min + 2000
    };

  }

  const rangeStart = current.min;
  const rangeEnd = next ? next.min : rangeStart + 100;
  const rangeSize = rangeEnd - rangeStart;
  const progressInRange = Math.min(
    Math.max(totalScore - rangeStart, 0),
    rangeSize
  );

  const progressPercent = rangeSize === 0
    ? 100
    : Math.round((progressInRange / rangeSize) * 100);

  return {
    level: current.level,
    title: current.title,
    emoji: current.emoji,
    text: `${current.emoji} Level ${current.level}`,
    currentXP: totalScore,
    rangeStart,
    rangeEnd,
    progressInRange,
    rangeSize,
    progressPercent
  };

}

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

const levelInfo = getLevelInfo(totalScore);

level.textContent = levelInfo.text;

if(levelProgressFill){

  levelProgressFill.style.width =
    levelInfo.progressPercent + "%";

}

if(levelProgressText){

  levelProgressText.textContent =
    levelInfo.progressInRange + " / " + levelInfo.rangeSize + " XP to Level " + (levelInfo.level + 1);

}

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
        username.textContent.trim();

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

        if(!file) return;

        const reader =
            new FileReader();

        reader.onload = (e) => {

            selectedPhotoURL =
                e.target.result;

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

        if(!currentUser){

            alert("You must be logged in to update your profile.");
            return;

        }

        const newUsername =
            editUsername.value.trim();

        if(!newUsername){

            alert("Please enter username.");

            return;

        }

        try{

            saveProfileBtn.disabled = true;

            saveProfileBtn.textContent =
                "Saving...";

            let finalPhotoURL = selectedPhotoURL;

            // Agar user ne nayi photo choose ki hai (base64 data URL),
            // to usse Firebase Storage par upload karke asli download URL lete hain
            // taaki Firestore mein pura base64 string na save ho.
            const isDataURL =
                typeof selectedPhotoURL === "string" &&
                selectedPhotoURL.startsWith("data:");

            if(isDataURL){

                const fileRef = ref(
                    storage,
                    `profilePhotos/${currentUser.uid}.jpg`
                );

                const res = await fetch(selectedPhotoURL);
                const blob = await res.blob();

                await uploadBytes(fileRef, blob);

                finalPhotoURL = await getDownloadURL(fileRef);

            }

            await updateDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {
                    username: newUsername,
                    photoURL: finalPhotoURL
                }
            );

            username.textContent =
                newUsername;

            avatar.src =
                finalPhotoURL;

            editPhotoPreview.src =
                finalPhotoURL;

            selectedPhotoURL =
                finalPhotoURL;

            editProfileModal.style.display =
                "none";

            alert("Profile updated successfully!");

        }catch(error){

            console.error(
                "PROFILE UPDATE ERROR:",
                error
            );

            alert(
                "Failed to update profile. Please try again."
            );

        }finally{

            saveProfileBtn.disabled =
                false;

            saveProfileBtn.textContent =
                "Save Changes";

        }

    }
);
