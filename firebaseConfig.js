import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, onValue, set } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyBeg5sot6EJWp9NpEFrllEK1YJ9lZlGKdI",
//   authDomain: "battleship-dd5eb.firebaseapp.com",
//   projectId: "battleship-dd5eb",
//   storageBucket: "battleship-dd5eb.firebasestorage.app",
//   messagingSenderId: "611534322110",
//   appId: "1:611534322110:web:07234ee97afada294f61ef",
//   measurementId: "G-1TLK27C94J"
// };
const firebaseConfig = {
  apiKey: "AIzaSyD4x1iN0TiNqQXaAUdRcNaXyGO_TtM6v6U",
  authDomain: "battleship-arvr.firebaseapp.com",
  projectId: "battleship-arvr",
  storageBucket: "battleship-arvr.firebasestorage.app",
  messagingSenderId: "261166896789",
  appId: "1:261166896789:web:57b63b7c84e9c868706d9c",
  measurementId: "G-YENFN0VEZD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Anonymous sign-in for Firebase auth
signInAnonymously(auth).catch(error => {
  console.error("Error during anonymous sign-in:", error);
});

export { database };