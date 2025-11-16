import "dotenv/config";
import admin from "firebase-admin";

let isInitialized = false;

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    
    if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
        console.warn("Firebase Admin not initialized - missing environment variables");
    } else {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
        console.log("Firebase Admin initialized");
        isInitialized = true;
    }
}

export const db = isInitialized ? admin.firestore() : null;
export const auth = isInitialized ? admin.auth() : null;
export default admin;

