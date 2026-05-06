// Firebase Web SDK config (PÚBLICO – seguro de expor no frontend)
// NUNCA inclua serviceAccount.json, Admin SDK ou chaves privadas aqui.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBwhQLpuqett_cRJdvzGcR3e3wKRN6CeYs',
  authDomain: 'watchmoney-39b2e.firebaseapp.com',
  projectId: 'watchmoney-39b2e',
  storageBucket: 'watchmoney-39b2e.firebasestorage.app',
  messagingSenderId: '277731188101',
  appId: '1:277731188101:web:69ba333537ba04e90cb8ec',
  measurementId: 'G-L0PB6FMHNQ',
};

// UID do administrador autorizado a acessar o painel.
// Apenas este UID terá permissão de ler/alterar withdrawRequests pelo painel.
export const ADMIN_UID = 'LUdX7IDd4fhAHK2JvhLeaLbgQFx1';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
