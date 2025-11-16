# Cornell Class Scheduler

A React + Node.js application for planning your Cornell semester schedule with timetable visualization, walking distance validation, and interactive map views.

## Features

- **Weekly Timetable View**: Visualize your schedule Monday through Friday (7am-9pm)
- **Course Search**: Autocomplete search using Cornell Class Roster API
- **Walking Distance Validation**: Alerts when there's insufficient time to walk between classes
- **Day-Specific Map View**: Click any day to see your schedule with a map showing walking paths
- **Google Authentication**: Sign in with Google to save your schedule
- **Section Selection**: Change course sections (e.g., LEC001 to LEC002) with PUT requests
- **Course Management**: Add and remove courses with automatic Firebase persistence

## Setup

### Prerequisites

- Node.js and pnpm installed
- Firebase project with Authentication and Firestore enabled
- Google Maps API key with Geocoding, Directions, and Maps JavaScript API enabled

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

### Firebase Configuration

1. Enable Google Authentication in Firebase Console
2. Create a Firestore database
3. Create a service account and download the private key for backend authentication
4. Add your Firebase web app configuration to frontend `.env`

## API Endpoints

### Cornell API Proxy
- `GET /api/cornell/search?q=<courseCode>&roster=FA25` - Search for courses
- `GET /api/cornell/subjects?roster=FA25` - Get available subjects

### Google Maps API Proxy
- `POST /api/geocode` - Convert building name to coordinates
- `POST /api/directions` - Calculate walking time between locations

### Schedule Management (Protected)
- `GET /api/schedules?roster=FA25` - Get user's schedules
- `POST /api/schedules` - Create new schedule
- `PUT /api/schedules/:scheduleId/courses/:courseId` - Update course section
- `DELETE /api/schedules/:scheduleId/courses/:courseId` - Delete course

## Usage

1. Start the backend server (port 8080)
2. Start the frontend dev server
3. Navigate to the home page and sign in with Google
4. Search for courses and add them to your schedule
5. Click on day headers (Mon-Fri) to view day-specific maps
6. Change sections in the course details sidebar
7. Remove courses using the delete button

## Technology Stack

- **Frontend**: React, TypeScript, Mantine UI, React Router, Firebase Auth
- **Backend**: Node.js, Express, TypeScript, Firebase Admin SDK
- **APIs**: Cornell Class Roster API, Google Maps API
- **Database**: Firebase Firestore