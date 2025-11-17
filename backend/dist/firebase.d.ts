import "dotenv/config";
import admin from "firebase-admin";
export declare const db: admin.firestore.Firestore | null;
export declare const auth: import("firebase-admin/lib/auth/auth").Auth | null;
export default admin;
