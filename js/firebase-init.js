// Connects the site to Firebase. Other pages import everything from here.

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0SEkvKtgu9MTg9aJ3mOsFFNPRxj1tP9M",
  authDomain: "qr-attendance-for-philcst.firebaseapp.com",
  projectId: "qr-attendance-for-philcst",
  storageBucket: "qr-attendance-for-philcst.firebasestorage.app",
  messagingSenderId: "919349223982",
  appId: "1:919349223982:web:97b23a19207c9e76c835bf"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Re-export the Firebase functions we will use, so pages only import from this file
export {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

export {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";