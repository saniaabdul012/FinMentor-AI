import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { auth } from "./firebase.js";

// Signup
export async function signup(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created successfully!");
    return userCredential.user;
  } catch (error) {
    alert(error.message);
  }
}

// Login
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    alert("Login Successful!");
    return userCredential.user;
  } catch (error) {
    alert(error.message);
  }
}

// Logout
export async function logout() {
  await signOut(auth);
  alert("Logged out successfully!");
}