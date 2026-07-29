// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

// Firebase Auth
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Firestore
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase Configuration
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

// Authentication
const auth = getAuth(app);

// Firestore Database
const db = getFirestore(app);

// Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Export
export {
  app,
  auth,
  db,
  googleProvider
};
