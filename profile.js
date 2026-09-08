// =====================================================
// PROFILE.JS
// =====================================================

import {
  auth,
  db
} from "./firebase.js";

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
  document.querySelector(".level");

const logoutBtn =
  document.querySelector(".logout-btn");

const achievementSection =
  document.querySelector(".achievement-section");

const achievementList =
  document.getElementById("achievementList");


// =====================================================
// EDIT PROFILE
// =====================================================

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

const closeEditProfile =
  document.getElementById("closeEditProfile");


// =====================================================
// CONTACT
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
// THEME
// =====================================================

const themesBtn =
  document.getElementById("themesBtn");

const themeModal =
  document.getElementById("themeModal");

const closeTheme =
  document.getElementById("closeTheme");

const themeOptions =
  document.querySelectorAll(".theme-option");


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let currentPhotoURL =
  "default-avatar.png";

let selectedPhotoFile = null;


// =====================================================
// DATE KEY
// =====================================================

function getDateKey(date) {

  const d =
    new Date(date);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {

    return null;

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
// LOCAL GAMES
// =====================================================

function getLocalGames() {

  const games = {};

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
        !quiz ||
        typeof quiz !== "object"
      ) {

        continue;

      }

      const puzzleKey =
        key.substring(5);

      games[puzzleKey] =
        quiz;

    }

    catch (error) {

      console.warn(
        "Invalid local quiz:",
        key
      );

    }

  }

  return games;

}


// =====================================================
// MERGE GAMES
//
// Firestore = main source
// LocalStorage = backup
//
// Same puzzle counted only once.
// =====================================================

function mergeGames(
  firestoreHistory
) {

  const games = {};

  const history =
    firestoreHistory &&
    typeof firestoreHistory === "object"
      ? firestoreHistory
      : {};

  Object.keys(history).forEach(
    (key) => {

      const game =
        history[key];

      if (
        game &&
        typeof game === "object"
      ) {

        games[key] =
          game;

      }

    }
  );


  const localGames =
    getLocalGames();

  Object.keys(localGames).forEach(
    (key) => {

      if (
        !games[key]
      ) {

        games[key] =
          localGames[key];

      }

    }
  );


  return games;

}


// =====================================================
// COMPLETED GAME
// =====================================================

function isCompletedGame(
  game
) {

  if (
    !game ||
    typeof game !== "object"
  ) {

    return false;

  }

  const hasPlayedFlag =
    game.played === true ||
    game.attempted === true;

  const hasResult =
    game.correct === true ||
    game.correct === false;

  return (
    hasPlayedFlag &&
    hasResult
  );

}


// =====================================================
// TOTAL SCORE
//
// Every completed puzzle score is added.
// =====================================================

function calculateTotalScore(
  allGames
) {

  let totalScore = 0;

  Object.values(
    allGames
  ).forEach(
    (game) => {

      if (
        !isCompletedGame(game)
      ) {

        return;

      }

      const gameScore =
        Number(
          game.score || 0
        );

      if (
        Number.isFinite(
          gameScore
        )
      ) {

        totalScore +=
          gameScore;

      }

    }
  );

  return totalScore;

}


// =====================================================
// GAME STATS
//
// Total = Won + Lost
// =====================================================

