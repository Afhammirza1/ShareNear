import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCviN74LLtZdpWcoBlX9tSPZ1PltVGfWNs",
  authDomain: "sharenear-6cb50.firebaseapp.com",
  projectId: "sharenear-6cb50",
  storageBucket: "sharenear-6cb50.firebasestorage.app",
  messagingSenderId: "750512616426",
  appId: "1:750512616426:web:6c9332cdf5aea2fd1ef893",
  measurementId: "G-XWQ1J3DSJS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
