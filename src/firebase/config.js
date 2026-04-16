// ============================================================
//  STEP 1: Go to https://console.firebase.google.com
//  STEP 2: Create a project → Add web app → Copy config below
//  STEP 3: Enable Firestore + Google Auth in Firebase console
// ============================================================

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDYDkvnB0PFj15OY6Z5ygkp9skXFFlXDto",
  authDomain: "gigs-nest.firebaseapp.com",
  projectId: "gigs-nest",
  storageBucket: "gigs-nest.firebasestorage.app",
  messagingSenderId: "725140231653",
  appId: "1:725140231653:web:14189a87549aa497914b0c"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
