import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

// Config from your working project
const firebaseConfig = {
  apiKey: "AIzaSyDfGy_52aRfYAG8RodPHtkmWQwZLSLrYDU",
  authDomain: "beezna-e99b5.firebaseapp.com",
  projectId: "beezna-e99b5",
  storageBucket: "beezna-e99b5.firebasestorage.app",
  messagingSenderId: "79545164118",
  appId: "1:79545164118:web:076e1d379afcd1069836f7",
  measurementId: "G-SNHKN8WN1B"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)