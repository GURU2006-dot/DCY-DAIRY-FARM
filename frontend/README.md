# Customer storefront and administrator interface

React 18 + TypeScript + Vite + Tailwind CSS + React Router + Lucide React + Recharts.

Run from the repository root with `npm run dev` after configuring PostgreSQL and migrating it. The storefront is served on port 5173 and `/api` is proxied to the Express API on port 3001.

For a visibly labelled, read-only preview with isolated illustrative product data (no saved orders or enquiries), run `VITE_DEMO_MODE=true npm run dev:preview`.

Set `VITE_API_BASE_URL=/api` and `VITE_DEMO_MODE=false` for the connected application. `VITE_` variables are embedded in public frontend assets and must not contain credentials or server secrets. Details and pages are documented in the root README.
