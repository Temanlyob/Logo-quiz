import { auth, db, storage } from "./firebase.js";

import {
  ref,
  uploadBytesResumable,
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
  document.getElementById("level");

const logoutBtn =
  document.getElementById("logoutBtn");

const achievementList =
  document.getElementById("achievementList");


// =====================================================
// EDIT PROFILE
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

let photoUploadTask = null;


// =====================================================
// AUTH
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

    currentUser = user;

    await loadProfile(user);

  }
);


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile(user) {

  try {

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const snap =
      await getDoc(userRef);

    let data = {};

    if (snap.exists()) {

      data =
        snap.data();

    }


    // ===============================================
    // USERNAME
    // ===============================================

    const savedUsername =
      data.username ||
      user.displayName ||
      "User";

    username.textContent =
      savedUsername;

    editUsername.value =
      savedUsername;


    // ===============================================
    // EMAIL
    // ===============================================

    email.textContent =
      data.email ||
      user.email ||
      "";


    // ===============================================
    // PHOTO
    // ===============================================

    currentPhotoURL =
      data.photoURL ||
      user.photoURL ||
      "default-avatar.png";

    avatar.src =
      currentPhotoURL;

    editPhotoPreview.src =
      currentPhotoURL;


    // ===============================================
    // STATS
    // ===============================================

    await loadStats(data);


  } catch (error) {

    console.error(
      "PROFILE LOAD ERROR:",
      error
    );


    username.textContent =
      user.displayName ||
      "User";

    email.textContent =
      user.email ||
      "";

    await loadStats({});

  }

}


// =====================================================
// GET EXACT RESULTS DATA
//
// SAME LOGIC AS results.js
// =====================================================

function getGameStats() {

  let puzzlesPlayed = 0;

  let gamesWon = 0;

  let gamesLost = 0;


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

      const quiz =
        JSON.parse(
          localStorage.getItem(key)
        );


      if (
        quiz &&
        quiz.attempted === true
      ) {

        // =========================================
        // TOTAL PLAYED
        // =========================================

        puzzlesPlayed++;


        // =========================================
        // WON
        // =========================================

        if (
          quiz.correct === true
        ) {

          gamesWon++;

        }


        // =========================================
        // LOST
        // =========================================

        else if (
          quiz.correct === false
        ) {

          gamesLost++;

        }

      }


    } catch (error) {

      console.error(
        "PROFILE QUIZ DATA ERROR:",
        error
      );

    }

  }


  // ===============================================
  // ACCURACY
  // ===============================================

  const winRate =
    puzzlesPlayed === 0
      ? 0
      : Math.round(
          (
            gamesWon /
            puzzlesPlayed
          ) * 100
        );


  return {

    puzzlesPlayed,

    gamesWon,

    gamesLost,

    winRate

  };

}


// =====================================================
// LOAD STATS
// =====================================================

async function loadStats(data) {

  // ===============================================
  // FIRESTORE SCORE
  // ===============================================

  const totalScore =
    Number(
      data.totalScore || 0
    );


  // ===============================================
  // FIRESTORE STREAK
  // ===============================================

  const currentStreak =
    Number(
      data.currentStreak || 0
    );


  // ===============================================
  // EXACT RESULTS LOGIC
  // ===============================================

  const stats =
    getGameStats();


  // ===============================================
  // UPDATE UI
  // ===============================================

  score.textContent =
    totalScore;

  streak.textContent =
    currentStreak;

  accuracy.textContent =
    stats.winRate + "%";

  played.textContent =
    stats.puzzlesPlayed;


  // ===============================================
  // LEVEL
  // ===============================================

  if (
    totalScore >= 1000
  ) {

    level.textContent =
      "👑 Level 5";

  }

  else if (
    totalScore >= 500
  ) {

    level.textContent =
      "💎 Level 4";

  }

  else if (
    totalScore >= 250
  ) {

    level.textContent =
      "🥇 Level 3";

  }

  else if (
    totalScore >= 100
  ) {

    level.textContent =
      "🥈 Level 2";

  }

  else {

    level.textContent =
      "⭐ Level 1";

  }


  // ===============================================
  // ACHIEVEMENTS
  // ===============================================

  renderAchievements({

    totalScore,

    currentStreak,

    puzzlesPlayed:
      stats.puzzlesPlayed,

    winRate:
      stats.winRate

  });


  // ===============================================
  // SAVE LOCAL PROFILE PROGRESS
  // ===============================================

  localStorage.setItem(

    "profileProgress",

    JSON.stringify({

      score:
        totalScore,

      streak:
        currentStreak,

      accuracy:
        stats.winRate,

      played:
        stats.puzzlesPlayed

    })

  );


  // ===============================================
  // DEBUG
  // ===============================================

  console.log(
    "PROFILE STATS:",
    {

      score:
        totalScore,

      streak:
        currentStreak,

      played:
        stats.puzzlesPlayed,

      won:
        stats.gamesWon,

      lost:
        stats.gamesLost,

      accuracy:
        stats.winRate

    }
  );

}


