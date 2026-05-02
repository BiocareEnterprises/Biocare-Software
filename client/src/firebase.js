import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAIS99EG2vyeI5fCDvUbS98xPgiybiLeVc",
    authDomain: "biocare-software.firebaseapp.com",
    projectId: "biocare-software",
    storageBucket: "biocare-software.firebasestorage.app",
    messagingSenderId: "841055638791",
    appId: "1:841055638791:web:2b208c15a76f100f14a1a2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);