/**
 * Firebase client configuration for lingo-app.ru (project: lingo-production-da31c).
 *
 * All values below are PUBLIC client-side keys — they are designed to be
 * shipped in frontend code. They are NOT service-account credentials.
 *
 * Source: Firebase Console → Project settings → Your apps → Web app.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8tTuZfdRZDOs4wL1gdYJBuhGhR85spWY",
  authDomain: "lingo-production-da31c.firebaseapp.com",
  projectId: "lingo-production-da31c",
  storageBucket: "lingo-production-da31c.firebasestorage.app",
  messagingSenderId: "254327430166",
  appId: "1:254327430166:web:1317ac63b79c56acf62937",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

await setPersistence(auth, browserLocalPersistence);

export { auth, app };
