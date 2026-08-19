import { auth, db, storage } from "./firebase.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

const avatar = document.getElementById("profilePhoto");
const username = document.getElementById("username");
const email = document.getElementById("profileEmail");

const score = document.getElementById("score");
const streak = document.getElementById("streak");
const accuracy = document.getElementById("accuracy");
const played = document.getElementById("played");

const level = document.getElementById("level");

const logoutBtn = document.getElementById("logoutBtn");

const achievementList =
  document.getElementById("achievementList");


// =====================================================
// EDIT PROFILE ELEMENTS
// =====================================================

const editProfileBtn =
  document.getElementById("editProfileBtn");

const editProfileModal =
  document.getElementById("editProfileModal");

const closeEditProfile =
  document.getElementById("closeEditProfile");

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


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let currentPhotoURL =
  "default-avatar.png";

let selectedPhotoFile = null;


// =====================================================
// NUMBER HELPER
// =====================================================

function numberValue(...values) {

  for (const value of values) {

    const number = Number(value);

    if (Number.isFinite(number)) {

      return number;

    }

  }

  return 0;

}


// =====================================================
// LOCAL STORAGE QUIZ DATA
// =====================================================

function getLocalQuizStats() {

  let playedCount = 0;

  let wonCount = 0;

  let scoreTotal = 0;


  for (
    let i = 0;
    i < localStorage.length;
    i++
  ) {

    const key =
      localStorage.key(i);


    if (
      !key ||
      !key.startsWith("quiz_")
    ) {

      continue;

    }


    try {

      const raw =
        localStorage.getItem(key);

      const quiz =
        JSON.parse(raw);


      if (
        !quiz ||
        typeof quiz !== "object"
      ) {

        continue;

      }


      playedCount++;


      // Correct answer detection

      if (

        quiz.correct === true ||

        quiz.isCorrect === true ||

        quiz.result === "correct" ||

        quiz.result === "won"

      ) {

        wonCount++;

      }


      // Score detection

      scoreTotal += numberValue(

        quiz.score,

        quiz.points,

        quiz.earnedPoints,

        quiz.reward

      );


    } catch (error) {

      console.warn(
        "Invalid quiz history:",
        key
      );

    }

  }


  return {

    played: playedCount,

    won: wonCount,

    score: scoreTotal

  };

}


// =====================================================
// GET ALL PROFILE STATS
// =====================================================

function getStats(data) {

  const local =
    getLocalQuizStats();


  // ---------------------------------------------------
  // SCORE
  // ---------------------------------------------------

  const totalScore =
    numberValue(

      data.totalScore,

      data.score,

      data.points,

      data.totalPoints,

      local.score

    );


  // ---------------------------------------------------
  // PLAYED
  // ---------------------------------------------------

  const puzzlesPlayed =
    numberValue(

      data.puzzlesPlayed,

      data.played,

      data.gamesPlayed,

      data.totalPlayed,

      data.totalGames,

      local.played

    );


  // ---------------------------------------------------
  // WON
  // ---------------------------------------------------

  const gamesWon =
    numberValue(

      data.gamesWon,

      data.won,

      data.correctAnswers,

      data.correct,

      data.totalWon,

      local.won

    );


  // ---------------------------------------------------
  // STREAK
  // ---------------------------------------------------

  const currentStreak =
    numberValue(

      data.currentStreak,

      data.streak,

      data.currentStreakCount

    );


  // ---------------------------------------------------
  // ACCURACY
  // ---------------------------------------------------

  let winRate = 0;


  if (puzzlesPlayed > 0) {

    winRate =
      Math.round(
        (gamesWon / puzzlesPlayed) * 100
      );

  } else {

    winRate =
      numberValue(

        data.accuracy,

        data.winRate

      );

  }


  // Prevent impossible values

  winRate =
    Math.min(
      100,
      Math.max(0, winRate)
    );


  return {

    totalScore,

    puzzlesPlayed,

    gamesWon,

    currentStreak,

    winRate

  };

}


