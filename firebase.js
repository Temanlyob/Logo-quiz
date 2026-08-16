// =====================================
// FIREBASE APP
// =====================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


// =====================================
// FIREBASE AUTH
// =====================================

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =====================================
// FIRESTORE
// =====================================

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// FIREBASE STORAGE
// =====================================

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


// =====================================
// FIREBASE CONFIG
// =====================================

const firebaseConfig = {

  apiKey:
    "AIzaSyAxgGaTUiKTOZfy5O2QTr0qa8l6hU9IAk4",

  authDomain:
    "logo-quiz-70b96.firebaseapp.com",

  projectId:
    "logo-quiz-70b96",

  storageBucket:
    "logo-quiz-70b96.firebasestorage.app",

  messagingSenderId:
    "1094236587427",

  appId:
    "1:1094236587427:web:6c598c07491950d8e30616",

  measurementId:
    "G-X6GGK4F48L"

};


// =====================================
// INITIALIZE FIREBASE
// =====================================

const app =
  initializeApp(firebaseConfig);


// =====================================
// AUTH
// =====================================

const auth =
  getAuth(app);


// =====================================
// FIRESTORE
// =====================================

const db =
  getFirestore(app);


// =====================================
// STORAGE
// =====================================

const storage =
  getStorage(app);


// =====================================
// GOOGLE PROVIDER
// =====================================

const googleProvider =
  new GoogleAuthProvider();

googleProvider.setCustomParameters({

  prompt:
    "select_account"

});


// =====================================
// EXPORT
// =====================================

export {

  app,

  auth,

  db,

  storage,

  googleProvider

};
