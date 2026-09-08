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
// EDIT PROFILE ELEMENTS
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

  if (editUsername) {

    editUsername.value =
      savedUsername;
  }


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

  if (editPhotoPreview) {

    editPhotoPreview.src =
      currentPhotoURL;
  }


  // ===================================================
  // STATS
  // ===================================================

  await loadStats(data);

}


// =====================================================
// GET LOCAL GAMES
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

      const puzzleKey =
        key.substring(5);

      games[puzzleKey] =
        quiz;

    } catch (error) {

      console.warn(
        "Invalid local quiz:",
        key
      );
    }
  }

  return games;
}


// =====================================================
// MERGE ALL GAMES
//
// Firestore history = main source
// localStorage = backup for unsynced games
//
// Same puzzle is counted only once.
// =====================================================

function mergeGames(firestoreHistory) {

  const games = {};

  const history =
    firestoreHistory &&
    typeof firestoreHistory === "object"
      ? firestoreHistory
      : {};

  // Firestore first
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


  // LocalStorage only fills missing games
  const localGames =
    getLocalGames();

  Object.keys(localGames).forEach(
    (key) => {

      if (!games[key]) {

        games[key] =
          localGames[key];
      }

    }
  );


  return games;
}


// =====================================================
// CHECK COMPLETED GAME
//
// A game is completed only when
// correct is explicitly true OR false.
//
// This prevents unfinished games from
// increasing Total Games.
// =====================================================

function isCompletedGame(game) {

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
// CALCULATE GAME STATS
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

  const playedDates =
    new Set();


  Object.keys(allGames).forEach(
    (key) => {

      const game =
        allGames[key];

      if (
        !isCompletedGame(game)
      ) {

        return;
      }


      // ===============================================
      // TOTAL
      // ===============================================

      totalGames++;


      // ===============================================
      // WON / LOST
      // ===============================================

      if (
        game.correct === true
      ) {

        gamesWon++;

      } else if (
        game.correct === false
      ) {

        gamesLost++;
      }


      // ===============================================
      // ACTUAL PLAY DATE
      //
      // Streak uses playedAt,
      // NOT puzzle date.
      // ===============================================

      if (
        game.playedAt
      ) {

        const date =
          new Date(
            game.playedAt
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {

          playedDates.add(
            getDateKey(date)
          );
        }

      }

    }
  );


  // Safety:
  // Total Games must always equal Won + Lost

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


  const streakData =
    calculateStreaks(
      playedDates
    );


  return {

    totalGames:
      totalGames,

    gamesWon:
      gamesWon,

    gamesLost:
      gamesLost,

    winRate:
      winRate,

    currentStreak:
      streakData.currentStreak,

    bestStreak:
      streakData.bestStreak

  };
}


// =====================================================
// DATE KEY
// =====================================================

function getDateKey(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return (
    year +
    "-" +
    month +
    "-" +
    day
  );
}


// =====================================================
// STREAK CALCULATION
//
// Based ONLY on actual played dates.
// Puzzle date is ignored.
//
// Multiple games on same day = one streak day.
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


  // ===============================================
  // BEST STREAK
  // ===============================================

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

    } else {

      runningStreak = 1;
    }

  }


  // ===============================================
  // CURRENT STREAK
  //
  // If today is played:
  // count backwards from today.
  //
  // If today isn't played:
  // yesterday can still remain active.
  // ===============================================

  const today =
    new Date();

  const todayKey =
    getDateKey(today);

  const yesterday =
    new Date(today);

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const yesterdayKey =
    getDateKey(yesterday);


  let startDate = null;


  if (
    playedDates.has(todayKey)
  ) {

    startDate =
      today;

  } else if (
    playedDates.has(yesterdayKey)
  ) {

    startDate =
      yesterday;

  } else {

    return {
      currentStreak: 0,
      bestStreak: bestStreak
    };
  }


  let currentStreak = 0;

  const checkDate =
    new Date(startDate);


  while (true) {

    const key =
      getDateKey(checkDate);

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

    currentStreak:
      currentStreak,

    bestStreak:
      bestStreak

  };
}


// =====================================================
// LOAD STATS
// =====================================================

