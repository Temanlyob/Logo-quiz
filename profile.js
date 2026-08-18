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
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

console.log("PROFILE PAGE LOADED");


// =============================
// ELEMENTS
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
  document.getElementById("logoutBtn");

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


// =============================
// VARIABLES
// =============================

let currentUser = null;

let selectedPhotoURL =
  "default-avatar.png";

let selectedPhotoFile =
  null;


// =============================
// COMPRESS PROFILE PHOTO
// =============================

function compressProfilePhoto(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        (event) => {

          const img =
            new Image();

          img.onload =
            () => {

              const MAX_SIZE =
                600;

              let width =
                img.width;

              let height =
                img.height;


              if (
                width > height
              ) {

                if (
                  width > MAX_SIZE
                ) {

                  height =
                    height *
                    (
                      MAX_SIZE /
                      width
                    );

                  width =
                    MAX_SIZE;

                }

              } else {

                if (
                  height > MAX_SIZE
                ) {

                  width =
                    width *
                    (
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
                Math.round(width);

              canvas.height =
                Math.round(height);


              const ctx =
                canvas.getContext(
                  "2d"
                );


              ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
              );


              canvas.toBlob(
                (blob) => {

                  if (!blob) {

                    reject(
                      new Error(
                        "Photo compression failed."
                      )
                    );

                    return;

                  }


                  resolve(blob);

                },
                "image/jpeg",
                0.80
              );

            };


          img.onerror =
            () => {

              reject(
                new Error(
                  "Invalid image."
                )
              );

            };


          img.src =
            event.target.result;

        };


      reader.onerror =
        () => {

          reject(
            new Error(
              "Unable to read image."
            )
          );

        };


      reader.readAsDataURL(file);

    }
  );

}


// =============================
// GET FIRESTORE GAME STATS
// =============================

function getGameStats(history) {

  let playedCount = 0;

  let wonCount = 0;

  let lostCount = 0;


  for (
    const key in history
  ) {

    const game =
      history[key];


    if (
      !game ||
      game.played !== true
    ) {

      continue;

    }


    playedCount++;


    if (
      game.correct === true
    ) {

      wonCount++;

    } else {

      lostCount++;

    }

  }


  const winRate =
    playedCount === 0
      ? 0
      : Math.round(
          (
            wonCount /
            playedCount
          ) * 100
        );


  return {

    played:
      playedCount,

    won:
      wonCount,

    lost:
      lostCount,

    winRate:
      winRate

  };

}


// =============================
// ACHIEVEMENTS
// =============================

