import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDJ7j_wPlavpQkPYzPHO19Yr6UDKqVGGgg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'coreselfai.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'coreselfai',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'coreselfai.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '863148266140',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:863148266140:web:d01e391beebbe79a86d359',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0N0LEGSWK5',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const firebaseProjectId = firebaseConfig.projectId;
