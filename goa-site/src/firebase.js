import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyClEGJ71kv39LIGTthR8Yua9DwWLqjs-YY",
  authDomain: "goa-boutique-greengrocer.firebaseapp.com",
  projectId: "goa-boutique-greengrocer",
  storageBucket: "goa-boutique-greengrocer.firebasestorage.app",
  messagingSenderId: "346864761258",
  appId: "1:346864761258:web:bb72c3f870e8194e1f53d3",
  measurementId: "G-YDLPET8TBK"
};

const app = initializeApp(firebaseConfig);

export const fbApp   = app;
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

// Collection references (objects, not strings)
export const PRODUCTS_COL   = collection(db, "products");
export const ORDERS_COL     = collection(db, "orders");
export const CATEGORIES_COL = collection(db, "categories");

// Document helpers
export const prodDoc  = (id) => doc(db, "products", id);
export const orderDoc = (id) => doc(db, "orders", id);
export const catDoc   = (id) => doc(db, "categories", id);