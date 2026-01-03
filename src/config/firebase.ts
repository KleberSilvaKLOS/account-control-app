import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Verifique se não há espaços em branco antes ou depois da chave
  apiKey: "AIzaSyDTy2Fcv1t4jMWgdr8Qrw1oZflTtemGWCQ", 
  authDomain: "myfinance-79f20.firebaseapp.com",
  projectId: "myfinance-79f20",
  storageBucket: "myfinance-79f20.firebasestorage.app",
  messagingSenderId: "1077356751416",
  appId: "1:1077356751416:web:d9ca422304e33619a614cd",
  measurementId: "G-3ESMJKX06K"
};

// Lógica para evitar duplicidade de instância
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);