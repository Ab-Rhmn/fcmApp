import { initializeApp } from 'firebase/app'
import {getDatabase, ref, onValue, set} from 'firebase/database';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGZdBVlsRkfsRhnEQz1KHE6Euuqh3Pozo",
  authDomain: "loc-web.firebaseapp.com",
  databaseURL: "https://loc-web-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "loc-web",
  storageBucket: "loc-web.appspot.com",
  messagingSenderId: "630189294646",
  appId: "1:630189294646:web:15c494c31d1aee42ef8497",
  measurementId: "G-ZRVHL7P7LR"
};
  
  // Initialize Firebase
  const app1 = initializeApp(firebaseConfig);
  export const db = getDatabase(app1);