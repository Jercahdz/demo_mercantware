import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyBY8UWg399ev43Y0CODMu1101CN-L5TnLU",
  authDomain: "mercantware-483a6.firebaseapp.com",
  projectId: "mercantware-483a6",
  storageBucket: "mercantware-483a6.firebasestorage.app",
  messagingSenderId: "451515573840",
  appId: "1:451515573840:web:f681721573ef77411dd355"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const auth = getAuth(app);

signInAnonymously(auth)
  .then(() => console.log('✅ Autenticado en Firebase'))
  .catch((error: any) => console.error('❌ Error de autenticación:', error));