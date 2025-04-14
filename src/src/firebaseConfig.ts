// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ✅ Configuración de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA0j4uqm9rcc0jjk0YKiPg7xgYHA6YT4I0",
    authDomain: "asistencia-ce-english.firebaseapp.com",
    projectId: "asistencia-ce-english",
    storageBucket: "asistencia-ce-english.appspot.com",
    messagingSenderId: "857312263290",
    appId: "1:857312263290:web:8f9cd756cbe9b732178fc3"
};

// ✅ Inicializa la app
const app = initializeApp(firebaseConfig);

// ✅ Conectamos Firestore
const db = getFirestore(app);
const auth = getAuth(app);
// ✅ Exportamos la base de datos
export { db, auth };