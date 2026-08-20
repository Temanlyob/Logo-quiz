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
// CONTACT US ELEMENTS
// =====================================================

const contactUsBtn =
  document.getElementById("contactUsBtn");

const contactModal =
  document.getElementById("contactModal");

const closeContact =
  document.getElementById("closeContact");

const contactForm =
  document.getElementById("contactForm");

const contactStatus =
  document.getElementById("contactStatus");

const sendContactBtn =
  document.getElementById("sendContactBtn");

const contactReplyTo =
  document.getElementById("contactReplyTo");


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let currentPhotoURL =
  "default-avatar.png";

let selectedPhotoFile = null;


// =====================================================
// BASIC ELEMENT CHECK
// =====================================================

if (!editProfileBtn) {
  console.error("Missing #editProfileBtn");
}

if (!editProfileModal) {
  console.error("Missing #editProfileModal");
}

if (!profilePhotoInput) {
  console.error("Missing #profilePhotoInput");
}

if (!saveProfileBtn) {
  console.error("Missing #saveProfileBtn");
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

      username.textContent =
        user.displayName ||
        "User";

      email.textContent =
        user.email ||
        "";

      await loadStats({});

    }

  }
);


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


  // ===================================================
  // USERNAME
  // ===================================================

  const savedUsername =
    data.username ||
    user.displayName ||
    "User";


  username.textContent =
    savedUsername;


  editUsername.value =
    savedUsername;


  // ===================================================
  // EMAIL
  // ===================================================

  email.textContent =
    data.email ||
    user.email ||
    "";


  // ===================================================
  // PHOTO
  //
  // IMPORTANT:
  // Photo comes ONLY from Firestore.
  // We don't use Auth photoURL.
  // ===================================================

  currentPhotoURL =
    data.photoURL ||
    "default-avatar.png";


  avatar.src =
    currentPhotoURL;


  editPhotoPreview.src =
    currentPhotoURL;


  // ===================================================
  // STATS
  // ===================================================

  await loadStats(data);

}


// =====================================================
// GET EXACT GAME STATS
//
// Same logic used by Results page:
// quiz_*
// attempted === true
// correct === true
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


      // =============================================
      // ONLY ATTEMPTED GAMES
      // =============================================

      if (
        quiz.attempted === true
      ) {

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

      console.warn(
        "Invalid quiz data:",
        key
      );

    }

  }

  // =====================================================
// CONTACT US
// =====================================================

contactUsBtn.addEventListener(
  "click",
  (event) => {

    event.preventDefault();

    contactModal.style.display =
      "flex";

    contactStatus.textContent = "";

  }
);


// =====================================================
// CLOSE CONTACT
// =====================================================

closeContact.addEventListener(
  "click",
  () => {

    contactModal.style.display =
      "none";

  }
);


// =====================================================
// CLOSE BY OUTSIDE CLICK
// =====================================================

contactModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target === contactModal
    ) {

      contactModal.style.display =
        "none";

    }

  }
);


// =====================================================
// SEND CONTACT MESSAGE
// =====================================================

contactForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    sendContactBtn.disabled =
      true;

    sendContactBtn.textContent =
      "Sending...";


    contactStatus.textContent =
      "";


    const formData =
      new FormData(
        contactForm
      );


    // User email → Reply-To

    contactReplyTo.value =
      formData.get("email");


    try {

      const response =
        await fetch(
          "https://formsubmit.co/ajax/temanlyob@gmail.com",
          {

            method:"POST",

            headers:{
              "Content-Type":
                "application/json",

              "Accept":
                "application/json"
            },

            body:JSON.stringify({

              name:
                formData.get("name"),

              email:
                formData.get("email"),

              type:
                formData.get("type"),

              message:
                formData.get("message"),

              _subject:
                "Temanlyob - " +
                formData.get("type"),

              _replyto:
                formData.get("email"),

              _template:
                "table"

            })

          }
        );


      const result =
        await response.json();


      if (
        response.ok &&
        result.success !== false
      ) {

        contactStatus.textContent =
          "✅ Message sent successfully!";

        contactStatus.style.color =
          "#22c55e";


        contactForm.reset();


        setTimeout(
          () => {

            contactModal.style.display =
              "none";

            contactStatus.textContent =
              "";

          },
          1800
        );

      }

      else {

        throw new Error(
          "Message could not be sent."
        );

      }

    }

    catch(error) {

      console.error(
        "CONTACT ERROR:",
        error
      );


      contactStatus.textContent =
        "❌ Message send nahi hua. Please try again.";

      contactStatus.style.color =
        "#ef4444";

    }

    finally {

      sendContactBtn.disabled =
        false;

      sendContactBtn.textContent =
        "📩 Send Message";

    }

  }
);


  // =================================================
  // ACCURACY
  // =================================================

  let winRate = 0;


  if (
    puzzlesPlayed > 0
  ) {

    winRate =
      Math.round(

        (
          gamesWon /
          puzzlesPlayed
        ) * 100

      );

  }


  return {

    puzzlesPlayed:
      puzzlesPlayed,

    gamesWon:
      gamesWon,

    gamesLost:
      gamesLost,

    winRate:
      winRate

  };

}


