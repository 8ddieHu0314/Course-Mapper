"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
require("dotenv/config");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let isInitialized = false;
if (!firebase_admin_1.default.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
        console.warn("Firebase Admin not initialized - missing environment variables");
    }
    else {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
        console.log("Firebase Admin initialized");
        isInitialized = true;
    }
}
exports.db = isInitialized ? firebase_admin_1.default.firestore() : null;
exports.auth = isInitialized ? firebase_admin_1.default.auth() : null;
exports.default = firebase_admin_1.default;
