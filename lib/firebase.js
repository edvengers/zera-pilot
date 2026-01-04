import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqCtCKGfY531lvU1yjUBT-CYc8dNntKqw",
  authDomain: "zera-pilot.firebaseapp.com",
  projectId: "zera-pilot",
  storageBucket: "zera-pilot.firebasestorage.app",
  messagingSenderId: "413960261628",
  appId: "1:413960261628:web:7588f394c70db161a52c79"
};

// Initialize Firebase with singleton pattern to avoid re-initialization during hot-reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