// =====================================================
// LEVEL
// =====================================================

function renderLevel(totalScore) {

  if (totalScore >= 1000) {

    return "👑 Level 5";

  }


  if (totalScore >= 500) {

    return "💎 Level 4";

  }


  if (totalScore >= 250) {

    return "🥇 Level 3";

  }


  if (totalScore >= 100) {

    return "🥈 Level 2";

  }


  return "⭐ Level 1";

}


// =====================================================
// ACHIEVEMENTS
// =====================================================

function renderAchievements(stats) {

  const achievements = [];


  // First puzzle

  if (stats.puzzlesPlayed >= 1) {

    achievements.push({

      icon: "🥇",

      title: "Logo Rookie",

      description:
        "Completed your first puzzle."

    });

  }


  // 7 day streak

  if (stats.currentStreak >= 7) {

    achievements.push({

      icon: "🔥",

      title: "7 Day Streak",

      description:
        "Solved puzzles for 7 consecutive days."

    });

  }


  // 100 points

  if (stats.totalScore >= 100) {

    achievements.push({

      icon: "⭐",

      title: "100 Points Club",

      description:
        "Earned 100+ points."

    });

  }


  // 30 puzzles

  if (stats.puzzlesPlayed >= 30) {

    achievements.push({

      icon: "🎮",

      title: "Puzzle Master",

      description:
        "Played 30 puzzles."

    });

  }


  // Accuracy master

  if (

    stats.puzzlesPlayed >= 10 &&

    stats.winRate === 100

  ) {

    achievements.push({

      icon: "🎯",

      title: "Accuracy Master",

      description:
        "100% accuracy in 10 puzzles."

    });

  }


  // ---------------------------------------------------
  // DISPLAY
  // ---------------------------------------------------

  if (achievements.length === 0) {

    achievementList.innerHTML = `

      <div class="achievement-item">

        <span>🔒</span>

        <div>

          <h3>No Achievements Yet</h3>

          <p>
            Keep playing to unlock achievements.
          </p>

        </div>

      </div>

    `;

    return;

  }


  achievementList.innerHTML =
    achievements.map(
      achievement => `

        <div class="achievement-item">

          <span>
            ${achievement.icon}
          </span>

          <div>

            <h3>
              ${achievement.title}
            </h3>

            <p>
              ${achievement.description}
            </p>

          </div>

        </div>

      `
    ).join("");

}


// =====================================================
// RENDER STATS
// =====================================================

function renderStats(data) {

  const stats =
    getStats(data);


  // Score

  score.textContent =
    stats.totalScore;


  // Streak

  streak.textContent =
    stats.currentStreak;


  // Accuracy

  accuracy.textContent =
    stats.winRate + "%";


  // Played

  played.textContent =
    stats.puzzlesPlayed;


  // Level

  level.textContent =
    renderLevel(
      stats.totalScore
    );


  // Achievements

  renderAchievements(stats);


  // Save profile progress locally

  localStorage.setItem(

    "profileProgress",

    JSON.stringify({

      score:
        stats.totalScore,

      streak:
        stats.currentStreak,

      accuracy:
        stats.winRate,

      played:
        stats.puzzlesPlayed

    })

  );

}


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile(user) {

  const userRef =
    doc(
      db,
      "users",
      user.uid
    );


  const snapshot =
    await getDoc(userRef);


  let data = {};


  if (snapshot.exists()) {

    data =
      snapshot.data();

  }


  // ---------------------------------------------------
  // USERNAME
  // ---------------------------------------------------

  username.textContent =

    data.username ||

    user.displayName ||

    "User";


  // ---------------------------------------------------
  // EMAIL
  // ---------------------------------------------------

  email.textContent =

    data.email ||

    user.email ||

    "";


  // ---------------------------------------------------
  // PHOTO
  // ---------------------------------------------------

  currentPhotoURL =

    data.photoURL ||

    user.photoURL ||

    "default-avatar.png";


  avatar.src =
    currentPhotoURL;


  // Edit modal values

  editUsername.value =
    username.textContent;


  editPhotoPreview.src =
    currentPhotoURL;


  // ---------------------------------------------------
  // STATS
  // ---------------------------------------------------

  renderStats(data);

}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.replace(
        "login.html"
      );

      return;

    }


    currentUser =
      user;


    try {

      await loadProfile(user);

    } catch (error) {

      console.error(
        "PROFILE LOAD ERROR:",
        error
      );


      // At least show Firebase Auth data

      username.textContent =
        user.displayName ||
        "User";


      email.textContent =
        user.email ||
        "";


      renderStats({});

    }

  }
);


