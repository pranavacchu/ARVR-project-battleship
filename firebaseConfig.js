// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBeg5sot6EJWp9NpEFrllEK1YJ9lZlGKdI",
  authDomain: "battleship-dd5eb.firebaseapp.com",
  projectId: "battleship-dd5eb",
  storageBucket: "battleship-dd5eb.firebasestorage.app",
  messagingSenderId: "611534322110",
  appId: "1:611534322110:web:07234ee97afada294f61ef",
  measurementId: "G-1TLK27C94J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);