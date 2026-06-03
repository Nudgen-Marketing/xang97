## Summary

Add a reliable Google Places autocomplete dropdown to the “Nhập địa điểm” input so that:
- Typing shows a suggestions dropdown.
- Clicking a suggestion applies it as the search origin (lat/lng) and updates the map + station list.
- After selection, the input displays the full formatted address.

## Current State Analysis

- The public home page renders [A97App](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx).
- The “Nhập địa điểm” UI already uses [GooglePlaceAutocomplete](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/GooglePlaceAutocomplete.tsx) and loads Google Places lazily on focus.
  - Predictions are fetched with a 350ms debounce via `placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(...)`: [GooglePlaceAutocomplete.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/GooglePlaceAutocomplete.tsx#L120-L173).
  - Selecting a suggestion fetches place details, returns `{ latitude, longitude, address, ... }`, and clears the dropdown: [GooglePlaceAutocomplete.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/GooglePlaceAutocomplete.tsx#L175-L197).
- In [A97App](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx), selecting a place sets `origin`, which triggers station ordering/filtering and map panning/zooming:
  - `origin` updates in `applyPlace`: [A97App.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx#L78-L86).
  - Station ordering reacts to `origin` via `filterStations(...)`: [A97App.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx#L72-L74) and [station-search.ts](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/station-search.ts#L28-L45).
  - Map centers on `userLocation` and zooms to 14: [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L450-L461).

Gaps vs requested behavior:
- After selecting a suggestion, A97App currently sets the input text to `place.name || place.address`, which can show only the place name instead of the full address. This conflicts with the desired “Full address” display.
- The dropdown click protection currently relies on `onMouseDown` to prevent blur; this can be unreliable on touch devices because touch interactions don’t always fire mouse events consistently.

## Proposed Changes

### 1) Keep the full address in the input after selection

- File: [A97App.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx)
- Change `applyPlace` to set:
  - `setLocationQuery(place.address || place.name)`
- Rationale: `GooglePlaceAutocomplete` already normalizes `selection.address` using `formattedAddress`, which is the expected “full address” string. A97App should not overwrite it with the shorter `name`.

### 2) Make suggestion selection robust on touch devices

- File: [GooglePlaceAutocomplete.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/GooglePlaceAutocomplete.tsx)
- Replace `onMouseDown={(event) => event.preventDefault()}` on suggestion buttons with a pointer-safe event (preferred):
  - `onPointerDown={(event) => event.preventDefault()}`
- Keep the existing delayed `onBlur` clearing behavior, but ensure the pointer event prevents the input from blurring before the click is processed.
- Rationale: `pointerdown` is fired for mouse, touch, and pen, making the “click suggestion -> apply selection” flow consistent across mobile + desktop.

## Assumptions & Decisions

- Autocomplete provider: Google Places (no offline dataset).
- Search trigger: only when the user clicks a suggestion (no “press Enter to search”).
- Input display after selection: full formatted address.
- Non-goals:
  - Keyboard navigation (ArrowUp/ArrowDown/Enter) for the dropdown.
  - Searching without selecting a suggestion (free-text geocoding).
  - Changing the station text search (“Tìm theo tên…”) behavior.

## Verification Steps

### Local config prerequisite

- In `.env.local`, set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (and enable Places API for that key).

### Manual verification (primary)

- Start the app and open `/`.
- In “Nhập địa điểm”, type at least 3 characters (e.g. “Điện Biên”).
- Confirm a dropdown appears with Google suggestions.
- Click a suggestion.
- Confirm:
  - The input value becomes the full formatted address.
  - The map pans/zooms to the selected location.
  - The station list shows distance badges and is ordered/filtered by distance (when origin is set).
- On mobile/touch:
  - Tap a suggestion; confirm it selects reliably (no premature dropdown close before click).

### Automated checks (sanity)

- Run:
  - `yarn lint`
  - `yarn typecheck`
  - `yarn test`
