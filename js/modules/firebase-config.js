import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDpuX5PR4DBJba1LwdLVDWq0rVaWVbITE",
    authDomain: "itaca-solcuiones.firebaseapp.com",
    projectId: "itaca-solcuiones",
    storageBucket: "itaca-solcuiones.firebasestorage.app",
    messagingSenderId: "159768663614",
    appId: "1:159768663614:web:4cf572b4cf147f7872e36f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs };
