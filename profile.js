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

console.log("PROFILE PAGE LOADED");

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

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.replace(
        "login.html"
      );

      return;

    }

    currentUser = user;


    const snap =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );


    if (!snap.exists()) {

      username.textContent =
        "User";

      email.textContent =
        "";

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


    if (editUsername) {

      editUsername.value =
        data.username ||
        user.displayName ||
        "User";

    }


    if (editPhotoPreview) {

      editPhotoPreview.src =
        selectedPhotoURL;

    }


    // =============================
    // CALENDAR STATS
    // =============================

    function getCalendarStats() {

      let played = 0;

      let won = 0;


      for (
        let key in localStorage
      ) {

        if (
          key.startsWith("quiz_")
        ) {

          try {

            const quiz =
              JSON.parse(
                localStorage.getItem(key)
              );


            if (quiz) {

              played++;


              if (quiz.correct) {

                won++;

              }

            }

          } catch (error) {

            console.error(
              "PROFILE QUIZ DATA ERROR:",
              error
            );

          }

        }

      }


      return {

        played,

        won,

        lost:
          played - won

      };

    }


    const totalScore =
      data.totalScore ?? 0;


    const currentStreak =
      data.currentStreak ?? 0;


    const stats =
      getCalendarStats();


    const puzzlesPlayed =
      stats.played;


    const gamesWon =
      stats.won;


    const gamesLost =
      stats.lost;


    const winRate =
      puzzlesPlayed === 0
        ? 0
        : Math.round(
            (
              gamesWon /
              puzzlesPlayed
            ) * 100
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

        score:
          totalScore,

        streak:
          currentStreak,

        accuracy:
          winRate

      })
    );


    // =============================
    // LEVEL
    // INFINITE LEVEL
    // =============================

    const calculatedLevel =
      Math.floor(
        Number(totalScore) / 100
      ) + 1;


    level.textContent =
      "⭐ Level " +
      calculatedLevel;


    // =============================
    // ACHIEVEMENTS
    // =============================

    let html = "";


    if (
      puzzlesPlayed >= 1
    ) {

      html += `
<div class="achievement-item">
<span>🥇</span>
<div>
<h3>Logo Rookie</h3>
<p>Completed your first puzzle.</p>
</div>
</div>`;

    }


    if (
      currentStreak >= 7
    ) {

      html += `
<div class="achievement-item">
<span>🔥</span>
<div>
<h3>7 Day Streak</h3>
<p>Solved puzzles for 7 consecutive days.</p>
</div>
</div>`;

    }


    if (
      totalScore >= 100
    ) {

      html += `
<div class="achievement-item">
<span>⭐</span>
<div>
<h3>100 Points Club</h3>
<p>Earned 100+ points.</p>
</div>
</div>`;

    }


    if (
      puzzlesPlayed >= 30
    ) {

      html += `
<div class="achievement-item">
<span>🎮</span>
<div>
<h3>Puzzle Master</h3>
<p>Played 30 puzzles.</p>
</div>
</div>`;

    }


    if (
      winRate === 100 &&
      puzzlesPlayed >= 10
    ) {

      html += `
<div class="achievement-item">
<span>🎯</span>
<div>
<h3>Accuracy Master</h3>
<p>100% accuracy in 10 puzzles.</p>
</div>
</div>`;

    }


    if (
      html === ""
    ) {

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
      "<h2>Achievements</h2>" +
      html;


    // =============================
    // Logout
    // =============================

    logoutBtn.onclick =
      async () => {

        await signOut(auth);

        window.location.replace(
          "login.html"
        );

      };

  }
);


// =============================
// Theme Popup
// =============================

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


themesBtn.addEventListener(
  "click",
  (e) => {

    e.preventDefault();

    themeModal.style.display =
      "flex";

  }
);


closeTheme.addEventListener(
  "click",
  () => {

    themeModal.style.display =
      "none";

  }
);