function updateAchievements(
  puzzlesPlayed,
  currentStreak,
  totalScore,
  winRate
) {

  if (!achievementSection) {

    return;

  }


  let html = "";


  // First puzzle

  if (
    puzzlesPlayed >= 1
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


  // 7 day streak

  if (
    currentStreak >= 7
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


  // 100 points

  if (
    totalScore >= 100
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


  // 30 puzzles

  if (
    puzzlesPlayed >= 30
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


  // Accuracy master

  if (
    winRate === 100 &&
    puzzlesPlayed >= 10
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


  // No achievements

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


  achievementSection.innerHTML =
    "<h2>Achievements</h2>" +
    html;

}


// =============================
// LEVEL
// =============================

function updateLevel(totalScore) {

  if (!level) {

    return;

  }


  let levelText =
    "⭐ Level 1";


  if (
    totalScore >= 1000
  ) {

    levelText =
      "👑 Level 5";

  } else if (
    totalScore >= 500
  ) {

    levelText =
      "💎 Level 4";

  } else if (
    totalScore >= 250
  ) {

    levelText =
      "🥇 Level 3";

  } else if (
    totalScore >= 100
  ) {

    levelText =
      "🥈 Level 2";

  }


  level.textContent =
    levelText;

}


// =============================
// LOAD PROFILE
// =============================

async function loadProfile(user) {

  const userRef =
    doc(
      db,
      "users",
      user.uid
    );


  const snap =
    await getDoc(
      userRef
    );


  if (!snap.exists()) {

    username.textContent =
      user.displayName ||
      "User";

    email.textContent =
      user.email ||
      "";

    avatar.src =
      user.photoURL ||
      "default-avatar.png";


    selectedPhotoURL =
      user.photoURL ||
      "default-avatar.png";


    editUsername.value =
      user.displayName ||
      "User";


    editPhotoPreview.src =
      selectedPhotoURL;


    score.textContent =
      "0";

    streak.textContent =
      "0";

    accuracy.textContent =
      "0%";

    played.textContent =
      "0";


    updateLevel(0);

    updateAchievements(
      0,
      0,
      0,
      0
    );

    return;

  }


  const data =
    snap.data();


  // =============================
  // PROFILE DATA
  // =============================

  username.textContent =
    data.username ||
    user.displayName ||
    "User";


  email.textContent =
    data.email ||
    user.email ||
    "";


  const savedPhotoURL =
    data.photoURL ||
    user.photoURL ||
    "default-avatar.png";


  avatar.src =
    savedPhotoURL;


  selectedPhotoURL =
    savedPhotoURL;


  editUsername.value =
    data.username ||
    user.displayName ||
    "User";


  editPhotoPreview.src =
    savedPhotoURL;


  // =============================
  // FIRESTORE HISTORY
  // =============================

  const history =
    data.history || {};


  // =============================
  // REAL GAME STATS
  // =============================

  const stats =
    getGameStats(history);


  const puzzlesPlayed =
    stats.played;


  const gamesWon =
    stats.won;


  const gamesLost =
    stats.lost;


  const winRate =
    stats.winRate;


  // =============================
  // SCORE
  // =============================

  const totalScore =
    Number(
      data.totalScore ?? 0
    );


  // =============================
  // STREAK
  // =============================

  const currentStreak =
    Number(
      data.currentStreak ?? 0
    );


  // =============================
  // UPDATE STATS UI
  // =============================

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
  // =============================

  updateLevel(
    totalScore
  );


  // =============================
  // ACHIEVEMENTS
  // =============================

  updateAchievements(
    puzzlesPlayed,
    currentStreak,
    totalScore,
    winRate
  );


  // =============================
  // DEBUG
  // =============================

  console.log(
    "PROFILE STATS",
    {
      totalScore:
        totalScore,

      currentStreak:
        currentStreak,

      puzzlesPlayed:
        puzzlesPlayed,

      gamesWon:
        gamesWon,

      gamesLost:
        gamesLost,

      winRate:
        winRate
    }
  );

}


// =============================
// FIREBASE AUTH
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


    currentUser =
      user;


    try {

      await loadProfile(
        user
      );

    } catch (error) {

      console.error(
        "PROFILE LOAD ERROR:",
        error
      );

    }

  }
);


// =============================
// LOGOUT
// =============================

if (logoutBtn) {

  logoutBtn.onclick =
    async () => {

      try {

        await signOut(
          auth
        );

        window.location.replace(
          "login.html"
        );

      } catch (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );

      }

    };

}


// =============================
// THEME POPUP
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


if (themesBtn) {

  themesBtn.addEventListener(
    "click",
    (e) => {

      e.preventDefault();

      themeModal.style.display =
        "flex";

    }
  );

}


if (closeTheme) {

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
    (e) => {

      if (
        e.target ===
        themeModal
      ) {

        themeModal.style.display =
          "none";

      }

    }
  );

}


// =============================
// THEME SELECTION
// =============================

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

    } else {

      document.body.classList.add(
        "theme-light"
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


      const previewURL =
        URL.createObjectURL(
          file
        );


      editPhotoPreview.src =
        previewURL;

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

      selectedPhotoFile =
        null;


      if (profilePhotoInput) {

        profilePhotoInput.value =
          "";

      }


      editPhotoPreview.src =
        selectedPhotoURL;


      editProfileModal.style.display =
        "none";

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

        selectedPhotoFile =
          null;


        if (profilePhotoInput) {

          profilePhotoInput.value =
            "";

        }


        editPhotoPreview.src =
          selectedPhotoURL;


        editProfileModal.style.display =
          "none";

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


      const fileToUpload =
        selectedPhotoFile;


      const oldPhotoURL =
        selectedPhotoURL;


      try {

        saveProfileBtn.disabled =
          true;

        saveProfileBtn.textContent =
          "Saving...";


        let finalPhotoURL =
          oldPhotoURL ||
          "default-avatar.png";


        // =========================
        // UPLOAD PHOTO
        // =========================

        if (fileToUpload) {

          const compressedPhoto =
            await compressProfilePhoto(
              fileToUpload
            );


          const photoPath =
            "profilePhotos/" +
            currentUser.uid +
            "/profile_" +
            Date.now() +
            ".jpg";


          const photoRef =
            ref(
              storage,
              photoPath
            );


          await uploadBytes(
            photoRef,
            compressedPhoto,
            {
              contentType:
                "image/jpeg"
            }
          );


          finalPhotoURL =
            await getDownloadURL(
              photoRef
            );

        }


        // =========================
        // SAVE FIRESTORE
        // =========================

        const userRef =
          doc(
            db,
            "users",
            currentUser.uid
          );


        await setDoc(
          userRef,
          {

            username:
              newUsername,

            photoURL:
              finalPhotoURL

          },
          {
            merge:
              true
          }
        );


        // =========================
        // UPDATE UI
        // =========================

        username.textContent =
          newUsername;


        avatar.src =
          finalPhotoURL;


        editPhotoPreview.src =
          finalPhotoURL;


        editUsername.value =
          newUsername;


        selectedPhotoURL =
          finalPhotoURL;


        selectedPhotoFile =
          null;


        if (profilePhotoInput) {

          profilePhotoInput.value =
            "";

        }


        // =========================
        // CLOSE MODAL
        // =========================

        editProfileModal.style.display =
          "none";


        alert(
          "Profile updated successfully!"
        );


        console.log(
          "PROFILE SAVED SUCCESSFULLY"
        );


      } catch (error) {

        console.error(
          "PROFILE UPDATE ERROR:",
          error
        );


        // Restore previous saved state

        username.textContent =
          username.textContent;


        avatar.src =
          oldPhotoURL;


        editPhotoPreview.src =
          oldPhotoURL;


        alert(
          "Failed to save profile: " +
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

}
