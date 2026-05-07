# Chef Dashboard Summer Architecture Audit

## Target Architecture

- Frontend: static GitHub Pages assets.
- Backend API: Cloudflare Worker.
- Local API base: `http://127.0.0.1:8787`.
- Production API base: `https://YOUR-WORKER.workers.dev`.
- Static data fetches stay relative to the frontend.
- Admin API fetches must go through `js/apiConfig.js`.

## API Contract

Admin API calls use `adminFetch()` from `js/adminAuth.js`, which resolves relative API paths with `API_BASE`.

Active Worker routes:

- `POST /api/admin/extract-url`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `POST /api/recipe/validate-patch`
- `POST /api/recipe/save-draft`
- `POST /api/recipe/commit-patch`

All Worker route responses are JSON. Missing API routes return JSON `404`; wrong methods return JSON `405`.

## Recipe Extraction Flow

1. Admin UI posts `{ "url": "https://..." }` to `${API_BASE}/api/admin/extract-url`.
2. Worker fetches the public recipe URL.
3. Worker extracts JSON-LD/schema.org data when available.
4. Worker falls back to HTML extraction.
5. Worker normalizes through `normalizeRecipe.js`.
6. Worker validates through `validateRecipe.js`.
7. Admin UI opens an editable extraction preview.
8. Corrected draft enters the existing create recipe editor.
9. Validation and patch preview update live.
10. Apply patch saves the recipe into the in-memory admin recipe system for local testing.

## Diagnostics

- Frontend logs `API BASE: ...`.
- `adminFetch()` logs the resolved API request URL.
- Worker logs route, source URL, extraction failures, and validation result.
- Extraction JSON parsing errors include response URL, content type, and an HTML/text snippet.

## Remaining Production Tasks

- Replace `https://YOUR-WORKER.workers.dev` in `js/apiConfig.js` with the deployed Worker URL, or configure `window.CHEF_DASHBOARD_API_BASE`.
- Re-enable production admin authentication by turning off the development bypass.
- Connect create recipe patches to durable persistence or GitHub commits when ready.
