# Route Optimization - Automatic Route Generation System

## Overview

The PROJET_BUS system includes an **automatic route generation feature** that optimizes bus routes based on student pickup locations using the **Mapbox Optimization API**. This system automatically creates and updates routes when students are assigned to or removed from buses.

## Features

- **Automatic Route Generation**: Routes are automatically created when students are assigned to a bus
- **Mapbox Integration**: Uses Mapbox Optimization API to find the most efficient route order
- **Real-time ETAs**: Calculates estimated arrival times for each stop
- **Auto-Regeneration**: Routes are automatically updated when students are added/removed
- **Manual Override**: Supports both manual and auto-generated routes
- **Fallback Mechanism**: Geographic sorting fallback if Mapbox API is unavailable

## Architecture

### Core Components

1. **RouteGenerationService** (`backend/src/services/route-generation.service.ts`)
   - Handles route optimization logic
   - Integrates with Mapbox API
   - Calculates ETAs and distances

2. **RouteController** (`backend/src/controllers/route.controller.ts`)
   - Exposes REST API endpoints
   - Validates requests
   - Handles errors

3. **Student Service Hooks** (`backend/src/services/student.service.ts`)
   - Triggers auto-regeneration on student assignment
   - Triggers auto-regeneration on student removal

## API Endpoints

### Generate Route for Bus

```http
POST /api/routes/generate/:busId
```

**Description**: Generates an optimized route for a specific bus based on assigned students.

**Request Body** (optional):
```json
{
  "departureTime": "07:00",
  "autoRegenerate": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "route-123",
    "name": "Route Auto - BUS-001",
    "code": "AUTO-BUS-001-1234567890",
    "isManual": false,
    "generatedAt": "2025-11-19T10:30:00Z",
    "isOptimized": true,
    "optimizationEngine": "mapbox",
    "stops": [
      {
        "id": "stop-1",
        "name": "Pickup John Doe",
        "address": "123 Rue Riviera, Cocody",
        "location": { "lat": 5.3599, "lng": -3.9847 },
        "order": 1,
        "estimatedArrivalTime": "07:05",
        "relativeTimeMinutes": 5,
        "studentId": "student-123",
        "type": "pickup"
      }
    ],
    "totalDistanceKm": 12.5,
    "estimatedDurationMinutes": 45,
    "departureTime": "07:00"
  },
  "message": "Route generated successfully"
}
```

**Error Responses**:
- `400 Bad Request`: No students assigned to bus
- `404 Not Found`: Bus not found
- `500 Internal Server Error`: Optimization failed

---

### Regenerate Route

```http
POST /api/routes/regenerate/:busId
```

**Description**: Forces regeneration of an existing route.

**Response**: Same as generate route

---

### Get Route by Bus

```http
GET /api/routes/by-bus/:busId
```

**Description**: Retrieves the current route for a bus (prioritizes auto-generated routes).

**Response**:
```json
{
  "success": true,
  "data": { /* Route object */ }
}
```

---

### Preview Route

```http
GET /api/routes/preview/:busId
```

**Description**: Generates a route preview without saving it to the database.

**Use Case**: Testing route optimization before committing changes.

**Response**: Same structure as generated route

