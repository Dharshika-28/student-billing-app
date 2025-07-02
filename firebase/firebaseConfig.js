// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDvyKUiXEo1I6VM9gk30dk63EBirLDHTQw',
  authDomain: 'student-billing-app.firebaseapp.com',
  projectId: 'student-billing-app',
  storageBucket: 'student-billing-app.appspot.com',
  messagingSenderId: '1076482776951',
  appId: '1:1076482776951:web:f870748e57cc90e483cb72',
};

const app = initializeApp(firebaseConfig);

// ✅ Works now because only official SDK is used
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
