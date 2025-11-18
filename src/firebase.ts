import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBFK_mDjMJYSSdNIAryJRYGOAvVNJnOx1M",
  authDomain: "moto-work.firebaseapp.com",
  projectId: "moto-work",
  storageBucket: "moto-work.firebasestorage.app",
  messagingSenderId: "475345475471",
  appId: "1:475345475471:web:2dc667f6d8a20bb532ddfa",
  measurementId: "G-KHXVRRSPB4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
