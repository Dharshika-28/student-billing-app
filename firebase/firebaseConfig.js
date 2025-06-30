import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvyKUiXEo1I6VM9gk30dk63EBirLDHTQw",
  authDomain: "student-billing-app.firebaseapp.com",
  projectId: "student-billing-app",
  storageBucket: "student-billing-app.firebasestorage.app",
  messagingSenderId: "1076482776951",
  appId: "1:1076482776951:web:f870748e57cc90e483cb72",
  measurementId: "G-DWWS8HVRLZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

// import { initializeApp } from "firebase/app";
// import { initializeAuth, getReactNativePersistence } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// const firebaseConfig = {  
//   apiKey: "AIzaSyDvyKUiXEo1I6VM9gk30dk63EBirLDHTQw",
//   authDomain: "student-billing-app.firebaseapp.com",
//   projectId: "student-billing-app",
//   storageBucket: "student-billing-app.appspot.com",
//   messagingSenderId: "1076482776951",
//   appId: "1:1076482776951:web:f870748e57cc90e483cb72",
//   measurementId: "G-DWWS8HVRLZ"
// }; 

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Auth with persistence
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });

// // Initialize Firestore
// const db = getFirestore(app);

// export { auth, db };