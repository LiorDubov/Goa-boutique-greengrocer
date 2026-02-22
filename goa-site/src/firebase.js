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

export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

// Collection references
export const PRODUCTS_COL   = "products";
export const ORDERS_COL     = "orders";
export const CATEGORIES_COL = "categories";

// Document helpers
export const prodDoc  = (id) => doc(db, PRODUCTS_COL, id);
export const orderDoc = (id) => doc(db, ORDERS_COL, id);