// =====================================================
// OPEN EDIT PROFILE
// =====================================================

editProfileBtn.addEventListener(
  "click",
  () => {

    editUsername.value =
      username.textContent;


    editPhotoPreview.src =
      currentPhotoURL;


    selectedPhotoFile =
      null;


    profilePhotoInput.value =
      "";


    editProfileModal.style.display =
      "flex";


    editProfileModal.setAttribute(
      "aria-hidden",
      "false"
    );

  }
);


// =====================================================
// CLOSE EDIT PROFILE
// =====================================================

function closeEditModal() {

  editProfileModal.style.display =
    "none";


  editProfileModal.setAttribute(
    "aria-hidden",
    "true"
  );


  selectedPhotoFile =
    null;


  profilePhotoInput.value =
    "";

}


cancelProfileBtn.addEventListener(
  "click",
  closeEditModal
);


closeEditProfile.addEventListener(
  "click",
  closeEditModal
);


// Click outside modal

editProfileModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      editProfileModal
    ) {

      closeEditModal();

    }

  }
);


// =====================================================
// SELECT PROFILE PHOTO
// =====================================================

profilePhotoInput.addEventListener(
  "change",
  () => {

    const file =
      profilePhotoInput.files?.[0];


    if (!file) {

      return;

    }


    // Image check

    if (
      !file.type.startsWith("image/")
    ) {

      alert(
        "Please select an image."
      );

      profilePhotoInput.value =
        "";

      return;

    }


    // 5 MB limit

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      alert(
        "Please choose an image smaller than 5 MB."
      );

      profilePhotoInput.value =
        "";

      return;

    }


    selectedPhotoFile =
      file;


    // Instant preview

    const reader =
      new FileReader();


    reader.onload =
      (event) => {

        editPhotoPreview.src =
          event.target.result;

      };


    reader.readAsDataURL(file);

  }
);


// =====================================================
// SAVE PROFILE
// =====================================================

saveProfileBtn.addEventListener(
  "click",
  async () => {

    if (!currentUser) {

      return;

    }


    const newUsername =
      editUsername.value.trim();


    // Username validation

    if (!newUsername) {

      alert(
        "Please enter username."
      );

      return;

    }


    try {

      // Disable button

      saveProfileBtn.disabled =
        true;


      saveProfileBtn.textContent =
        "Saving...";


      // -----------------------------------------------
      // PHOTO URL
      // -----------------------------------------------

      let newPhotoURL =
        currentPhotoURL;


      // -----------------------------------------------
      // UPLOAD PHOTO
      // -----------------------------------------------

      if (selectedPhotoFile) {

        const extension =

          selectedPhotoFile.name
            .split(".")
            .pop()
            ?.toLowerCase() ||

          "jpg";


        const photoReference =

          ref(

            storage,

            `profilePhotos/${currentUser.uid}/profile.${extension}`

          );


        await uploadBytes(

          photoReference,

          selectedPhotoFile,

          {

            contentType:
              selectedPhotoFile.type,

            cacheControl:
              "public,max-age=3600"

          }

        );


        newPhotoURL =
          await getDownloadURL(
            photoReference
          );

      }


      // -----------------------------------------------
      // FIRESTORE
      // -----------------------------------------------

      const userReference =
        doc(
          db,
          "users",
          currentUser.uid
        );


      await setDoc(

        userReference,

        {

          uid:
            currentUser.uid,

          username:
            newUsername,

          email:
            currentUser.email ||
            email.textContent ||
            "",

          photoURL:
            newPhotoURL

        },

        {

          merge: true

        }

      );


      // -----------------------------------------------
      // FIREBASE AUTH PROFILE
      // -----------------------------------------------

      await updateProfile(

        currentUser,

        {

          displayName:
            newUsername,

          photoURL:
            newPhotoURL

        }

      );


      // -----------------------------------------------
      // UPDATE SCREEN INSTANTLY
      // -----------------------------------------------

      username.textContent =
        newUsername;


      avatar.src =
        newPhotoURL;


      editPhotoPreview.src =
        newPhotoURL;


      currentPhotoURL =
        newPhotoURL;


      // Close modal

      closeEditModal();


      alert(
        "Profile updated successfully!"
      );


    } catch (error) {

      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );


      alert(

        "Failed to update profile.\n\n" +

        (
          error.message ||
          "Please try again."
        )

      );


    } finally {

      saveProfileBtn.disabled =
        false;


      saveProfileBtn.textContent =
        "Save Changes";

    }

  }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

      window.location.replace(
        "login.html"
      );

    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );

    }

  }
);