function calculateGameStats(
  firestoreHistory
) {

  const allGames =
    mergeGames(
      firestoreHistory
    );

  let totalGames = 0;
  let gamesWon = 0;
  let gamesLost = 0;

  Object.values(
    allGames
  ).forEach(
    (game) => {

      if (
        !isCompletedGame(game)
      ) {

        return;

      }

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
  );


  totalGames =
    gamesWon +
    gamesLost;


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
// Streak uses playedAt.
// Puzzle date is ignored.
// =====================================================

function getActualPlayDates(
  allGames
) {

  const playedDates =
    new Set();

  Object.values(
    allGames
  ).forEach(
    (game) => {

      if (
        !isCompletedGame(game)
      ) {

        return;

      }

      if (
        !game.playedAt
      ) {

        return;

      }

      const date =
        new Date(
          game.playedAt
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return;

      }

      const key =
        getDateKey(
          date
        );

      if (key) {

        playedDates.add(
          key
        );

      }

    }
  );

  return playedDates;

}


// =====================================================
// STREAKS
// =====================================================

function calculateStreaks(
  playedDates
) {

  if (
    !playedDates ||
    playedDates.size === 0
  ) {

    return {
      currentStreak: 0,
      bestStreak: 0
    };

  }


  const dates =
    Array.from(
      playedDates
    ).sort();


  // ===================================================
  // BEST STREAK
  // ===================================================

  let bestStreak = 1;
  let runningStreak = 1;


  for (
    let i = 1;
    i < dates.length;
    i++
  ) {

    const previous =
      new Date(
        dates[i - 1] +
        "T00:00:00"
      );

    const current =
      new Date(
        dates[i] +
        "T00:00:00"
      );

    const difference =
      Math.round(
        (
          current.getTime() -
          previous.getTime()
        ) /
        86400000
      );


    if (
      difference === 1
    ) {

      runningStreak++;

      bestStreak =
        Math.max(
          bestStreak,
          runningStreak
        );

    }

    else {

      runningStreak = 1;

    }

  }


  // ===================================================
  // CURRENT STREAK
  // ===================================================

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const todayKey =
    getDateKey(
      today
    );


  const yesterday =
    new Date(
      today
    );

  yesterday.setDate(
    yesterday.getDate() - 1
  );


  const yesterdayKey =
    getDateKey(
      yesterday
    );


  let startDate = null;


  if (
    playedDates.has(
      todayKey
    )
  ) {

    startDate =
      today;

  }

  else if (
    playedDates.has(
      yesterdayKey
    )
  ) {

    startDate =
      yesterday;

  }

  else {

    return {

      currentStreak: 0,

      bestStreak

    };

  }


  let currentStreak = 0;


  const checkDate =
    new Date(
      startDate
    );


  while (true) {

    const key =
      getDateKey(
        checkDate
      );


    if (
      !playedDates.has(key)
    ) {

      break;

    }


    currentStreak++;


    checkDate.setDate(
      checkDate.getDate() - 1
    );

  }


  return {

    currentStreak,

    bestStreak

  };

}


// =====================================================
// LOAD STATS
// =====================================================

async function loadStats(
  data
) {

  const history =
    data.history || {};


  // ===================================================
  // ALL GAMES
  // ===================================================

  const allGames =
    mergeGames(
      history
    );


  // ===================================================
  // TOTAL SCORE
  // ===================================================

  const totalScore =
    calculateTotalScore(
      allGames
    );


  // ===================================================
  // GAME STATS
  // ===================================================

  const gameStats =
    calculateGameStats(
      history
    );


  // ===================================================
  // PLAY DATES
  // ===================================================

  const playedDates =
    getActualPlayDates(
      allGames
    );


  // ===================================================
  // STREAK
  // ===================================================

  const streakData =
    calculateStreaks(
      playedDates
    );


  // ===================================================
  // SCREEN
  // ===================================================

  if (score) {

    score.textContent =
      totalScore;

  }


  if (streak) {

    streak.textContent =
      streakData.currentStreak;

  }


  if (accuracy) {

    accuracy.textContent =
      gameStats.winRate +
      "%";

  }


  if (played) {

    played.textContent =
      gameStats.totalGames;

  }


  // ===================================================
  // UNLIMITED LEVEL
  //
  // 0-99    = Level 1
  // 100-199 = Level 2
  // 200-299 = Level 3
  // 300-399 = Level 4
  // ...
  //
  // Every 100 points = +1 level.
  // ===================================================

  if (level) {

    const currentLevel =
      Math.floor(
        totalScore / 100
      ) + 1;


    level.textContent =
      "⭐ Level " +
      currentLevel;

  }


  // ===================================================
  // SAVE CALCULATED VALUES
  // ===================================================

  if (currentUser) {

    try {

      await setDoc(

        doc(
          db,
          "users",
          currentUser.uid
        ),

        {

          totalScore:
            totalScore,

          currentStreak:
            streakData.currentStreak,

          bestStreak:
            streakData.bestStreak

        },

        {
          merge: true
        }

      );

    }

    catch (error) {

      console.warn(
        "Could not update profile stats:",
        error
      );

    }

  }


  // ===================================================
  // LOCAL BACKUP
  // ===================================================

  localStorage.setItem(

    "profileProgress",

    JSON.stringify({

      score:
        totalScore,

      streak:
        streakData.currentStreak,

      accuracy:
        gameStats.winRate,

      played:
        gameStats.totalGames,

      won:
        gameStats.gamesWon,

      lost:
        gameStats.gamesLost

    })

  );


  // ===================================================
  // ACHIEVEMENTS
  // ===================================================

  renderAchievements({

    totalScore:
      totalScore,

    currentStreak:
      streakData.currentStreak,

    puzzlesPlayed:
      gameStats.totalGames,

    winRate:
      gameStats.winRate

  });


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "PROFILE STATS",
    {

      totalScore:
        totalScore,

      currentStreak:
        streakData.currentStreak,

      bestStreak:
        streakData.bestStreak,

      totalGames:
        gameStats.totalGames,

      gamesWon:
        gameStats.gamesWon,

      gamesLost:
        gameStats.gamesLost,

      winRate:
        gameStats.winRate,

      playedDates:
        Array.from(
          playedDates
        ),

      allGames:
        allGames

    }
  );

}


// =====================================================
// ACHIEVEMENTS
// =====================================================

function renderAchievements(
  stats
) {

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


  if (
    achievementList
  ) {

    achievementList.innerHTML =
      html;

  }

}


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile(
  user
) {

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


  if (username) {

    username.textContent =
      savedUsername;

  }


  if (editUsername) {

    editUsername.value =
      savedUsername;

  }


  // ===================================================
  // EMAIL
  // ===================================================

  if (email) {

    email.textContent =
      data.email ||
      user.email ||
      "";

  }


  // ===================================================
  // PHOTO
  // ===================================================

  currentPhotoURL =
    data.photoURL ||
    user.photoURL ||
    "default-avatar.png";


  if (avatar) {

    avatar.src =
      currentPhotoURL;

  }


  if (editPhotoPreview) {

    editPhotoPreview.src =
      currentPhotoURL;

  }


  // ===================================================
  // STATS
  // ===================================================

  await loadStats(
    data
  );

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

      if (username) {

        username.textContent =
          user.displayName ||
          "User";

      }

      if (email) {

        email.textContent =
          user.email ||
          "";

      }

    }

  }
);