themeModal.addEventListener(
  "click",
  (e) => {

    if (
      e.target === themeModal
    ) {

      themeModal.style.display =
        "none";

    }

  }
);


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


      option.querySelector(
        ".tick"
      ).textContent =
        "";


      if (
        option.dataset.theme ===
        currentTheme
      ) {

        option.classList.add(
          "active"
        );


        option.querySelector(
          ".tick"
        ).textContent =
          "✓";

      }

    }
  );

}


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

  } else if (
    theme === "dark"
  ) {

    document.body.classList.add(
      "theme-dark"
    );

  } else {

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


updateThemeSelection();


applyTheme(
  localStorage.getItem(
    "theme"
  ) || "default"
);


window.matchMedia(
  "(prefers-color-scheme: dark)"
).addEventListener(
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


// =============================
// EDIT PROFILE
// =============================

if (editProfileBtn) {

  editProfileBtn.addEventListener(
    "click",
    () => {

      editUsername.value =
        username.textContent;


      editPhotoPreview.src =
        avatar.src;


      selectedPhotoURL =
        avatar.src;


      selectedPhotoFile =
        null;


      if (profilePhotoInput) {

        profilePhotoInput.value =
          "";

      }


      editProfileModal.style.display =
        "flex";

    }
  );

}


// =============================
// CHANGE PHOTO PREVIEW
// =============================

if (profilePhotoInput) {

  profilePhotoInput.addEventListener(
    "change",
    () => {

      const file =
        profilePhotoInput.files[0];


      if (!file) {

        return;

      }


      selectedPhotoFile =
        file;


      const reader =
        new FileReader();


      reader.onload =
        (e) => {

          editPhotoPreview.src =
            e.target.result;

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


// =============================
// CANCEL
// =============================

if (cancelProfileBtn) {

  cancelProfileBtn.addEventListener(
    "click",
    () => {

      editProfileModal.style.display =
        "none";

      selectedPhotoFile =
        null;

    }
  );

}


// =============================
// CLOSE OUTSIDE
// =============================

if (editProfileModal) {

  editProfileModal.addEventListener(
    "click",
    (e) => {

      if (
        e.target ===
        editProfileModal
      ) {

        editProfileModal.style.display =
          "none";

        selectedPhotoFile =
          null;

      }

    }
  );

}

// =============================
// SAVE PROFILE
// =============================

if (saveProfileBtn) {

  saveProfileBtn.addEventListener(
    "click",
    async () => {

      if (!currentUser) {
        return;
      }


      const newUsername =
        editUsername.value.trim();


      if (!newUsername) {

        alert(
          "Please enter username."
        );

        return;

      }


      // =================================
      // SAVE CURRENT VALUES LOCALLY FIRST
      // =================================

      const photoFile =
        selectedPhotoFile;

      const oldPhotoURL =
        selectedPhotoURL;


      // =================================
      // INSTANT USERNAME CHANGE
      // =================================

      username.textContent =
        newUsername;


      // =================================
      // INSTANT PHOTO CHANGE
      // =================================

      let instantPhotoURL =
        oldPhotoURL;


      if (photoFile) {

        instantPhotoURL =
          URL.createObjectURL(
            photoFile
          );


        avatar.src =
          instantPhotoURL;


        editPhotoPreview.src =
          instantPhotoURL;

      }


      // =================================
      // CLOSE MODAL IMMEDIATELY
      // =================================

      editProfileModal.style.display =
        "none";


      selectedPhotoFile =
        null;


      if (profilePhotoInput) {

        profilePhotoInput.value =
          "";

      }


      // =================================
      // FIREBASE SAVE
      // BACKGROUND PROCESS
      // =================================

      try {

        let finalPhotoURL =
          oldPhotoURL;


        // =================================
        // UPLOAD PHOTO
        // =================================

        if (photoFile) {

          const photoRef =
            ref(
              storage,
              `profilePhotos/${currentUser.uid}/${Date.now()}_${photoFile.name}`
            );


          const uploadResult =
            await uploadBytes(
              photoRef,
              photoFile
            );


          finalPhotoURL =
            await getDownloadURL(
              uploadResult.ref
            );


          // =================================
          // REPLACE TEMPORARY URL
          // WITH FIREBASE URL
          // =================================

          avatar.src =
            finalPhotoURL;


          editPhotoPreview.src =
            finalPhotoURL;


          selectedPhotoURL =
            finalPhotoURL;

        }


        // =================================
        // SAVE USERNAME + PHOTO
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
        // FINAL SAVED STATE
        // =================================

        selectedPhotoURL =
          finalPhotoURL;


        username.textContent =
          newUsername;


        avatar.src =
          finalPhotoURL;


        editPhotoPreview.src =
          finalPhotoURL;


        console.log(
          "PROFILE SAVED SUCCESSFULLY"
        );


      } catch (error) {

        console.error(
          "PROFILE SAVE ERROR:",
          error
        );


        // =================================
        // FIREBASE SAVE FAILED
        // RESTORE OLD PHOTO
        // =================================

        if (photoFile) {

          avatar.src =
            oldPhotoURL;

          editPhotoPreview.src =
            oldPhotoURL;

          selectedPhotoURL =
            oldPhotoURL;

        }


        alert(
          "Profile save failed: " +
          error.message
        );

      }

    }
  );

}
