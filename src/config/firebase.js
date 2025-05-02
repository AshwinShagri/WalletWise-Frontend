import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCLIXRAiJ7fmodh2MDKRrdhGDpluuOXBzM",
    authDomain: "expense-tracker-9a4a0.firebaseapp.com",
    projectId: "expense-tracker-9a4a0",
    storageBucket: "expense-tracker-9a4a0.firebasestorage.app",
    messagingSenderId: "659873820157",
    appId: "1:659873820157:web:7301ea5f3d43df9b83fd94"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
console.log("🔥 Firebase Initialized:", app);
setPersistence(auth, browserLocalPersistence);

export { auth, provider, db };












