import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/database';
import 'firebase/compat/storage';
// Remove compat import for functions: import 'firebase/compat/functions';
import { getFunctions } from 'firebase/functions';
import 'firebase/compat/messaging';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgrba11-ZmbE6f3BIYfNc_tKLv32osWuU",
  authDomain: "sakoonapp-9574c.firebaseapp.com",
  databaseURL: "https://sakoonapp-9574c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sakoonapp-9574c",
  storageBucket: "sakoonapp-9574c.appspot.com",
  messagingSenderId: "747287490572",
  appId: "1:747287490572:web:7053dc7758c622498a3e29",
  measurementId: "G-6VD83ZC2HP"
};

const app = firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.firestore();
export const rtdb = firebase.database();
export const storage = firebase.storage();
export const functions = getFunctions(app, 'asia-south1');
export const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

// Uncomment the following lines to use Firebase Emulators in development
/*
if (window.location.hostname === "localhost") {
  auth.useEmulator("http://127.0.0.1:9099");
  db.useEmulator("127.0.0.1", 8080);
  rtdb.useEmulator("127.0.0.1", 9000);
  storage.useEmulator("127.0.0.1", 9199);
  functions.useEmulator("127.0.0.1", 5001);
}
*/