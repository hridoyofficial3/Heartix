import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDMJMggVKtyP6c9qtb7rYE_3jh01l4me4w",
    authDomain: "heartix.firebaseapp.com",
    projectId: "heartix",
    storageBucket: "heartix.firebasestorage.app",
    messagingSenderId: "551204402338",
    appId: "1:551204402338:web:169555975c0bbb97f113fb"
};

let app, db, auth;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (e) {
    console.error('Firebase init error:', e);
}

export { db, auth };