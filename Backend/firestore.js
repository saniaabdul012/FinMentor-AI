import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

// Save data
export async function saveData(collectionName, data) {
  try {
    await addDoc(collection(db, collectionName), data);
    alert("Data saved successfully!");
  } catch (error) {
    console.error(error);
  }
}

// Read data
export async function getData(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}