// =====================================================
// EDIT PROFILE OPEN
// =====================================================

if (
  editProfileBtn &&
  editProfileModal
) {

  editProfileBtn.addEventListener(
    "click",
    () => {

      if (editUsername) {

        editUsername.value =
          username?.textContent ||
          currentUser?.displayName ||
          "User";

      }


      if (editPhotoPreview) {

        editPhotoPreview.src =
          currentPhotoURL;

      }


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


// =====================================================
// CLOSE EDIT PROFILE
// =====================================================

function closeEditModal() {

  if (
    editProfileModal
  ) {

    editProfileModal.style.display =
      "none";

  }

  selectedPhotoFile =
    null;

}


if (
  cancelProfileBtn
) {

  cancelProfileBtn.addEventListener(
    "click",
    closeEditModal
  );

}


if (
  closeEditProfile
) {

  closeEditProfile.addEventListener(
    "click",
    closeEditModal
  );

}


if (
  editProfileModal
) {

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

}


// =====================================================
// PHOTO SELECT
// =====================================================

if (
  profilePhotoInput
) {

  profilePhotoInput.addEventListener(
    "change",
    () => {

      const file =
        profilePhotoInput.files?.[0];


      if (!file) {

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        alert(
          "Please select an image."
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

          if (
            editPhotoPreview
          ) {

            editPhotoPreview.src =
              event.target.result;

          }

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


// =====================================================
// COMPRESS PHOTO
// =====================================================

function compressImage(
  file
) {

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


              if (
                result.length >
                750000
              ) {

                reject(
                  new Error(
                    "Photo is too large."
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
                  "Could not process image."
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
              "Could not read image."
            )
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


// =====================================================
// SAVE PROFILE
// =====================================================

if (
  saveProfileBtn
) {

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
        editUsername?.value.trim();


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

          newPhotoURL =
            await compressImage(
              selectedPhotoFile
            );

        }


        await setDoc(

          userRef,

          {

            uid:
              currentUser.uid,

            username:
              newUsername,

            email:
              currentUser.email ||
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


        if (username) {

          username.textContent =
            newUsername;

        }


        if (avatar) {

          avatar.src =
            newPhotoURL;

        }


        if (editPhotoPreview) {

          editPhotoPreview.src =
            newPhotoURL;

        }


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

}


// =====================================================
// LOGOUT
// =====================================================

if (
  logoutBtn
) {

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

}


// =====================================================
// THEME
// =====================================================

function applyTheme(
  theme
) {

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


function updateThemeSelection() {

  const currentTheme =
    localStorage.getItem(
      "theme"
    ) || "default";


  themeOptions.forEach(
    (option) => {

      option.classList.remove(
        "active"
      );


      const tick =
        option.querySelector(
          ".tick"
        );


      if (tick) {

        tick.textContent =
          "";

      }


      if (
        option.dataset.theme ===
        currentTheme
      ) {

        option.classList.add(
          "active"
        );


        if (tick) {

          tick.textContent =
            "✓";

        }

      }

    }
  );

}


if (
  themesBtn &&
  themeModal
) {

  themesBtn.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      themeModal.style.display =
        "flex";

    }
  );

}


if (
  closeTheme &&
  themeModal
) {

  closeTheme.addEventListener(
    "click",
    () => {

      themeModal.style.display =
        "none";

    }
  );

}


if (
  themeModal
) {

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

}


themeOptions.forEach(
  (option) => {

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


applyTheme(
  localStorage.getItem(
    "theme"
  ) || "default"
);


updateThemeSelection();


// =====================================================
// CONTACT
// =====================================================

if (
  contactUsBtn &&
  contactModal
) {

  contactUsBtn.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      contactModal.style.display =
        "flex";

      if (
        contactStatus
      ) {

        contactStatus.textContent =
          "";

      }

    }
  );

}


if (
  closeContact &&
  contactModal
) {

  closeContact.addEventListener(
    "click",
    () => {

      contactModal.style.display =
        "none";

    }
  );

}


if (
  contactModal
) {

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

}


// =====================================================
// CONTACT FORM
// =====================================================

if (
  contactForm &&
  sendContactBtn
) {

  contactForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const formData =
        new FormData(
          contactForm
        );


      const messageType =
        formData.get(
          "type"
        ) ||
        "General";


      const message =
        formData.get(
          "message"
        ) ||
        "";


      sendContactBtn.disabled =
        true;


      sendContactBtn.textContent =
        "Sending...";


      try {

        const response =
          await fetch(

            "https://formsubmit.co/ajax/temanlyob@gmail.com",

            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

                "Accept":
                  "application/json"

              },

              body:
                JSON.stringify({

                  name:
                    username?.textContent ||
                    currentUser?.displayName ||
                    "User",

                  email:
                    currentUser?.email ||
                    "",

                  type:
                    messageType,

                  message:
                    message,

                  _subject:
                    "Temanlyob - " +
                    messageType,

                  _replyto:
                    currentUser?.email ||
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

          if (
            contactStatus
          ) {

            contactStatus.textContent =
              "✅ Message sent successfully!";

            contactStatus.style.color =
              "#22c55e";

          }


          contactForm.reset();


          setTimeout(
            () => {

              contactModal.style.display =
                "none";


              if (
                contactStatus
              ) {

                contactStatus.textContent =
                  "";

              }

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


        if (
          contactStatus
        ) {

          contactStatus.textContent =
            "❌ Message send nahi hua. Please try again.";

          contactStatus.style.color =
            "#ef4444";

        }

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
