import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB_o8TfJ55bHOltowf9zAN5B30FEzViJ8Q",
    authDomain: "nivaro-health.firebaseapp.com",
    projectId: "nivaro-health",
    storageBucket: "nivaro-health.firebasestorage.app",
    messagingSenderId: "735932981053",
    appId: "1:735932981053:web:c5e13ac6d9d9e75b956f54",
    measurementId: "G-5RGTCMRNJX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
