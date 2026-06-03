# Plan: Red Origin Pin + Radius Circle Overlay

## Summary
Update the main map experience so the chosen search location (origin) renders as a red pin (matching the app’s accent/selected style), and draw a Google Maps radius circle around that origin using the radius the user selects.

## Current State Analysis
- The app uses Google Maps (Maps JS API) and renders markers in [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx).
- Station markers are green by default and turn red when selected ([StationMap.tsx:L446-L480](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L446-L480)).
- The “origin” marker (user search location) is currently styled as:
  - Blue when `userLocationKind === "geolocation"`
  - Green when `userLocationKind === "place"`
  ([StationMap.tsx:L503-L537](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L503-L537))
- The selected radius is used only for filtering in [filterStations](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/station-search.ts#L28-L45) and is chosen in [A97App.tsx:L175-L190](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx#L175-L190).
- No map overlay is currently drawn for the radius (no `google.maps.Circle`).

## Proposed Changes

### 1) Pass the selected radius into the map component
- File: [A97App.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx)
- Change:
  - Pass `radiusKm` to `<StationMap />`.
- Why:
  - StationMap is responsible for map rendering; it needs `radiusKm` to draw a circle overlay.

### 2) Render the origin marker as a red pin
- File: [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx)
- Change:
  - Update the origin marker styling in the user marker effect so both place + geolocation origins use the red accent palette (same as selected station / picker pin).
  - Keep the title logic (label) unchanged.
- Styling decision:
  - Use `background: "#d8432e"` and `borderColor: "#a72e1f"` (already used for selected station + picker marker).
  - Use no glyph (or a minimal glyph) to visually match the “red pin” expectation.

### 3) Draw a radius circle overlay around the origin
- File: [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx)
- Change:
  - Add a ref to store a `google.maps.Circle` instance.
  - Add an effect that creates/updates the circle when `userLocation` or `radiusKm` changes.
  - Remove the circle when `userLocation` becomes null and during unmount cleanup.
- Circle behavior:
  - Center: origin (`userLocation`)
  - Radius: `radiusKm * 1000` meters
  - Stroke: accent red with medium opacity
  - Fill: accent red with low opacity
  - Non-interactive (`clickable: false`)

### 4) Make the circle visible by default (map viewport behavior)
- File: [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx)
- Change:
  - Adjust the “pan/zoom” effect ([StationMap.tsx:L539-L550](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L539-L550)):
    - If a station is selected: keep current behavior (pan to station, zoom 14).
    - Else if origin exists and the radius circle has bounds: call `map.fitBounds(circleBounds, padding)` so the full selected radius is visible (matching the reference image).

## Assumptions & Decisions
- The “pin location” in the request refers to the search origin marker on the main map (not the submit picker), since the submit picker already uses a red pin ([PickerMap marker](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L662-L685)).
- The radius circle should only display when an origin exists (same condition as enabling the radius dropdown).
- The radius circle should update live when the dropdown value changes.

## Verification Steps
- Typecheck: `yarn typecheck`
- Unit tests: `yarn test`
- Manual check (dev server):
  - Set an origin via autocomplete and via geolocation; confirm origin pin is red.
  - Change radius dropdown (10/25/50/100/250 km); confirm a translucent circle updates and stays centered.
  - Confirm when no station is selected, the map zooms to show the whole circle; when a station is selected, it still pans/zooms to the station.

