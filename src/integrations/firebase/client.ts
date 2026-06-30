import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyARnsIGLcbLkr02d8FWGfoqpO7yKQIAcBs",
  authDomain: "tvstreamz-chat.firebaseapp.com",
  projectId: "tvstreamz-chat",
  storageBucket: "tvstreamz-chat.firebasestorage.app",
  messagingSenderId: "644064222842",
  appId: "1:644064222842:web:f2680f75abccf4634825c3",
  measurementId: "G-70JRSWQKHN",
  // We manually add the typical DB URL because it might be missing if they didn't create the DB yet
  databaseURL: "https://tvstreamz-chat-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
