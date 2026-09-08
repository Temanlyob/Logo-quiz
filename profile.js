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
// CONTACT US
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


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let currentPhotoURL =
  "default-avatar.png";

let selectedPhotoFile = null;


// =====================================================
// DATE HELPERS
// =====================================================

function getLocalDateOnly(date) {

  const d = new Date(date);

  if (
    Number.isNaN(d.getTime())
  ) {

    return null;

  }

  d.setHours(
    0,
    0,
    0,
    0
  );

  return d;

}


function dateId(date) {

  const d =
    getLocalDateOnly(date);

  if (!d) {

    return "";

  }

  return (
    d.getFullYear() +
    "-" +
    String(
      d.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      d.getDate()
    ).padStart(2, "0")
  );

}


// =====================================================
// MERGE ALL GAMES
//
// Firestore + localStorage
//
// Same puzzle is counted only once.
// =====================================================

function getAllGames(
  firestoreHistory
) {

  const games = {};


  // ===================================================
  // FIRESTORE GAMES
  // ===================================================

  if (
    firestoreHistory &&
    typeof firestoreHistory === "object"
  ) {

    for (
      const key in firestoreHistory
    ) {

      const game =
        firestoreHistory[key];

      if (
        !game ||
        game.played !== true
      ) {

        continue;

      }

      games[key] = {
        ...game
      };

    }

  }


  // ===================================================
  // LOCAL STORAGE GAMES
  // ===================================================

  for (
    let i = 0;
    i < localStorage.length;
    i++
  ) {

    const storageKey =
      localStorage.key(i);

    if (
      !storageKey ||
      !storageKey.startsWith("quiz_")
    ) {

      continue;

    }


    try {

      const game =
        JSON.parse(
          localStorage.getItem(
            storageKey
          )
        );


      if (
        !game ||
        game.attempted !== true
      ) {

        continue;

      }


      const puzzleKey =
        storageKey.replace(
          "quiz_",
          ""
        );


      if (
        !games[puzzleKey]
      ) {

        games[puzzleKey] = {
          ...game,
          played: true
        };

      }

    }

    catch (error) {

      console.error(
        "LOCAL GAME ERROR:",
        error
      );

    }

  }


  return games;

}


// =====================================================
// GAME STATS
//
// EVERY COMPLETED GAME COUNTS.
//
// Puzzle date doesn't matter.
// Late-played old puzzle also counts.
// =====================================================

function calculateGameStats(
  allGames
) {

  let totalGames = 0;
  let gamesWon = 0;
  let gamesLost = 0;


  for (
    const key in allGames
  ) {

    const game =
      allGames[key];


    if (
      !game ||
      game.played !== true
    ) {

      continue;

    }


    totalGames++;


    if (
      game.correct === true
    ) {

      gamesWon++;

    }

    else if (
      game.correct === false
    ) {

      gamesLost++;

    }

  }


  const winRate =
    totalGames === 0
      ? 0
      : Math.round(
          (
            gamesWon /
            totalGames
          ) * 100
        );


  return {

    totalGames,
    gamesWon,
    gamesLost,
    winRate

  };

}


// =====================================================
// ACTUAL PLAY DATES
//
// ONLY playedAt is used.
//
// Example:
//
// 1 Sept puzzle played on 3 Sept
// → 3 Sept becomes streak day.
//
// Puzzle's original date is irrelevant.
// =====================================================

function getActualPlayDates(
  allGames
) {

  const dates =
    new Set();


  for (
    const key in allGames
  ) {

    const game =
      allGames[key];


    if (
      !game ||
      game.played !== true ||
      !game.playedAt
    ) {

      continue;

    }


    const playedDate =
      getLocalDateOnly(
        game.playedAt
      );


    if (!playedDate) {

      continue;

    }


    dates.add(
      dateId(
        playedDate
      )
    );

  }


  return Array.from(
    dates
  ).sort();

}


// =====================================================
// CURRENT STREAK
//
// If today played:
//     start today.
//
// If today not played:
//     start yesterday.
//
// Then move backwards.
// =====================================================

function calculateCurrentStreak(
  playDateIds
) {

  if (
    playDateIds.length === 0
  ) {

    return 0;

  }


  const played =
    new Set(
      playDateIds
    );


  const today =
    getLocalDateOnly(
      new Date()
    );


  const todayId =
    dateId(
      today
    );


  let cursor;


  if (
    played.has(todayId)
  ) {

    cursor =
      today;

  }

  else {

    cursor =
      new Date(today);

    cursor.setDate(
      cursor.getDate() - 1
    );

  }


  let currentStreak = 0;


  while (true) {

    const id =
      dateId(
        cursor
      );


    if (
      !played.has(id)
    ) {

      break;

    }


    currentStreak++;


    cursor =
      new Date(cursor);

    cursor.setDate(
      cursor.getDate() - 1
    );

  }


  return currentStreak;

}


// =====================================================
// BEST STREAK
// =====================================================

