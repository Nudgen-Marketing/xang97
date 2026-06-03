## Summary

Fix the issue where the Google Map becomes a solid blue rectangle after selecting a searched location by ensuring we only pass a valid, normalized `mapId` into the Google Maps `Map` instance and the JS API loader configuration.

## Current State Analysis (grounded in repo)

- The map is created in [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L307-L328) with `mapId: GOOGLE_MAPS_MAP_ID || undefined`.
  - This treats any truthy string (including whitespace like `"   "`) as a “present” mapId and forwards it into Google Maps.
- Separately, the code uses trimming logic to decide whether advanced markers are enabled:
  - [shouldUseAdvancedMarkers](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/google-maps.ts#L23-L25) returns `mapId.trim().length > 0`.
  - The loader config only sets `mapIds` when `shouldUseAdvancedMarkers()` is true: [configureGoogleMaps](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/google-maps.ts#L27-L45).
- After a location search (Places selection), the map forcibly pans/zooms: [panTo + setZoom(14)](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L539-L550).
- Net effect: `mapId` can be applied to the map even when the rest of the code considers it “absent” (whitespace), and an invalid/misconfigured mapId is a common cause of “blank/solid color” Google Maps rendering after interactions like pan/zoom.

## Proposed Changes

### 1) Normalize mapId in one place (single source of truth)

- Update [google-maps.ts](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/google-maps.ts) to export a small helper that returns a normalized mapId:
  - `getGoogleMapsMapId(): string | undefined`
  - Behavior: `const id = GOOGLE_MAPS_MAP_ID.trim(); return id.length > 0 ? id : undefined;`
- Change `configureGoogleMaps()` to use the normalized id for `mapIds`.
  - This avoids sending `["   "]` and keeps loader configuration aligned with runtime map options.

### 2) Only pass a normalized mapId into the Map constructor

- Update [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L307-L328) `createMap()`:
  - Replace `mapId: GOOGLE_MAPS_MAP_ID || undefined` with `mapId: getGoogleMapsMapId()`
  - Keep all other options unchanged.
- Rationale: if `NEXT_PUBLIC_GOOGLE_MAP_ID` is empty/whitespace, the map renders with default basemap behavior and the app already falls back to legacy markers (see [map-config.test.ts](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/tests/map-config.test.ts#L44-L48)).

### 3) Add/adjust tests to lock behavior

- Update [map-config.test.ts](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/tests/map-config.test.ts) to validate the new normalization helper:
  - `getGoogleMapsMapId()` returns `undefined` for `""` and `"   "`.
  - `getGoogleMapsMapId()` returns the trimmed id for `" my-id "`.

### 4) Documentation guardrails (reduce future regressions)

- Update [README.md](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/README.md#L28-L64):
  - Clarify that `NEXT_PUBLIC_GOOGLE_MAP_ID` is optional and must be a valid Map ID from the same Google Cloud project as the API key.
  - Add a troubleshooting note: if the map becomes blank/solid color after moving/zooming, try unsetting `NEXT_PUBLIC_GOOGLE_MAP_ID` to confirm it’s a mapId issue.

## Assumptions & Decisions

- Assumption: the “solid blue map after search/pan” is triggered by a bad/garbage `mapId` being applied (including whitespace-only env values, or a Map ID not provisioned for the key/project).
- Decision: do not attempt complex runtime fallbacks (timeouts/event-based re-init) because it’s higher risk, harder to test, and Google Maps mapId validity can’t be reliably validated client-side.

## Verification Steps

- Unit tests: `yarn test` (ensures mapId normalization behavior is locked).
- Static checks: `yarn typecheck` and `yarn lint`.
- Manual check (dev):
  - With `NEXT_PUBLIC_GOOGLE_MAP_ID=""`: open app, search an address, confirm the map pans/zooms and tiles render normally.
  - With a known-valid `NEXT_PUBLIC_GOOGLE_MAP_ID`: repeat and confirm map tiles render and markers still appear.
  - Confirm browser console has no Google Maps errors related to mapId/style loading.

## Success Criteria / Acceptance

- After selecting a location from search, the map continues to render tiles (not a solid blue rectangle) and pans/zooms to the searched location.
- If `NEXT_PUBLIC_GOOGLE_MAP_ID` is blank or whitespace, the app behaves consistently (no mapId applied; legacy markers used).
