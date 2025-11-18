# Cornell Course Mapper

A React + Node.js application for Cornell Course Planning

## Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file with the following variables:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

3. Install dependencies and run:
   ```bash
   pnpm install
   pnpm dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create a `.env` file with the following variables:
   ```
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

3. Install dependencies and run:
   ```bash
   pnpm install
   pnpm dev
   ```