// =====================================================
// ACHIEVEMENTS
// =====================================================

function renderAchievements(stats) {

  let html = "";


  // ===============================================
  // FIRST PUZZLE
  // ===============================================

  if (
    stats.puzzlesPlayed >= 1
  ) {

    html += `

      <div class="achievement-item">

        <span>🥇</span>

        <div>

          <h3>Logo Rookie</h3>

          <p>
            Completed your first puzzle.
          </p>

        </div>

      </div>

    `;

  }


  // ===============================================
  // 7 DAY STREAK
  // ===============================================

  if (
    stats.currentStreak >= 7
  ) {

    html += `

      <div class="achievement-item">

        <span>🔥</span>

        <div>

          <h3>7 Day Streak</h3>

          <p>
            Solved puzzles for 7 consecutive days.
          </p>

        </div>

      </div>

    `;

  }


  // ===============================================
  // 100 POINTS
  // ===============================================

  if (
    stats.totalScore >= 100
  ) {

    html += `

      <div class="achievement-item">

        <span>⭐</span>

        <div>

          <h3>100 Points Club</h3>

          <p>
            Earned 100+ points.
          </p>

        </div>

      </div>

    `;

  }


  // ===============================================
  // 30 PUZZLES
  // ===============================================

  if (
    stats.puzzlesPlayed >= 30
  ) {

    html += `

      <div class="achievement-item">

        <span>🎮</span>

        <div>

          <h3>Puzzle Master</h3>

          <p>
            Played 30 puzzles.
          </p>

        </div>

      </div>

    `;

  }


  // ===============================================
  // ACCURACY MASTER
  // ===============================================

  if (

    stats.puzzlesPlayed >= 10 &&

    stats.winRate === 100

  ) {

    html += `

      <div class="achievement-item">

        <span>🎯</span>

        <div>

          <h3>Accuracy Master</h3>

          <p>
            100% accuracy in 10 puzzles.
          </p>

        </div>

      </div>

    `;

  }


  // ===============================================
  // NO ACHIEVEMENTS
  // ===============================================

  if (
    html === ""
  ) {

    html = `

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

  }


  achievementList.innerHTML =
    html;

}


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


// =====================================================
// CLOSE BUTTON
// =====================================================

cancelProfileBtn.addEventListener(
  "click",
  closeEditModal
);


closeEditProfile.addEventListener(
  "click",
  closeEditModal
);


// =====================================================
// CLICK OUTSIDE MODAL
// =====================================================

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
// PHOTO SELECT
// =====================================================

profilePhotoInput.addEventListener(
  "change",
  () => {

    const file =
      profilePhotoInput.files?.[0];


    if (!file) {

      return;

    }


    // ===============================================
    // CHECK IMAGE
    // ===============================================

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


    // ===============================================
    // MAX 5 MB
    // ===============================================

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


    // ===============================================
    // INSTANT PREVIEW
    // ===============================================

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
// UPLOAD PHOTO WITH TIMEOUT
// =====================================================

function uploadProfilePhoto(
  file
) {

  return new Promise(
    (resolve, reject) => {

      if (!file) {

        resolve(
          currentPhotoURL
        );

        return;

      }


      // =============================================
      // FILE EXTENSION
      // =============================================

      let extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase();


      if (
        !extension
      ) {

        extension =
          "jpg";

      }


      // =============================================
      // STORAGE PATH
      // =============================================

      const storageReference =
        ref(

          storage,

          `profilePhotos/${currentUser.uid}/profile.${extension}`

        );


      // =============================================
      // RESUMABLE UPLOAD
      // =============================================

      photoUploadTask =
        uploadBytesResumable(

          storageReference,

          file,

          {

            contentType:
              file.type,

            cacheControl:
              "public,max-age=3600"

          }

        );


      // =============================================
      // 20 SECOND TIMEOUT
      // =============================================

      const timeout =
        setTimeout(
          () => {

            if (
              photoUploadTask
            ) {

              photoUploadTask.cancel();

            }


            reject(
              new Error(
                "Photo upload timed out. Please check Firebase Storage Rules or your internet connection."
              )
            );

          },
          20000
        );


      // =============================================
      // UPLOAD EVENTS
      // =============================================

      photoUploadTask.on(

        "state_changed",

        (snapshot) => {

          if (
            snapshot.totalBytes > 0
          ) {

            const percent =
              Math.round(

                (
                  snapshot.bytesTransferred /
                  snapshot.totalBytes
                ) * 100

              );


            saveProfileBtn.textContent =
              "Uploading " +
              percent +
              "%...";

          }

        },


        (error) => {

          clearTimeout(
            timeout
          );

          photoUploadTask =
            null;


          console.error(
            "PHOTO UPLOAD ERROR:",
            error
          );


          reject(
            error
          );

        },


        async () => {

          clearTimeout(
            timeout
          );


          try {

            const url =
              await getDownloadURL(
                storageReference
              );


            photoUploadTask =
              null;


            resolve(
              url
            );


          } catch (error) {

            photoUploadTask =
              null;

            reject(
              error
            );

          }

        }

      );

    }
  );

}


// =====================================================
// SAVE PROFILE
// =====================================================

saveProfileBtn.addEventListener(
  "click",
  async () => {

    if (!currentUser) {

      alert(
        "Please login again."
      );

      return;

    }


    const newUsername =
      editUsername.value.trim();


    // ===============================================
    // USERNAME VALIDATION
    // ===============================================

    if (!newUsername) {

      alert(
        "Please enter username."
      );

      return;

    }


    try {

      saveProfileBtn.disabled =
        true;


      saveProfileBtn.textContent =
        "Saving...";


      // =============================================
      // STEP 1
      // SAVE USERNAME FIRST
      //
      // This means username will not be blocked
      // by a photo upload problem.
      // =============================================

      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );


      await setDoc(

        userRef,

        {

          uid:
            currentUser.uid,

          username:
            newUsername,

          email:
            currentUser.email ||
            email.textContent ||
            ""

        },

        {
          merge:
            true
        }

      );


      // =============================================
      // UPDATE AUTH USERNAME
      // =============================================

      await updateProfile(

        currentUser,

        {

          displayName:
            newUsername

        }

      );


      // =============================================
      // UPDATE SCREEN IMMEDIATELY
      // =============================================

      username.textContent =
        newUsername;


      editUsername.value =
        newUsername;


      // =============================================
      // STEP 2
      // PHOTO UPLOAD
      // =============================================

      if (
        selectedPhotoFile
      ) {

        saveProfileBtn.textContent =
          "Uploading Photo...";


        try {

          const newPhotoURL =
            await uploadProfilePhoto(
              selectedPhotoFile
            );


          // ===========================================
          // SAVE PHOTO URL
          // ===========================================

          await setDoc(

            userRef,

            {

              photoURL:
                newPhotoURL

            },

            {
              merge:
                true
            }

          );


          // ===========================================
          // UPDATE AUTH PHOTO
          // ===========================================

          await updateProfile(

            currentUser,

            {

              photoURL:
                newPhotoURL

            }

          );


          // ===========================================
          // UPDATE UI
          // ===========================================

          currentPhotoURL =
            newPhotoURL;


          avatar.src =
            newPhotoURL;


          editPhotoPreview.src =
            newPhotoURL;


          selectedPhotoFile =
            null;


        } catch (photoError) {

          console.error(
            "PHOTO SAVE ERROR:",
            photoError
          );


          // Username is already saved.
          // Only photo failed.

          alert(

            "Username saved successfully, but profile photo could not be uploaded.\n\n" +

            (
              photoError.message ||
              "Please check Firebase Storage Rules."
            )

          );

        }

      }


      // =============================================
      // CLOSE
      // =============================================

      closeEditModal();


      // =============================================
      // SUCCESS
      // =============================================

      if (
        !selectedPhotoFile
      ) {

        alert(
          "Profile updated successfully!"
        );

      }


    } catch (error) {

      console.error(
        "PROFILE SAVE ERROR:",
        error
      );


      alert(

        "Profile save failed.\n\n" +

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

      photoUploadTask =
        null;

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


      if (!tick) {

        return;

      }


      tick.textContent =
        "";


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
// OPEN THEME
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
// CLOSE THEME
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
// PHONE THEME CHANGE
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
