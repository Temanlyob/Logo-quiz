import { auth, db } from "./firebase.js";

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
// EXACT SAME GAME STATS AS RESULTS.JS
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

        // Total played
        puzzlesPlayed++;


        // Won
        if (
          quiz.correct === true
        ) {

          gamesWon++;

        }


        // Lost
        else if (
          quiz.correct === false
        ) {

          gamesLost++;

        }

      }


    } catch (error) {

      console.error(
        "QUIZ DATA ERROR:",
        error
      );

    }

  }


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
  // TOTAL SCORE
  // ===============================================

  const totalScore =
    Number(
      data.totalScore || 0
    );


  // ===============================================
  // CURRENT STREAK
  // ===============================================

  const currentStreak =
    Number(
      data.currentStreak || 0
    );


  // ===============================================
  // GAME STATS
  // ===============================================

  const gameStats =
    getGameStats();


  // ===============================================
  // UPDATE UI
  // ===============================================

  score.textContent =
    totalScore;

  streak.textContent =
    currentStreak;

  accuracy.textContent =
    gameStats.winRate + "%";

  played.textContent =
    gameStats.puzzlesPlayed;


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

    totalScore:
      totalScore,

    currentStreak:
      currentStreak,

    puzzlesPlayed:
      gameStats.puzzlesPlayed,

    winRate:
      gameStats.winRate

  });


  // ===============================================
  // LOCAL PROFILE PROGRESS
  // ===============================================

  localStorage.setItem(

    "profileProgress",

    JSON.stringify({

      score:
        totalScore,

      streak:
        currentStreak,

      accuracy:
        gameStats.winRate,

      played:
        gameStats.puzzlesPlayed

    })

  );


  console.log(
    "PROFILE STATS:",
    {

      score:
        totalScore,

      streak:
        currentStreak,

      played:
        gameStats.puzzlesPlayed,

      won:
        gameStats.gamesWon,

      lost:
        gameStats.gamesLost,

      accuracy:
        gameStats.winRate

    }
  );

}


// =====================================================
// ACHIEVEMENTS
// =====================================================

function renderAchievements(stats) {

  let html = "";


  // ===============================================
  // LOGO ROOKIE
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
  // PUZZLE MASTER
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


cancelProfileBtn.addEventListener(
  "click",
  closeEditModal
);


closeEditProfile.addEventListener(
  "click",
  closeEditModal
);


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
    // IMAGE CHECK
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
    // ORIGINAL FILE MAX 10 MB
    // ===============================================

    if (
      file.size >
      10 * 1024 * 1024
    ) {

      alert(
        "Please select an image smaller than 10 MB."
      );

      profilePhotoInput.value =
        "";

      return;

    }


    selectedPhotoFile =
      file;


    // ===============================================
    // PREVIEW
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
// COMPRESS IMAGE
//
// Firebase Storage is NOT used.
// Image is resized + compressed in browser.
// =====================================================

function compressImage(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        (event) => {

          const image =
            new Image();


          image.onload =
            () => {

              // =====================================
              // MAX IMAGE SIZE
              // =====================================

              const MAX_SIZE =
                500;


              let width =
                image.width;

              let height =
                image.height;


              if (
                width > height
              ) {

                if (
                  width > MAX_SIZE
                ) {

                  height =
                    Math.round(
                      height *
                      MAX_SIZE /
                      width
                    );

                  width =
                    MAX_SIZE;

                }

              }

              else {

                if (
                  height > MAX_SIZE
                ) {

                  width =
                    Math.round(
                      width *
                      MAX_SIZE /
                      height
                    );

                  height =
                    MAX_SIZE;

                }

              }


              // =====================================
              // CANVAS
              // =====================================

              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                width;

              canvas.height =
                height;


              const ctx =
                canvas.getContext(
                  "2d"
                );


              ctx.drawImage(

                image,

                0,
                0,

                width,
                height

              );


              // =====================================
              // JPEG COMPRESSION
              // =====================================

              let quality =
                0.75;


              let compressed =
                canvas.toDataURL(
                  "image/jpeg",
                  quality
                );


              // =====================================
              // KEEP IT SMALL
              // =====================================

              // If Base64 is still large,
              // compress further.

              while (

                compressed.length >
                  750000 &&

                quality > 0.35

              ) {

                quality -=
                  0.05;


                compressed =
                  canvas.toDataURL(
                    "image/jpeg",
                    quality
                  );

              }


              // =====================================
              // FINAL SIZE CHECK
              // =====================================

              if (
                compressed.length >
                900000
              ) {

                reject(
                  new Error(
                    "Photo is still too large after compression."
                  )
                );

                return;

              }


              resolve(
                compressed
              );

            };


          image.onerror =
            () => {

              reject(
                new Error(
                  "Could not read image."
                )
              );

            };


          image.src =
            event.target.result;

        };


      reader.onerror =
        () => {

          reject(
            new Error(
              "Could not read selected photo."
            )
          );

        };


      reader.readAsDataURL(file);

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


      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );


      // =============================================
      // PHOTO
      // =============================================

      let newPhotoURL =
        currentPhotoURL;


      if (
        selectedPhotoFile
      ) {

        saveProfileBtn.textContent =
          "Preparing Photo...";


        // =========================================
        // COMPRESS LOCALLY
        // =========================================

        newPhotoURL =
          await compressImage(
            selectedPhotoFile
          );


        console.log(
          "Compressed photo size:",
          Math.round(
            newPhotoURL.length / 1024
          ) + " KB"
        );

      }


      // =============================================
      // SAVE EVERYTHING TO FIRESTORE
      // =============================================

      saveProfileBtn.textContent =
        "Saving...";


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
            "",

          photoURL:
            newPhotoURL

        },

        {

          merge:
            true

        }

      );


      // =============================================
      // UPDATE FIREBASE AUTH
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

      avatar.src =
        newPhotoURL;

      editPhotoPreview.src =
        newPhotoURL;

      currentPhotoURL =
        newPhotoURL;


      // =============================================
      // CLOSE MODAL
      // =============================================

      closeEditModal();


      alert(
        "Profile updated successfully!"
      );


    } catch (error) {

      console.error(
        "PROFILE SAVE ERROR:",
        error
      );


      // =============================================
      // IMPORTANT: SHOW EXACT ERROR
      // =============================================

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

      selectedPhotoFile =
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
// UPDATE THEME SELECTION
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
// SELECT THEME
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