// =====================================================
// LOAD STATS
// =====================================================

async function loadStats(data) {

  // ===================================================
  // SCORE
  // ===================================================

  const totalScore =
    Number(
      data.totalScore || 0
    );


  // ===================================================
  // STREAK
  // ===================================================

  const currentStreak =
    Number(
      data.currentStreak || 0
    );


  // ===================================================
  // GAME DATA
  // ===================================================

  const gameStats =
    getGameStats();


  // ===================================================
  // UPDATE SCREEN
  // ===================================================

  score.textContent =
    totalScore;


  streak.textContent =
    currentStreak;


  accuracy.textContent =
    gameStats.winRate + "%";


  played.textContent =
    gameStats.puzzlesPlayed;


  // ===================================================
  // LEVEL
  // ===================================================

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


  // ===================================================
  // ACHIEVEMENTS
  // ===================================================

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


  // ===================================================
  // LOCAL BACKUP
  // ===================================================

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
    "PROFILE STATS",
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


  // ===================================================
  // FIRST PUZZLE
  // ===================================================

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


  // ===================================================
  // 7 DAY STREAK
  // ===================================================

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


  // ===================================================
  // 100 POINTS
  // ===================================================

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


  // ===================================================
  // 30 PUZZLES
  // ===================================================

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


  // ===================================================
  // ACCURACY MASTER
  // ===================================================

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


  // ===================================================
  // NO ACHIEVEMENTS
  // ===================================================

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
// CLOSE EDIT MODAL
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
// SELECT PHOTO
// =====================================================

profilePhotoInput.addEventListener(
  "change",
  () => {

    const file =
      profilePhotoInput.files?.[0];


    if (!file) {

      return;

    }


    // =================================================
    // CHECK IMAGE
    // =================================================

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


    // =================================================
    // MAX ORIGINAL SIZE 10 MB
    // =================================================

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


    // =================================================
    // INSTANT PREVIEW
    // =================================================

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
// COMPRESS PHOTO
//
// No Firebase Storage.
// Photo becomes a small Base64 JPEG.
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

              // =======================================
              // MAX DIMENSION
              // =======================================

              const MAX_SIZE =
                450;


              let width =
                image.width;

              let height =
                image.height;


              // =======================================
              // RESIZE
              // =======================================

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


              // =======================================
              // CANVAS
              // =======================================

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


              // =======================================
              // COMPRESS
              // =======================================

              let quality =
                0.70;


              let result =
                canvas.toDataURL(

                  "image/jpeg",

                  quality

                );


              // =======================================
              // MAKE SMALLER IF NEEDED
              // =======================================

              while (

                result.length >
                  600000 &&

                quality >
                  0.30

              ) {

                quality -=
                  0.05;


                result =
                  canvas.toDataURL(

                    "image/jpeg",

                    quality

                  );

              }


              // =======================================
              // FINAL CHECK
              // =======================================

              if (
                result.length >
                750000
              ) {

                reject(

                  new Error(

                    "Photo is too large even after compression. Please choose another photo."

                  )

                );

                return;

              }


              console.log(

                "PHOTO COMPRESSED:",

                Math.round(
                  result.length /
                  1024
                ) + " KB"

              );


              resolve(
                result
              );

            };


          image.onerror =
            () => {

              reject(

                new Error(
                  "Could not process the image."
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


    // =================================================
    // USERNAME VALIDATION
    // =================================================

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


      // =================================================
      // PHOTO
      // =================================================

      let newPhotoURL =
        currentPhotoURL;


      if (
        selectedPhotoFile
      ) {

        saveProfileBtn.textContent =
          "Preparing Photo...";


        newPhotoURL =
          await compressImage(
            selectedPhotoFile
          );

      }


      // =================================================
      // SAVE TO FIRESTORE
      //
      // Photo is saved HERE only.
      // =================================================

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


      // =================================================
      // UPDATE FIREBASE AUTH
      //
      // IMPORTANT:
      // DO NOT PUT photoURL HERE.
      //
      // Firebase Auth rejects the Base64 photo
      // because it is too long.
      // =================================================

      await updateProfile(

        currentUser,

        {

          displayName:
            newUsername

        }

      );


      // =================================================
      // UPDATE SCREEN
      // =================================================

      username.textContent =
        newUsername;


      avatar.src =
        newPhotoURL;


      editPhotoPreview.src =
        newPhotoURL;


      currentPhotoURL =
        newPhotoURL;


      selectedPhotoFile =
        null;


      // =================================================
      // CLOSE MODAL
      // =================================================

      closeEditModal();


      alert(
        "Profile updated successfully!"
      );


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
