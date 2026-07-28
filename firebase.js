// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAxgGaTUiKTOZfy5O2QTr0qa8l6hU9IAk4",
  authDomain: "logo-quiz-70b96.firebaseapp.com",
  projectId: "logo-quiz-70b96",
  storageBucket: "logo-quiz-70b96.firebasestorage.app",
  messagingSenderId: "1094236587427",
  appId: "1:1094236587427:web:6c598c07491950d8e30616",
  measurementId: "G-X6GGK4F48L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Export
export {
  auth,
  db,
  googleProvider
};
