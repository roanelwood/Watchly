import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBEAD4RghohWtGesQkU0ko5z_5_QAww900",
  authDomain: "watchly-1a689.firebaseapp.com",
  projectId: "watchly-1a689",
  storageBucket: "watchly-1a689.firebasestorage.app",
  messagingSenderId: "959991274362",
  appId: "1:959991274362:web:7817fb714bd6368b0194c3",
  measurementId: "G-EM4QM014K3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  import('firebase/analytics')
    .then(({ getAnalytics }) => {
      try {
        getAnalytics(app);
      } catch {
        // ignore analytics initialization errors
      }
    })
    .catch(() => {
      // ignore import failure
    });
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
