## Summary

Ensure the public map loads with pins for all A97 gas stations (once the dataset is imported), improve pin visibility, and make selecting a station from the list automatically open its map detail popup. Keep the current “user submits → admin approves” workflow working end-to-end.

## Current State Analysis (repo-grounded)

- Public UI loads stations from [A97App.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx#L42-L66) via `GET /api/stations`, then filters client-side via [filterStations](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/station-search.ts#L28-L45).
- `GET /api/stations` returns ACTIVE stations from Postgres/Redis cache via [listPublicStations](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/stations.ts#L46-L60). Only `StationStatus.ACTIVE` is shown publicly.
- Map rendering and pin creation are implemented in [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx#L284-L453). Pins are created, but:
  - Selecting a station from the list only pans/zooms; it does not open the map popup because the popup is only opened inside the marker click handler.
  - Markers are recreated when `selectedStation` or `stations` changes (works, but makes it harder to “open popup by selection” without storing the marker reference by station id).
- Submission flow (public) is already implemented in [SubmitStationForm.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/SubmitStationForm.tsx) and `POST /api/submissions` in [route.ts](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/app/api/submissions/route.ts).
- Admin moderation flow exists in [AdminDashboard.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/AdminDashboard.tsx) and approval/rejection routes under [app/api/admin/submissions](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/app/api/admin/submissions).
- Seed data currently contains only a placeholder station marked `INACTIVE` in [a97-stations.json](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/prisma/seed-data/a97-stations.json). Therefore, by default, the public map will show 0 stations until you import/seed ACTIVE stations.

## Decisions From You

- Initial “all A97 stations” dataset will be provided by you as JSON/CSV.
- When a user sets a search location + radius, the map should show only stations within radius (no “show all” mode).
- UI/UX priority: opening station details popup when a station is selected from the list.

## Proposed Changes (decision-complete)

### 1) Data: import/seed “all A97 stations” into Postgres as ACTIVE

**Goal**
- After import, `GET /api/stations` returns a full list of ACTIVE stations, so the public map renders all pins immediately.

**Approach**
- Keep the existing seed mechanism (Prisma upsert from a JSON file) but make it practical for real datasets:
  1. Add a new CLI importer script that can take either JSON or CSV and produce a validated dataset that matches the existing station shape.
  2. Allow feeding that dataset into Postgres using the same upsert logic used by [prisma/seed.ts](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/prisma/seed.ts#L53-L74).

**Files**
- Add: `scripts/import-stations.ts`
  - Input: `--input <path-to-json-or-csv>`
  - Output mode options (no extra runtime dependencies):
    - `--write-seed-json` writes normalized output to `prisma/seed-data/a97-stations.json` (so `yarn prisma:seed` works as-is), OR
    - `--apply` imports directly into Postgres (upsert into `gasStation`)
  - Validation: reuse Zod (already in repo) with the same constraints as `seedStationSchema` in `prisma/seed.ts` (lat/lng Vietnam bounds, required fields, optional fields).
  - CSV format (header-based, comma-separated):
    - required: `name, address, province, latitude, longitude`
    - optional: `brand, ward, district, notes, source, status`
- Update: `README.md`
  - Add a short section “Import dữ liệu cây xăng A97 (JSON/CSV)” explaining:
    - expected schema/columns,
    - recommended flow: `yarn tsx scripts/import-stations.ts --input ... --apply` (or `--write-seed-json` then `yarn prisma:seed`),
    - reminder: public map shows only `ACTIVE`.

**Notes**
- This plan assumes you will provide the dataset file content (or a downloadable file). The implementation will not invent station coordinates.

### 2) Map UX: selecting a station from the list opens the popup and highlights its pin

**Goal**
- When the user clicks a station in the sidebar list, the map:
  - pans/zooms to that station (already does),
  - opens the same info popup as when clicking a pin,
  - highlights the pin clearly.

**Approach**
- In [StationMap.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/StationMap.tsx):
  1. Keep a `Map<string, MapMarker>` in a `useRef` so we can locate the marker for a station id.
  2. When markers are created, store them in the map by station id.
  3. Add an effect: when `selectedStation` changes and the map is ready, open `InfoWindow` using the stored marker as the anchor and `createStationInfoContent(selectedStation)` as content.
  4. When `selectedStation` becomes `null`, close the info window.
  5. Improve pin readability by slightly increasing default scale and selected scale (no design system change required).

**Files**
- Update: `components/StationMap.tsx`
  - Add marker lookup by station id.
  - Open info window on `selectedStation` change (not only on marker click).
  - Adjust pin scale to improve visibility (for both advanced marker and legacy marker paths).

### 3) Small UI polish to support the map-first workflow (no feature creep)

**Goal**
- Improve clarity without changing the overall layout or adding new pages.

**Approach**
- In [A97App.tsx](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/components/A97App.tsx), refine the station list click behavior to be “map-focused”:
  - Ensure clicking a station always switches to map mode (already does).
  - Clear transient errors when selecting a station (so the map experience isn’t blocked by an old geolocation error).

**Files**
- Update: `components/A97App.tsx` (small state handling refinements only).

## Assumptions & Constraints

- No new UI framework will be introduced; keep Tailwind + current CSS conventions in [globals.css](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/app/globals.css).
- No new map library is introduced; continue using Google Maps JS API via [lib/google-maps.ts](file:///Users/mac/Projects/tra-cuu-cay-xang-a97/lib/google-maps.ts).
- Public map continues to show only `StationStatus.ACTIVE`.
- Dataset import is purely administrative/operational; end users still add stations via the submission flow and admin approves via existing dashboard.

## Verification Steps

### Automated
- Run `yarn typecheck`
- Run `yarn lint`
- Run `yarn test`
- Run `yarn test:e2e` (requires docker compose + migrations, per README)

### Manual acceptance checks
- With an imported dataset (ACTIVE stations):
  - Home page shows station count > 0 and pins render on the map.
  - Clicking a station in the list opens the map popup with correct name/address and highlights the pin.
  - Clicking a pin also opens the same popup.
- Submission flow:
  - Submit a new station; see success state “Chờ duyệt”.
  - In `/admin`, approve the submission; refresh `/` and confirm the new station appears (after cache invalidation).

