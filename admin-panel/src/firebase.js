import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBwhQLpuqett_cRJdvzGcR3e3wKRN6CeYs",
  authDomain: "watchmoney-39b2e.firebaseapp.com",
  projectId: "watchmoney-39b2e",
  storageBucket: "watchmoney-39b2e.firebasestorage.app",
  messagingSenderId: "277731188101",
  appId: "1:277731188101:web:69ba333537ba04e90cb8ec",
  measurementId: "G-L0PB6FMHNQ"
};

export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || "LUdX7IDd4fhAHK2JvhLeaLbgQFx1";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
