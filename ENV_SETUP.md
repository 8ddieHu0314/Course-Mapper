# Environment Variables Setup Guide

You need to create **2 `.env` files** in your project:

## File 1: `backend/.env`

**Location:** `/Users/claudiawong/INFO1998/info1998-final-project/backend/.env`

**Contents:**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**How to get these values:**

1. **Firebase Credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings (gear icon) > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Copy:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and `\n` characters)
     - `client_email` → `FIREBASE_CLIENT_EMAIL`

2. **Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (or create one)
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"
   - Enable these APIs:
     - Geocoding API
     - Directions API
     - Maps JavaScript API

---

## File 2: `frontend/.env`

**Location:** `/Users/claudiawong/INFO1998/info1998-final-project/frontend/.env`

**Contents:**
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_API_BASE_URL=http://localhost:8080/api
```

**How to get these values:**

1. **Firebase Web App Config:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings (gear icon) > Your apps
   - Click the web icon (`</>`) to add a web app (if you haven't already)
   - Copy the config values from the `firebaseConfig` object

2. **Google Maps API Key:**
   - Use the same key as backend, or create a browser-restricted key for better security

3. **API Base URL:**
   - For local development: `http://localhost:8080/api`
   - For production: Update to your deployed backend URL

---

## Quick Setup Steps

1. **Copy the example files:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Edit the files** with your actual values

3. **Important Notes:**
   - Never commit `.env` files to git (they should be in `.gitignore`)
   - The `.env.example` files are safe to commit (they don't contain secrets)
   - For `FIREBASE_PRIVATE_KEY`, keep the quotes and `\n` characters exactly as shown
   - All `VITE_` prefixed variables are exposed to the browser (don't put secrets there)

---

## Verification

After creating the files, verify they're working:

1. **Backend:** Start the server and check for "Firebase Admin initialized" in console
2. **Frontend:** Check browser console for any Firebase initialization errors

