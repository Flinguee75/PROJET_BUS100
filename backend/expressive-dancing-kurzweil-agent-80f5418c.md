# Implementation Plan: Student Stop Markers on GodView Map

**Date:** 2025-12-22
**Project:** PROJET_BUS100 - Web Admin Dashboard
**Feature:** Display student pickup/dropoff locations on GodView map with toggle control

---

## Executive Summary

This plan implements student stop markers on the GodView map, displayed only when a bus is selected. Markers will be color-coded by status (red = not picked up, green = scanned, gray = inactive), numbered sequentially, and filtered by the active trip type (morning/midday/evening). A toggle button will control visibility, and clicking markers will show student details in popups.

**Implementation Approach:** Vertical slice - Database → Frontend → Integration → Testing

---

## 1. Architecture Overview

### Current State Analysis
- **Map Technology:** Mapbox GL JS v3.1.2
- **Marker Pattern:** HTML marker generation + Mapbox Marker API
- **Data Flow:** Firestore listeners → React state → Mapbox markers
- **Existing Helpers:** 
  - `generateBusMarkerHTML()` in `/web-admin/src/components/godview/BusMarkerWithAura.tsx`
  - `generateSimplifiedBusPopupHTML()` in `/web-admin/src/components/godview/SimplifiedBusPopup.tsx`
- **Marker Management:** `markers.current = new Map<string, mapboxgl.Marker>()`

### Data Structure (Backend)
```typescript
// Student structure (from backend/src/types/student.types.ts)
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  busId: string | null;
  locations: {
    morningPickup?: { lat, lng, address, notes? }
    middayDropoff?: { lat, lng, address, notes? }
    middayPickup?: { lat, lng, address, notes? }
    eveningDropoff?: { lat, lng, address, notes? }
  };
  activeTrips: TimeOfDay[];
  isActive: boolean;
}

// TimeOfDay enum mapping to location fields
MORNING_OUTBOUND → locations.morningPickup    (pickup)
MIDDAY_OUTBOUND → locations.middayDropoff     (dropoff)
MIDDAY_RETURN → locations.middayPickup         (pickup)
EVENING_RETURN → locations.eveningDropoff      (dropoff)
```

### Service Available
- `getBusStudents(busId: string, tripType?: string | null): Promise<Student[]>`
  - Located in `/web-admin/src/services/students.firestore.ts`
  - Fetches students for a bus, optionally filtered by tripType

---

## 2. UI Components to Add

### 2.1 Toggle Button Design

**Location:** Top-right corner of map, above navigation controls

**HTML Structure:**
```tsx
<button 
  className="student-stops-toggle"
  onClick={() => setShowStudentStops(!showStudentStops)}
  style={{
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 1,
    backgroundColor: showStudentStops ? '#3b82f6' : 'white',
    color: showStudentStops ? 'white' : '#0f172a',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }}
>
  <MapPinIcon size={16} />
  {showStudentStops ? 'Masquer arrêts' : 'Afficher arrêts'}
</button>
```

**Placement in GodViewPage.tsx:**
- Add inside the map container div (`.flex-1 .relative .h-full`)
- Position as sibling to the mapContainer ref div
- Ensure z-index is higher than map but lower than sidebar

**Icon:** Use Lucide React's `MapPin` icon (already used in project)

### 2.2 Visual Design Specifications

