# Map View Feature - Implementation Guide

## Overview
Created a new frontend page that displays a course calendar for a single day on the left side with the ability to toggle between days, and a Google Maps visualization on the right side showing walking paths between classes with color-coded polylines.

## Files Created/Modified

### New Files Created:

1. **`frontend/src/pages/MapView.tsx`**
   - Main page component for the map view
   - Features:
     - Day selector with segmented control (Monday-Friday)
     - Left sidebar displaying courses for the selected day
     - Displays course code, time, and location
     - Responsive grid layout (5:7 split on desktop)
   - Uses existing utilities from `calendar-utils` and `scheduleTransform`
   - Requires user authentication

2. **`frontend/src/components/MapDisplay.tsx`**
   - Google Maps integration component
   - Features:
     - Displays map centered on Cornell University (42.4534, -76.4735)
     - Color-coded polylines connecting consecutive classes
     - Markers for each class location
     - Info windows showing class details on marker click
     - Route list below the map showing all walking paths
   - 8 distinct colors cycle through for different routes
   - Uses `@react-google-maps/api` library (already in dependencies)

3. **`frontend/src/pages/MapView.css`**
   - Styling for the map view layout
   - Includes scrollbar styling for course list
   - Responsive design with hover effects

### Modified Files:

1. **`frontend/src/constants/Navigation.tsx`**
   - Added import for `MapViewPage`
   - Added new route entry for `/map-view`

2. **`frontend/src/App.tsx`**
   - Added import for `MapViewPage`
   - Added `/map-view` route to router configuration

## Architecture

### Component Hierarchy
```
MapViewPage
├── Left Panel (Grid.Col span={5})
│   └── Paper
│       └── Stack
│           ├── Title + SegmentedControl (Day Selector)
│           └── Course List
│               └── Paper (Course Cards) x N
└── Right Panel (Grid.Col span={7})
    └── MapDisplay
        ├── GoogleMap
        │   ├── Polylines (Walking Routes)
        │   └── Markers (Class Locations) x N
        └── Route List (Summary)
```

### Data Flow
1. User selects a day via `SegmentedControl`
2. `selectedDay` state updates
3. `useMemo` recalculates courses for that day
4. Course list re-renders with new data
5. `MapDisplay` receives updated courses and day
6. Routes are recalculated and polylines are drawn

## Features

### Day Selector
- Segmented control with Monday-Friday options
- Updates both the course list and map visualization
- Smooth transitions between days

### Course Display
- Shows course code (e.g., "CS 2110")
- Displays class time
- Shows building/facility location
- Responsive scrolling for long course lists

### Map Visualization
- **Polylines**: Color-coded lines connecting consecutive classes
- **Markers**: Circular markers at each class location
- **Info Windows**: Click markers to see detailed course information
- **Route List**: Summary of all walking paths below the map
- **Colors**: 8 distinct colors that cycle through routes

## Configuration

### Google Maps API Key
The component uses the following environment variable:
```
REACT_APP_GOOGLE_MAPS_API_KEY
```

You'll need to set this in your `.env` file:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Coordinates
Currently, the system generates dummy walking paths between classes. To use real routes:

1. **Geocoding**: Buildings need to have coordinates stored in the `ScheduledMeeting.coordinates` field
2. **Backend Integration**: The backend should geocode building names and store coordinates
3. **Routes API**: Implement calls to Google Maps Directions API to get actual walking paths

## Future Enhancements

### 1. Real Walking Paths
```typescript
// Integrate with backend to calculate actual routes:
const response = await API.request('/api/directions', {
    method: 'POST',
    body: JSON.stringify({ 
        from: fromBuilding,
        to: toBuilding 
    })
});
```

### 2. Weather Integration
- Show weather conditions along the walking routes
- Suggest alternative routes if raining

### 3. Building Coordinates
- Ensure all buildings have accurate lat/lng in the database
- Build a buildings database with geolocations

### 4. Route Optimization
- Consider walking time between classes
- Show estimated time to reach next class
- Highlight tight schedules

### 5. Accessibility Features
- Accessible routes for mobility-impaired students
- Elevator locations in buildings
- Ramp information

### 6. Customization
- User preferences for route type (shortest, safest, most direct)
- Preferred walking speed
- Class building shortcuts

## Dependencies
- `@react-google-maps/api` - ^2.20.7 (already installed)
- `@mantine/core` - ^6.0.19 (already installed)
- React Router DOM - ^6.15.0 (already installed)

## Testing Checklist

- [ ] Day selector changes course list
- [ ] Course list displays all classes for selected day
- [ ] Map initializes without errors
- [ ] Markers appear on map (after setting coordinates)
- [ ] Polylines draw between classes
- [ ] Info windows display on marker click
- [ ] Route list shows correct paths
- [ ] Page is responsive on mobile/tablet
- [ ] User authentication is required
- [ ] No console errors

## Known Limitations

1. **Dummy Routes**: Currently shows dummy curved paths between classes. Replace with real Directions API calls once backend is ready.
2. **Coordinates**: Assumes `ScheduledMeeting.coordinates` is populated. Will need geocoding from backend.
3. **Map Bounds**: Currently always centers on Cornell. Should auto-fit bounds to show all class locations.
4. **Performance**: With many classes, rendering could slow down. Consider using clustering for markers.

## Next Steps

1. **Add Google Maps API Key**: Set `REACT_APP_GOOGLE_MAPS_API_KEY` environment variable
2. **Backend Geocoding**: Implement building geocoding in backend
3. **Store Coordinates**: Update `ScheduledMeeting` to include coordinates from geocoding
4. **Directions API Integration**: Call Google Maps Directions API for real walking paths
5. **Test with Real Data**: Test with an actual schedule containing multiple classes
6. **Optimize Performance**: Add marker clustering if needed
