# B2B Marketplace – Frontend

React + Vite + TypeScript SPA for the B2B MVP.

## Run

1. **Start the API** (from project root): `npm run start:dev`
2. **Start the frontend**: `npm run dev`
3. Open **http://localhost:5173**

The dev server proxies `/v1` to `http://localhost:3000`, so API calls work without CORS.

## Flows

- **Buyer:** Register → Log in → Add business + address → Discover providers → View catalog → Add to cart → Place order → My orders
- **Provider:** Register → Log in → Add provider (with address) → Add products → Orders → Confirm/reject → Update delivery → Create invoice

## Build

- `npm run build` – output in `dist/`
- `npm run preview` – serve `dist/` locally
