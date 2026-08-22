import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAu8Fp1Y8mBBOeRZfsRV9G1GffOzL8tjtM",
  authDomain: "portal-onboarding-182f0.firebaseapp.com",
  projectId: "portal-onboarding-182f0",
  storageBucket: "portal-onboarding-182f0.firebasestorage.app",
  messagingSenderId: "978904534090",
  appId: "1:978904534090:web:5b028f5e191508a0702ab3",
  measurementId: "G-H8JKEC9GD8"
};

// 1. Inicializamos la App
const app = initializeApp(firebaseConfig);

// 2. Exportamos Firestore (Base de datos) y Storage
export const db = getFirestore(app);
export const storage = getStorage(app);