---

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Mapbox Configuration
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here
MAPBOX_OPTIMIZATION_ENABLED=true
```

### Getting a Mapbox Token

1. Sign up at [https://www.mapbox.com](https://www.mapbox.com)
2. Navigate to **Account → Access Tokens**
3. Create a new token with the following scopes:
   - `styles:read`
   - `navigation:read`
   - `directions:read`
   - `trips:read` (for optimization)
4. Copy the token (starts with `pk.`)
5. Add to your `.env` file

### Disabling Mapbox (Fallback Mode)

If Mapbox is disabled or fails, the system falls back to **geographic sorting**:

```bash
MAPBOX_OPTIMIZATION_ENABLED=false
```

In this mode, stops are ordered by:
1. Latitude (North → South)
2. Longitude (West → East)

## Data Model

### Bus Model Updates

New optional fields added to `Bus` type:

```typescript
interface Bus {
  // ... existing fields
  assignedCommune?: string;          // Main commune of operation
  assignedQuartiers?: string[];      // Optional sub-zones
  preferredDepartureTime?: string;   // Morning departure time (HH:mm)
}
```

### Route Model Updates

New fields for auto-generation:

```typescript
interface Route {
  // ... existing fields
  isManual: boolean;                 // true = manual, false = auto
  generatedAt?: Date;                // Generation timestamp
  isOptimized?: boolean;             // true if Mapbox succeeded
  optimizationEngine?: string;       // "mapbox" | "geographic-fallback"
  departureTime?: string;            // Fixed departure time (HH:mm)
}
```

### RouteStop Model Updates

New fields for student tracking:

```typescript
interface RouteStop {
  // ... existing fields
  studentId?: string;                // Associated student
  estimatedArrivalTime?: string;     // Absolute time (HH:mm)
  relativeTimeMinutes?: number;      // Minutes from departure
}
```

## How It Works

### Step 1: Student Assignment

When a student is assigned to a bus:

```typescript
await studentService.assignToBus(studentId, busId);
// → Triggers automatic route generation
```

### Step 2: Location Extraction

The system:
1. Fetches all students assigned to the bus
2. Extracts their `pickupLocation` coordinates
3. Retrieves bus departure time (from `bus.preferredDepartureTime` or defaults to "07:00")

### Step 3: Route Optimization

**With Mapbox** (if enabled):
1. Sends coordinates to **Mapbox Optimization API**:
   ```
   GET https://api.mapbox.com/optimized-trips/v1/mapbox/driving/{coordinates}
   ```
2. Receives optimal waypoint order
3. Uses **Mapbox Directions API** to calculate durations between stops

**Without Mapbox** (fallback):
1. Sorts locations geographically (North→South, West→East)
2. Estimates durations based on Haversine distance

### Step 4: ETA Calculation

For each stop:
1. Calculate travel time from previous stop
2. Add 2-minute pickup time
3. Compute absolute arrival time (e.g., "07:15")
4. Store relative time from departure (e.g., 15 minutes)

### Step 5: Route Creation/Update

- **New Route**: Creates route with `isManual: false`
- **Existing Auto Route**: Updates existing route with new data
- **Existing Manual Route**: Keeps manual route, creates new auto route

## Manual vs Auto Routes

### Auto-Generated Routes

- **Trigger**: Student assignment/removal
- **Editable**: No (read-only in frontend)
- **Badge**: Green "AUTO"
- **Regeneration**: Can be regenerated with "Recalculate" button

### Manual Routes

- **Trigger**: Admin creates manually
- **Editable**: Yes
- **Badge**: Gray "MANUEL"
- **Regeneration**: Not applicable

### Coexistence Strategy

- Both types can exist simultaneously
- Auto routes are prioritized when fetching by bus ID
- Admins can convert manual routes to auto (future feature)

## Testing

### Unit Tests

Located in `backend/tests/unit/route-generation.service.test.ts`:

```bash
npm run test:unit
```

Tests cover:
- Route generation with mock Mapbox
- ETA calculation logic
- Fallback behavior when API fails

### Integration Tests

Located in `backend/tests/integration/route-generation.api.test.ts`:

```bash
npm run test:integration
```

Tests cover:
- `POST /api/routes/generate/:busId`
- `POST /api/routes/regenerate/:busId`
- Error handling (404, 400, 500)

### Example Test Case

```typescript
describe('Route Generation', () => {
  it('should generate route for bus with students', async () => {
    // Arrange
    const bus = await createTestBus();
    await createTestStudents(bus.id, 3);

    // Act
    const response = await request(app)
      .post(`/api/routes/generate/${bus.id}`)
      .send({ departureTime: '07:00' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.stops).toHaveLength(3);
    expect(response.body.data.isOptimized).toBe(true);
  });
});
```

## Performance Considerations

### API Rate Limits

**Mapbox Free Tier**:
- 100,000 requests/month
- ~3,300 requests/day

**Optimization Strategy**:
- Routes only regenerate when students are added/removed
- Not on every GPS update
- Preview endpoint doesn't save to DB (testing only)

### Caching

Currently no caching implemented. Future improvements:
- Cache routes for 24 hours
- Only regenerate if student list changes

### Error Handling

If Mapbox fails:
1. Log error to console
2. Fallback to geographic sorting
3. Set `optimizationEngine: "geographic-fallback"`
4. Continue with route creation

## Frontend Integration

### Bus Management Page

New fields in bus form:
- **Assigned Commune** (dropdown)
- **Assigned Quartiers** (multi-select)
- **Preferred Departure Time** (time picker)

### Routes Management Page

Route list shows:
- Badge: "AUTO" (green) or "MANUEL" (gray)
- Generation timestamp (for auto routes)
- "Recalculate" button (for auto routes)
- Edit disabled for auto routes

### Bus Details Page

New "Route optimale" section:
- Map visualization with Mapbox GL
- List of stops in order with ETAs
- "Recalculate Route" button

## Troubleshooting

### Error: "No students assigned to bus"

**Cause**: Trying to generate route for empty bus

**Solution**: Assign at least one student to the bus first

---

### Error: "Mapbox API request failed"

**Cause**: Invalid token or API unavailable

**Solution**:
1. Check `MAPBOX_ACCESS_TOKEN` is valid
2. Verify token has `trips:read` scope
3. Check network connectivity
4. System will fallback to geographic sorting

---

### Routes not auto-regenerating

**Cause**: `autoRegenerate` flag disabled

**Solution**:
```typescript
await studentService.assignToBus(
  studentId,
  busId,
  routeId,
  true  // Enable auto-regeneration
);
```

---

### ETAs are inaccurate

**Cause**: Fallback mode using Haversine distance

**Solution**: Enable Mapbox Optimization API for real road network calculations

---

## Future Enhancements

1. **Multiple Departure Times**: Support afternoon routes
2. **Route Templates**: Save common route patterns
3. **Traffic Integration**: Use real-time traffic data
4. **Driver Feedback**: Allow drivers to report route issues
5. **A/B Testing**: Compare manual vs auto route efficiency
6. **Route Comparison**: Side-by-side comparison of alternatives
7. **Constraint Configuration**: Max route duration, max distance limits

## Resources

- **Mapbox Optimization API**: [https://docs.mapbox.com/api/navigation/optimization/](https://docs.mapbox.com/api/navigation/optimization/)
- **Mapbox Directions API**: [https://docs.mapbox.com/api/navigation/directions/](https://docs.mapbox.com/api/navigation/directions/)
- **Firebase Functions**: [https://firebase.google.com/docs/functions](https://firebase.google.com/docs/functions)

## Support

For issues or questions:
- Check existing GitHub issues: [https://github.com/Flinguee75/PROJET_BUS100/issues](https://github.com/Flinguee75/PROJET_BUS100/issues)
- Create new issue with tag `route-optimization`
