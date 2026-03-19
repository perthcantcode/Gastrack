import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDQSBcDTxQgCnT3eaD3L-DyIYGJHwzm4C0",
  authDomain: "gastrack-34972.firebaseapp.com",
  projectId: "gastrack-34972",
  storageBucket: "gastrack-34972.firebasestorage.app",
  messagingSenderId: "1095715752427",
  appId: "1:1095715752427:web:549e9cb60015abe1c331ae",
  measurementId: "G-20SFMELST8"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