**Toggle States:**
- **OFF (default):** White background, dark text, light border
- **ON:** Blue background (#3b82f6), white text, no border
- **Hover:** Slight scale (1.05) and shadow increase

---

## 3. State Management

### 3.1 New React State Variables

```typescript
// Toggle state for showing/hiding student stops
const [showStudentStops, setShowStudentStops] = useState<boolean>(false);

// Currently selected bus ID (for which we're showing stops)
const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

// Students data for the selected bus
const [busStudents, setBusStudents] = useState<StudentWithLocation[]>({});

// Loading state for student data fetch
const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
```

### 3.2 When to Fetch Student Data

**Trigger Points:**
1. **When a bus popup is opened** → set `selectedBusId`
2. **When toggle is turned ON** → if `selectedBusId` exists, fetch students
3. **When bus selection changes** → clear old markers, fetch new students

**Fetch Logic Flow:**
```typescript
useEffect(() => {
  if (!selectedBusId || !showStudentStops) {
    // Clear student markers
    clearStudentMarkers();
    return;
  }

  // Fetch students for selected bus
  fetchStudentStops(selectedBusId);
}, [selectedBusId, showStudentStops]);
```

### 3.3 Tracking Selected Bus

**Integration with existing `focusBusOnMap(busId)` function:**
- Modify `focusBusOnMap` to set `selectedBusId` when a bus is focused
- Listen to popup open/close events to track active bus

```typescript
// When popup opens
popup.on('open', () => {
  setActivePopupBusId(bus.id);
  setSelectedBusId(bus.id); // NEW: Track selected bus
});

// When popup closes
popup.on('close', () => {
  setActivePopupBusId(null);
  setSelectedBusId(null); // NEW: Clear selected bus
});
```

---

## 4. Data Fetching Logic

### 4.1 Determine Active Trip Type

**Source:** `bus.currentTrip?.tripType` or `bus.tripType`

```typescript
const getActiveTripType = (bus: ClassifiedBus): string | null => {
  return bus.currentTrip?.tripType ?? bus.tripType ?? null;
};
```

### 4.2 Map Trip Type to Location Field

```typescript
const getTripLocationField = (tripType: string): keyof Student['locations'] | null => {
  switch (tripType) {
    case 'morning_outbound':
      return 'morningPickup';
    case 'midday_outbound':
      return 'middayDropoff';
    case 'midday_return':
      return 'middayPickup';
    case 'evening_return':
      return 'eveningDropoff';
    default:
      return null;
  }
};
```

### 4.3 Fetch and Filter Students

```typescript
const fetchStudentStops = async (busId: string) => {
  setStudentsLoading(true);
  
  try {
    const bus = processedBuses.find(b => b.id === busId);
    if (!bus) return;
    
    const tripType = getActiveTripType(bus);
    if (!tripType) {
      console.warn('No active trip type for bus', busId);
      return;
    }
    
    const locationField = getTripLocationField(tripType);
    if (!locationField) return;
    
    // Fetch students (service automatically filters by tripType if provided)
    const students = await getBusStudents(busId, tripType);
    
    // Filter students with valid locations for this trip
    const studentsWithLocation = students
      .filter(student => {
        const location = student.locations?.[locationField];
        return location && 
               typeof location.lat === 'number' && 
               typeof location.lng === 'number';
      })
      .map((student, index) => ({
        ...student,
        location: student.locations[locationField]!,
        order: index + 1,
        isScanned: bus.currentTrip?.scannedStudentIds?.includes(student.id) ?? false
      }));
    
    setBusStudents(studentsWithLocation);
    
    // Create markers
    createStudentMarkers(studentsWithLocation, busId);
    
  } catch (error) {
    console.error('Error fetching student stops:', error);
  } finally {
    setStudentsLoading(false);
  }
};
```

### 4.4 Order Stops

**Priority:**
1. If route data available with stop order → use route.stops[].order
2. Otherwise → simple sequential numbering (1, 2, 3...)

**For MVP:** Use simple sequential order based on array index

---

## 5. Marker Generation

### 5.1 Helper Function: `generateStudentStopMarkerHTML()`

**Location:** Create new file `/web-admin/src/components/godview/StudentStopMarker.tsx`

```typescript
interface StudentStopMarkerOptions {
  order: number;
  status: 'pending' | 'scanned' | 'inactive';
}

export const generateStudentStopMarkerHTML = ({
  order,
  status
}: StudentStopMarkerOptions): string => {
  // Determine color based on status
  const getColor = (): string => {
    switch (status) {
      case 'scanned':
        return '#16a34a'; // Green-600
      case 'pending':
        return '#dc2626'; // Red-600
      case 'inactive':
        return '#64748b'; // Slate-500 (Gray)
      default:
        return '#64748b';
    }
  };
  
  const color = getColor();
  
  return `
    <div class="student-stop-marker" style="
      width: 36px;
      height: 36px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      cursor: pointer;
      transition: all 0.2s;
    ">
      ${order}
    </div>
  `;
};
```

### 5.2 CSS Styles

**Add to `/web-admin/src/styles/godview.css`:**

```css
/* Student Stop Marker Styles */
.student-stop-marker:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}

/* Animation for newly added markers */
@keyframes marker-pop-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.student-stop-marker {
  animation: marker-pop-in 0.3s ease-out;
}
```

---

## 6. Popup Generation

### 6.1 Helper Function: `generateStudentStopPopupHTML()`

**Location:** Add to `/web-admin/src/components/godview/StudentStopMarker.tsx`

```typescript
interface StudentStopPopupOptions {
  studentName: string;
  grade: string;
  address: string;
  order: number;
  status: 'pending' | 'scanned' | 'inactive';
}

export const generateStudentStopPopupHTML = ({
  studentName,
  grade,
  address,
  order,
  status
}: StudentStopPopupOptions): string => {
  const statusLabel = status === 'scanned' ? 'Scanné' : 
                     status === 'pending' ? 'En attente' : 'Inactif';
  const statusColor = status === 'scanned' ? '#16a34a' : 
                     status === 'pending' ? '#dc2626' : '#64748b';
  
  return `
    <div class="student-stop-popup" style="min-width: 220px; font-family: Inter, system-ui, sans-serif;">
      <!-- Header: Order badge + Student name -->
      <div style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <div style="
            background-color: ${statusColor};
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 13px;
          ">
            ${order}
          </div>
          <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">
            ${studentName}
          </h3>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>${grade}</span>
        </div>
      </div>
      
      <!-- Body: Address -->
      <div style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px;">
          ADRESSE
        </div>
        <div style="font-size: 13px; color: #0f172a; line-height: 1.4;">
          ${address}
        </div>
      </div>
      
      <!-- Footer: Status badge -->
      <div style="padding: 10px 16px;">
        <div style="
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 6px;
          background-color: ${statusColor}20;
          border: 1px solid ${statusColor};
        ">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${statusColor};
            margin-right: 6px;
          "></span>
          <span style="font-size: 12px; font-weight: 600; color: ${statusColor};">
            ${statusLabel}
          </span>
        </div>
      </div>
    </div>
  `;
};
```

---

## 7. Marker Management

### 7.1 Storage Structure

**New ref for student markers (separate from bus markers):**
```typescript
const studentMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
```

**Key format:** `student_${studentId}_${busId}`

### 7.2 Create Student Markers

```typescript
const createStudentMarkers = (
  students: StudentWithLocation[],
  busId: string
) => {
  if (!map.current || !mapLoaded) return;
  
  students.forEach(student => {
    const { location, order, isScanned } = student;
    const status = isScanned ? 'scanned' : 'pending';
    
    // Create marker element
    const el = document.createElement('div');
    el.innerHTML = generateStudentStopMarkerHTML({ order, status });
    
    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 20,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '280px'
    }).setHTML(generateStudentStopPopupHTML({
      studentName: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
      address: location.address,
      order,
      status
    }));
    
    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([location.lng, location.lat])
      .setPopup(popup)
      .addTo(map.current);
    
    // Store reference
    const key = `student_${student.id}_${busId}`;
    studentMarkers.current.set(key, marker);
  });
};
```

### 7.3 Clear Student Markers

```typescript
const clearStudentMarkers = () => {
  studentMarkers.current.forEach(marker => marker.remove());
  studentMarkers.current.clear();
};
```

### 7.4 Update on Real-time Changes

**Listen to bus.currentTrip.scannedStudentIds changes:**

```typescript
useEffect(() => {
  if (!selectedBusId || !showStudentStops) return;
  
  // Refresh markers when scanned students change
  const bus = processedBuses.find(b => b.id === selectedBusId);
  if (bus && bus.currentTrip) {
    updateStudentMarkerStatuses(bus.currentTrip.scannedStudentIds);
  }
}, [processedBuses, selectedBusId, showStudentStops]);

const updateStudentMarkerStatuses = (scannedIds: string[]) => {
  busStudents.forEach(student => {
    const key = `student_${student.id}_${selectedBusId}`;
    const marker = studentMarkers.current.get(key);
    
    if (marker) {
      const isScanned = scannedIds.includes(student.id);
      const status = isScanned ? 'scanned' : 'pending';
      
      // Update marker HTML
      const el = marker.getElement();
      el.innerHTML = generateStudentStopMarkerHTML({
        order: student.order,
        status
      });
      
      // Update popup HTML
      const popup = marker.getPopup();
      if (popup) {
        popup.setHTML(generateStudentStopPopupHTML({
          studentName: `${student.firstName} ${student.lastName}`,
          grade: student.grade,
          address: student.location.address,
          order: student.order,
          status
        }));
      }
    }
  });
};
```

---

## 8. Integration Points

### 8.1 Modify `focusBusOnMap()` Function

**File:** `/web-admin/src/pages/GodViewPage.tsx` (line ~457)

**Changes:**
1. Set `selectedBusId` when bus is focused
2. Ensure student markers are created if toggle is ON

```typescript
const focusBusOnMap = useCallback(
  (busId: string) => {
    if (!map.current || !mapLoaded) return;
    
    // ... existing logic ...
    
    // NEW: Set selected bus ID
    setSelectedBusId(busId);
    
    // ... rest of existing logic ...
  },
  [mapLoaded, processedBuses, stationedBuses, school, parkingZone]
);
```

### 8.2 Toggle Button Interaction

**When toggle is turned OFF:**
1. Clear all student markers
2. Keep `selectedBusId` (so markers reappear if toggled back ON)

**When toggle is turned ON:**
1. If `selectedBusId` exists → fetch and display student markers
2. If no bus selected → show instructional message (optional)

### 8.3 Edge Cases

**1. Bus has no currentTrip:**
- Don't show student markers
- Optionally show message in console: "No active trip for bus X"

**2. No students assigned to bus:**
- Clear student markers
- No error needed (valid state)

**3. Students missing location data:**
- Filter out students without valid lat/lng
- Log warning: "Student X missing location for trip type Y"

**4. User switches bus while toggle is ON:**
- Clear old markers
- Fetch new markers for new bus

**5. Bus popup closes:**
- Option A: Keep markers visible until another bus is selected
- Option B: Clear markers when popup closes (set `selectedBusId = null`)
- **Recommended:** Option A (less disruptive UX)

---

## 9. File Changes Required

### 9.1 New Files to Create

1. **`/web-admin/src/components/godview/StudentStopMarker.tsx`**
   - `generateStudentStopMarkerHTML()`
   - `generateStudentStopPopupHTML()`
   - Export both functions

### 9.2 Files to Modify

1. **`/web-admin/src/pages/GodViewPage.tsx`**
   - Add new state variables (lines after 180)
   - Add toggle button JSX (inside map container)
   - Add `fetchStudentStops()` function
   - Add `createStudentMarkers()` function
   - Add `clearStudentMarkers()` function
   - Add `updateStudentMarkerStatuses()` function
   - Add useEffect for student data fetching
   - Modify `focusBusOnMap()` to set `selectedBusId`
   - Add studentMarkers ref

2. **`/web-admin/src/styles/godview.css`**
   - Add `.student-stop-marker` styles
   - Add `.student-stop-marker:hover` styles
   - Add `@keyframes marker-pop-in` animation

3. **`/web-admin/src/components/godview/index.ts`**
   - Export new student marker functions

4. **`/web-admin/src/services/students.firestore.ts`**
   - **NO CHANGES NEEDED** - `getBusStudents()` already exists and supports tripType filtering

### 9.3 Type Definitions to Add

**Location:** `/web-admin/src/pages/GodViewPage.tsx` (top of file, after imports)

```typescript
interface StudentWithLocation {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  busId: string | null;
  location: {
    lat: number;
    lng: number;
    address: string;
    notes?: string;
  };
  order: number;
  isScanned: boolean;
}
```

---

## 10. Testing Considerations

### 10.1 Manual Test Scenarios

**Scenario 1: Toggle ON/OFF**
- [ ] Toggle button appears in top-right corner
- [ ] Clicking toggle shows/hides markers
- [ ] Button style changes when active

**Scenario 2: Bus Selection**
- [ ] Select bus with active trip → markers appear
- [ ] Select bus without active trip → no markers
- [ ] Switch between buses → markers update correctly

**Scenario 3: Marker Colors**
- [ ] Red markers for students not yet picked up
- [ ] Green markers for scanned students
- [ ] Gray markers for inactive students (if applicable)

**Scenario 4: Marker Numbering**
- [ ] Markers show correct order (1, 2, 3...)
- [ ] Order matches student sequence

**Scenario 5: Popup Content**
- [ ] Click marker → popup shows student name
- [ ] Popup shows grade/class
- [ ] Popup shows address
- [ ] Popup shows status badge

**Scenario 6: Real-time Updates**
- [ ] When student is scanned → marker turns green
- [ ] Scanned count updates without refresh

**Scenario 7: Trip Type Filtering**
- [ ] Morning trip → shows morningPickup locations
- [ ] Midday outbound → shows middayDropoff locations
- [ ] Midday return → shows middayPickup locations
- [ ] Evening → shows eveningDropoff locations

**Scenario 8: Edge Cases**
- [ ] Bus with no students → no markers, no errors
- [ ] Student missing location → skipped, no marker
- [ ] No active trip → no markers
- [ ] Toggle off then on → markers reappear

### 10.2 Integration Tests (Future)

**If/when adding Vitest tests:**

1. Test marker generation HTML output
2. Test trip type to location field mapping
3. Test student filtering logic
4. Test marker cleanup on unmount

### 10.3 Performance Considerations

**Optimization strategies:**
- Limit to max 50 markers per bus (unlikely to exceed)
- Debounce marker updates on rapid state changes
- Use Mapbox marker clustering if >30 markers (future enhancement)

---

## 11. Implementation Sequence (Vertical Slice)

### Phase 1: Foundation (30 min)
1. Create `StudentStopMarker.tsx` with HTML generators
2. Add CSS styles to `godview.css`
3. Add type definitions to `GodViewPage.tsx`

### Phase 2: State & Data Fetching (45 min)
4. Add state variables to `GodViewPage.tsx`
5. Implement `getTripLocationField()` helper
6. Implement `fetchStudentStops()` function
7. Add useEffect for student data fetching

### Phase 3: Marker Management (30 min)
8. Add `studentMarkers` ref
9. Implement `createStudentMarkers()`
10. Implement `clearStudentMarkers()`
11. Implement `updateStudentMarkerStatuses()`

### Phase 4: UI Integration (20 min)
12. Add toggle button JSX to GodViewPage
13. Wire toggle to show/hide logic
14. Modify `focusBusOnMap()` to set `selectedBusId`

### Phase 5: Testing & Refinement (35 min)
15. Manual test all scenarios
16. Fix any edge cases discovered
17. Adjust styling/colors if needed
18. Verify real-time updates work

**Total Estimated Time:** ~2.5 hours

---

## 12. Code Snippet Highlights

### Key Helper Function: Trip Type Mapper

```typescript
const getTripLocationField = (tripType: string): keyof Student['locations'] | null => {
  const mapping: Record<string, keyof Student['locations']> = {
    'morning_outbound': 'morningPickup',
    'midday_outbound': 'middayDropoff',
    'midday_return': 'middayPickup',
    'evening_return': 'eveningDropoff'
  };
  return mapping[tripType] || null;
};
```

### Key Integration: Popup Event Listener

```typescript
popup.on('open', () => {
  setActivePopupBusId(bus.id);
  setSelectedBusId(bus.id); // Track selected bus for student markers
});

popup.on('close', () => {
  setActivePopupBusId(null);
  // Option A: Keep markers (recommended)
  // setSelectedBusId(null); // Option B: Clear markers
});
```

---

## 13. Potential Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Student data structure mismatch between backend and frontend | Use backend types as source of truth; update frontend Student interface to include `locations` field |
| Marker z-index conflicts with bus markers | Use separate z-index layer for student markers (default Mapbox behavior should work) |
| Performance with many students | Implement marker limit (50 max) and clustering for future enhancement |
| Real-time sync lag | Acceptable 5-10 second delay; Firestore listeners already handle this |
| Toggle state persistence | Not needed for MVP; can add localStorage in future |

---

## 14. Future Enhancements (Post-MVP)

1. **Route Line Display:** Draw polyline connecting stops in order
2. **Clustering:** Group nearby markers when zoomed out
3. **ETA per Stop:** Show estimated arrival time for each stop
4. **Drag-to-Reorder:** Allow admins to reorder stops on map
5. **Filter by Status:** Show only pending/scanned stops
6. **Student Photos:** Add student photo to popup
7. **Navigation Integration:** "Get Directions" button in popup
8. **Historical View:** Show yesterday's pickup times

---

## Critical Files for Implementation

The following files are most critical for implementing this feature:

1. **`/Users/tidianecisse/PROJET INFO/PROJET_BUS100/web-admin/src/pages/GodViewPage.tsx`**
   - Core logic integration point
   - Add state management, marker creation, and toggle button
   - Modify `focusBusOnMap()` function

2. **`/Users/tidianecisse/PROJET INFO/PROJET_BUS100/web-admin/src/components/godview/StudentStopMarker.tsx`** (NEW FILE)
   - Create marker and popup HTML generators
   - Follow existing pattern from `BusMarkerWithAura.tsx` and `SimplifiedBusPopup.tsx`

3. **`/Users/tidianecisse/PROJET INFO/PROJET_BUS100/web-admin/src/styles/godview.css`**
   - Add student marker styles and animations
   - Ensure consistent visual design with existing markers

4. **`/Users/tidianecisse/PROJET INFO/PROJET_BUS100/web-admin/src/services/students.firestore.ts`**
   - Reference existing `getBusStudents()` function
   - Understand data structure for proper filtering

5. **`/Users/tidianecisse/PROJET INFO/PROJET_BUS100/backend/src/types/student.types.ts`**
   - Reference for Student interface with locations field
   - Understand trip type to location field mapping

---

## Appendix: Sample Data Flow

```
User clicks Bus Popup
  ↓
focusBusOnMap(busId) called
  ↓
setSelectedBusId(busId)
  ↓
useEffect triggers (selectedBusId changed)
  ↓
fetchStudentStops(busId)
  ↓
- Get bus.currentTrip.tripType
- Map to location field (e.g., 'morningPickup')
- Call getBusStudents(busId, tripType)
  ↓
Filter students with valid locations
  ↓
Add order numbers and scan status
  ↓
createStudentMarkers(students)
  ↓
For each student:
  - Generate HTML marker
  - Generate popup
  - Add to map
  - Store in studentMarkers ref
  ↓
Markers visible on map!

User scans student (real-time update)
  ↓
Firestore listener updates bus.currentTrip.scannedStudentIds
  ↓
useEffect triggers (processedBuses changed)
  ↓
updateStudentMarkerStatuses(scannedIds)
  ↓
Update marker color: red → green
Update popup status: "En attente" → "Scanné"
```

---

**End of Implementation Plan**