async function loadStats(data) {

  const totalScore =
    Number(
      data.totalScore || 0
    );


  const gameStats =
    calculateGameStats(
      data.history || {}
    );


  // ===============================================
  // SCREEN
  // ===============================================

  score.textContent =
    totalScore;

  streak.textContent =
    gameStats.currentStreak;

  accuracy.textContent =
    gameStats.winRate + "%";

  played.textContent =
    gameStats.totalGames;


  // ===============================================
  // SAVE CORRECT STREAK BACK TO FIRESTORE
  // ===============================================

  if (
    currentUser &&
    (
      Number(data.currentStreak || 0) !==
      gameStats.currentStreak ||
      Number(data.bestStreak || 0) !==
      gameStats.bestStreak
    )
  ) {

    try {

      await setDoc(

        doc(
          db,
          "users",
          currentUser.uid
        ),

        {

          currentStreak:
            gameStats.currentStreak,

          bestStreak:
            gameStats.bestStreak

        },

        {
          merge: true
        }

      );

    } catch (error) {

      console.warn(
        "Could not update streak:",
        error
      );
    }

  }


  // ===============================================
  // LOCAL BACKUP
  // ===============================================

  localStorage.setItem(

    "profileProgress",

    JSON.stringify({

      score:
        totalScore,

      streak:
        gameStats.currentStreak,

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


  // ===============================================
  // LEVEL
  // ===============================================

  if (
    totalScore >= 1000
  ) {

    level.textContent =
      "👑 Level 5";

  } else if (
    totalScore >= 500
  ) {

    level.textContent =
      "💎 Level 4";

  } else if (
    totalScore >= 250
  ) {

    level.textContent =
      "🥇 Level 3";

  } else if (
    totalScore >= 100
  ) {

    level.textContent =
      "🥈 Level 2";

  } else {

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
      gameStats.currentStreak,

    puzzlesPlayed:
      gameStats.totalGames,

    winRate:
      gameStats.winRate

  });


  console.log(
    "PROFILE STATS",
    gameStats
  );

}


// =====================================================
// ACHIEVEMENTS
// =====================================================

function renderAchievements(stats) {

  let html = "";


  if (
    stats.puzzlesPlayed >= 1
  ) {

    html += `
      <div class="achievement-item">
        <span>🥇</span>
        <div>
          <h3>Logo Rookie</h3>
          <p>Completed your first puzzle.</p>
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
          <p>Solved puzzles for 7 consecutive days.</p>
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
          <p>Earned 100+ points.</p>
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
          <p>Played 30 puzzles.</p>
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
          <p>100% accuracy in 10 puzzles.</p>
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
          <p>Keep playing to unlock achievements.</p>
        </div>
      </div>
    `;
  }


  if (achievementList) {

    achievementList.innerHTML =
      html;

  } else if (achievementSection) {

    achievementSection.innerHTML =
      "<h2>Achievements</h2>" +
      html;

  }

}


// =====================================================
// EDIT PROFILE
// =====================================================

if (editProfileBtn) {

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

}


// =====================================================
// CLOSE EDIT MODAL
// =====================================================

function closeEditModal() {

  if (!editProfileModal) {
    return;
  }

  editProfileModal.style.display =
    "none";

  editProfileModal.setAttribute(
    "aria-hidden",
    "true"
  );

  selectedPhotoFile =
    null;

  if (profilePhotoInput) {

    profilePhotoInput.value =
      "";
  }

}


if (cancelProfileBtn) {

  cancelProfileBtn.addEventListener(
    "click",
    closeEditModal
  );
}


if (closeEditProfile) {

  closeEditProfile.addEventListener(
    "click",
    closeEditModal
  );
}


if (editProfileModal) {

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
// SELECT PHOTO
// =====================================================

if (profilePhotoInput) {

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

}


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

              let width =
                image.width;

              let height =
                image.height;


              const maxSize =
                600;


              if (
                width > maxSize ||
                height > maxSize
              ) {

                if (
                  width > height
                ) {

                  height =
                    Math.round(
                      height *
                      maxSize /
                      width
                    );

                  width =
                    maxSize;

                } else {

                  width =
                    Math.round(
                      width *
                      maxSize /
                      height
                    );

                  height =
                    maxSize;
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
                result.length > 750000
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

if (saveProfileBtn) {

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

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

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

}


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


if (themesBtn && themeModal) {

  themesBtn.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      themeModal.style.display =
        "flex";

    }
  );

}


if (closeTheme && themeModal) {

  closeTheme.addEventListener(
    "click",
    () => {

      themeModal.style.display =
        "none";

    }
  );

}


if (themeModal) {

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


updateThemeSelection();

applyTheme(
  localStorage.getItem(
    "theme"
  ) || "default"
);


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


// =====================================================
// CONTACT US
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

      if (contactStatus) {

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


if (contactModal) {

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


if (
  contactForm &&
  sendContactBtn
) {

  contactForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      sendContactBtn.disabled =
        true;

      sendContactBtn.textContent =
        "Sending...";

      try {

        if (contactStatus) {

          contactStatus.textContent =
            "Message sent successfully.";

        }

        contactForm.reset();

      } catch (error) {

        console.error(
          "CONTACT ERROR:",
          error
        );

        if (contactStatus) {

          contactStatus.textContent =
            "Failed to send message.";
        }

      } finally {

        sendContactBtn.disabled =
          false;

        sendContactBtn.textContent =
          "Send";

      }

    }
  );

}