function calculateBestStreak(
  playDateIds
) {

  if (
    playDateIds.length === 0
  ) {

    return 0;

  }


  let best = 1;
  let current = 1;


  for (
    let i = 1;
    i < playDateIds.length;
    i++
  ) {

    const previous =
      new Date(
        playDateIds[i - 1]
      );


    const currentDate =
      new Date(
        playDateIds[i]
      );


    previous.setHours(
      0, 0, 0, 0
    );


    currentDate.setHours(
      0, 0, 0, 0
    );


    const diff =
      Math.round(
        (
          currentDate.getTime() -
          previous.getTime()
        ) /
        (
          1000 *
          60 *
          60 *
          24
        )
      );


    if (
      diff === 1
    ) {

      current++;

    }

    else {

      current = 1;

    }


    if (
      current > best
    ) {

      best =
        current;

    }

  }


  return best;

}


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


    currentUser =
      user;


    try {

      await loadProfile(
        user
      );

    }

    catch (error) {

      console.error(
        "PROFILE LOAD ERROR:",
        error
      );

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
    await getDoc(
      userRef
    );


  let data = {};


  if (
    snapshot.exists()
  ) {

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
  // ===================================================

  currentPhotoURL =
    data.photoURL ||
    user.photoURL ||
    "default-avatar.png";


  avatar.src =
    currentPhotoURL;


  editPhotoPreview.src =
    currentPhotoURL;


  // ===================================================
  // STATS
  // ===================================================

  await loadStats(
    data
  );

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
  // HISTORY
  // ===================================================

  const history =
    data.history || {};


  // ===================================================
  // MERGE ALL GAMES
  // ===================================================

  const allGames =
    getAllGames(
      history
    );


  // ===================================================
  // GAME STATS
  // ===================================================

  const gameStats =
    calculateGameStats(
      allGames
    );


  // ===================================================
  // ACTUAL PLAY DATES
  // ===================================================

  const playDateIds =
    getActualPlayDates(
      allGames
    );


  // ===================================================
  // CURRENT STREAK
  // ===================================================

  const currentStreak =
    calculateCurrentStreak(
      playDateIds
    );


  // ===================================================
  // BEST STREAK
  // ===================================================

  const bestStreak =
    calculateBestStreak(
      playDateIds
    );


  // ===================================================
  // SAVE STREAK
  // ===================================================

  const userRef =
    doc(
      db,
      "users",
      currentUser.uid
    );


  await setDoc(
    userRef,
    {

      currentStreak:
        currentStreak,

      bestStreak:
        bestStreak

    },
    {
      merge: true
    }
  );


  // ===================================================
  // UPDATE UI
  // ===================================================

  score.textContent =
    totalScore;


  streak.textContent =
    currentStreak;


  accuracy.textContent =
    gameStats.winRate +
    "%";


  played.textContent =
    gameStats.totalGames;


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
      gameStats.totalGames,

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
        gameStats.totalGames

    })

  );


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "PROFILE STATS",
    {

      score:
        totalScore,

      streak:
        currentStreak,

      bestStreak:
        bestStreak,

      played:
        gameStats.totalGames,

      won:
        gameStats.gamesWon,

      lost:
        gameStats.gamesLost,

      accuracy:
        gameStats.winRate,

      playDates:
        playDateIds

    }
  );

}


// =====================================================
// ACHIEVEMENTS
// =====================================================

function renderAchievements(stats) {

  if (!achievementList) {

    return;

  }


  let html = "";


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
// EDIT PROFILE
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

              const MAX_SIZE =
                450;


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


              let quality =
                0.70;


              let result =
                canvas.toDataURL(
                  "image/jpeg",
                  quality
                );


              while (
                result.length > 600000 &&
                quality > 0.30
              ) {

                quality -=
                  0.05;


                result =
                  canvas.toDataURL(
                    "image/jpeg",
                    quality
                  );

              }


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
          merge: true
        }
      );


      await updateProfile(
        currentUser,
        {
          displayName:
            newUsername
        }
      );


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


      closeEditModal();


      alert(
        "Profile updated successfully!"
      );

    }

    catch (error) {

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

    }

    finally {

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

      await signOut(
        auth
      );

      window.location.replace(
        "login.html"
      );

    }

    catch (error) {

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

    else {

      document.body.classList.add(
        "theme-light"
      );

    }

  }

}


applyTheme(
  localStorage.getItem("theme") ||
  "default"
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


themesBtn.addEventListener(
  "click",
  (event) => {

    event.preventDefault();

    themeModal.style.display =
      "flex";

    updateThemeSelection();

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


themeOptions.forEach(
  option => {

    option.addEventListener(
      "click",
      () => {

        const theme =
          option.dataset.theme;

        localStorage.setItem(
          "theme",
          theme
        );

        applyTheme(
          theme
        );

        updateThemeSelection();

      }
    );

  }
);


// =====================================================
// CONTACT US
// =====================================================

if (
  contactUsBtn &&
  contactModal &&
  closeContact &&
  contactForm &&
  contactStatus &&
  sendContactBtn
) {

  contactUsBtn.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      contactModal.style.display =
        "flex";

      contactStatus.textContent =
        "";

    }
  );


  closeContact.addEventListener(
    "click",
    () => {

      contactModal.style.display =
        "none";

    }
  );


  contactModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        contactModal
      ) {

        contactModal.style.display =
          "none";

      }

    }
  );


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


      const messageType =
        formData.get("type") ||
        "Other";


      const message =
        formData.get("message") ||
        "";


      try {

        const response =
          await fetch(
            "https://formsubmit.co/ajax/temanlyob@gmail.com",
            {

              method:
                "POST",

              headers:
                {
                  "Content-Type":
                    "application/json",

                  "Accept":
                    "application/json"
                },

              body:
                JSON.stringify({

                  name:
                    username.textContent ||
                    currentUser.displayName ||
                    "User",

                  email:
                    currentUser.email ||
                    "",

                  type:
                    messageType,

                  message:
                    message,

                  _subject:
                    "Temanlyob - " +
                    messageType,

                  _replyto:
                    currentUser.email ||
                    "",

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

      catch (error) {

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

}
