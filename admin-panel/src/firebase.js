import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// As chaves do Firebase devem ser carregadas a partir de variáveis de ambiente
// para segurança e flexibilidade entre ambientes (dev/prod).
// Crie um arquivo .env na raiz do projeto admin-panel/ e adicione as variáveis.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validação para garantir que as variáveis de ambiente do Firebase foram carregadas.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase config variables not set in .env file. Please create a .env file in the admin-panel root with your Firebase project's configuration.");
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