// =====================================================
// THEME
// =====================================================

const themesBtn =
  document.getElementById(
    "themesBtn"
  );

const themeModal =
  document.getElementById(
    "themeModal"
  );

const closeTheme =
  document.getElementById(
    "closeTheme"
  );

const themeOptions =
  document.querySelectorAll(
    ".theme-option"
  );


// =====================================================
// THEME SELECTION
// =====================================================

function updateThemeSelection() {

  const currentTheme =
    localStorage.getItem(
      "theme"
    ) || "default";


  themeOptions.forEach(
    option => {

      option.classList.remove(
        "active"
      );


      const tick =
        option.querySelector(
          ".tick"
        );


      tick.textContent = "";


      if (
        option.dataset.theme ===
        currentTheme
      ) {

        option.classList.add(
          "active"
        );


        tick.textContent =
          "✓";

      }

    }
  );

}


// =====================================================
// APPLY THEME
// =====================================================

function applyTheme(theme) {

  document.body.classList.remove(

    "theme-light",

    "theme-dark"

  );


  if (
    theme === "light"
  ) {

    document.body.classList.add(
      "theme-light"
    );

  }


  else if (
    theme === "dark"
  ) {

    document.body.classList.add(
      "theme-dark"
    );

  }


  else {

    if (
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ) {

      document.body.classList.add(
        "theme-dark"
      );

    }

  }

}


// =====================================================
// OPEN THEME MODAL
// =====================================================

themesBtn.addEventListener(
  "click",
  (event) => {

    event.preventDefault();

    themeModal.style.display =
      "flex";

  }
);


// =====================================================
// CLOSE THEME MODAL
// =====================================================

closeTheme.addEventListener(
  "click",
  () => {

    themeModal.style.display =
      "none";

  }
);


themeModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      themeModal
    ) {

      themeModal.style.display =
        "none";

    }

  }
);


// =====================================================
// CHANGE THEME
// =====================================================

themeOptions.forEach(
  option => {

    option.addEventListener(
      "click",
      () => {

        const selectedTheme =
          option.dataset.theme;


        localStorage.setItem(

          "theme",

          selectedTheme

        );


        applyTheme(
          selectedTheme
        );


        updateThemeSelection();

      }
    );

  }
);


// =====================================================
// INITIAL THEME
// =====================================================

const savedTheme =
  localStorage.getItem(
    "theme"
  ) || "default";


updateThemeSelection();


applyTheme(
  savedTheme
);


// =====================================================
// SYSTEM THEME CHANGE
// =====================================================

window
  .matchMedia(
    "(prefers-color-scheme: dark)"
  )
  .addEventListener(
    "change",
    () => {

      const theme =
        localStorage.getItem(
          "theme"
        ) || "default";


      if (
        theme === "default"
      ) {

        applyTheme(
          "default"
        );

      }

    }
  );
