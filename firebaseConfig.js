// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD4x1iN0TiNqQXaAUdRcNaXyGO_TtM6v6U",
  authDomain: "battleship-arvr.firebaseapp.com",
  databaseURL: "https://battleship-arvr-default-rtdb.firebaseio.com", // Add this line
  projectId: "battleship-arvr",
  storageBucket: "battleship-arvr.firebasestorage.app",
  messagingSenderId: "261166896789",
  appId: "1:261166896789:web:57b63b7c84e9c868706d9c",
  measurementId: "G-YENFN0VEZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);


export { database };