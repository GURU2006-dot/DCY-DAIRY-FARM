# DCY DAIRY FARM
### Freshness You Can Trust

A full-stack dairy storefront and private admin console built with React, TypeScript, Vite, Tailwind CSS, Express and PostgreSQL. The customer site includes a database-backed product catalogue, persistent browser cart, server-priced WhatsApp order requests and customer enquiries. Administrators can manage products, categories, orders, enquiries and public business settings.

> **Only supplied business details are configured.** The connected DCY business profile contains DCY DAIRY FARM, “Freshness You Can Trust,” Madanapalli, Andhra Pradesh, and the supplied WhatsApp number. The migration itself seeds only the name and tagline; a fresh database needs the remaining supplied settings entered separately. Other contact details, opening hours, social links, pack sizes, product descriptions and prices remain editable placeholders. Milk, Curd, Ghee and Paneer are saved in the connected database as unavailable, unpriced drafts until the farm confirms details. Generated farm/product photography is representative placeholder imagery—not a photograph of the DCY farm or a verified product. Preview orders and enquiries are not saved or sent.

## Project structure

```text
.
├── backend/
│   ├── migrations/             # PostgreSQL schema migrations
│   ├── src/                    # Express API, validation, auth, migration/bootstrap tools
│   ├── uploads/                 # Local development image uploads (ignored by git)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/images/          # Site photography (AI-created project assets)
│   ├── src/                    # React + TypeScript application
│   ├── .env.example
│   └── package.json
├── .env.example
└── package.json                # npm workspace commands
```

## Features implemented

### Customer storefront
- Responsive home, About, catalogue, product detail, cart, checkout and contact pages.
- Forest-green / cream / gold visual system using the supplied CSS variables; Playfair Display and DM Sans font stacks with local fallbacks.
- Catalogue search, category filters, sorting, price/unit, image and availability display; unpriced drafts show “Price to be confirmed” and cannot be ordered.
- Cart quantity controls and persistence in `localStorage` (cart only; products, orders and enquiries use PostgreSQL).
- Checkout sends product IDs and quantities only. The API looks up current prices and availability, stores the order and line-item snapshots in a transaction, then returns an encoded `wa.me` order message.
- Explicit notice that opening WhatsApp does not confirm payment or order acceptance.
- Enquiry form with server-side validation, rate limiting and a honeypot.
- No real product prices, address, phone, certifications or farm claims are asserted.

### Administrator
- Session-based login with bcrypt password hashes, protected endpoints and secure cookie settings.
- Dashboard metrics and order activity chart sourced from database records (no mock statistics).
- Product CRUD, image upload validation, availability switches and category management. Prices are editable in Admin; a product cannot be made available until a positive confirmed price is entered.
- Order search, status management and expanded delivery/item details.
- Enquiry search, read/resolved actions and deletion.
- Business settings for the name, tagline, WhatsApp/contact number, email, address, hours and social links.
- No public/default admin account. Bootstrap an admin through the documented one-time command.

### Backend and data
- PostgreSQL migrations for `admin_users`, `products`, `categories`, `orders`, `order_items`, `enquiries` and `business_settings`, plus indexes, checks, references and timestamps. Product prices may be null only for unavailable drafts; checkout uses server-side configured prices.
- JSON REST API, server validation, parameterized SQL, rate limits, image size/type/signature checks, secure cookies and environment-only secrets.
- Optional sample database seeder is opt-in, development-only, and tags records `is_sample`; sample products cannot be ordered.

## Requirements
- Node.js 20+ and npm 10+.
- PostgreSQL 14+ (managed PostgreSQL is recommended for deployment).

## Local setup

1. **Install workspace dependencies**
   ```bash
   npm ci
   ```

2. **Configure the backend**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Set `DATABASE_URL` to your PostgreSQL connection string and replace `SESSION_SECRET` with a strong random secret (for example, `openssl rand -base64 48`). The backend loads `backend/.env` first and the repository-root `.env` as a fallback (where Neon CLI writes project variables). For a local, non-SSL PostgreSQL instance, set `PGSSLMODE=disable` in `backend/.env`. Do not commit `.env` files.

3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

4. **Create the first administrator securely**
   Set `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` in `backend/.env`. The password must be at least 14 characters and include upper/lowercase, a number and a symbol. Then run:
   ```bash
   npm run admin:init
   ```
   The command refuses placeholders, duplicate accounts and weak passwords; it never prints the password. Remove these bootstrap values from the runtime environment after initialization. Do not expose the backend bootstrap command publicly.

5. **Configure the frontend**
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```
   Keep `VITE_API_BASE_URL=/api` for same-origin deployments and set `VITE_DEMO_MODE=false` when the backend is configured. Vite proxies `/api` and `/uploads` to `http://localhost:3001` in development; set `API_PROXY_TARGET` if the API uses another local origin.

6. **Run the full application**
   ```bash
   npm run dev
   ```
   Frontend: `http://localhost:5173` · API: `http://localhost:3001/api/health`

   To run only the frontend as a **clearly labelled visual preview** with unpriced/unavailable placeholders, no database/API and no order/enquiry submissions:
   ```bash
   VITE_DEMO_MODE=true npm run dev:preview
   ```
   In PowerShell, set `$env:VITE_DEMO_MODE="true"` before `npm run dev:preview`. The sample catalogue never pretends to be live business data.

## Sample data (optional)

The normal migration creates the schema and default brand name/tagline, but does not insert products or customer information. The storefront preview uses isolated, unpriced placeholders. If you want sample rows in a disposable, non-production database:

```bash
# Set only for this command/session, and only against development data
ALLOW_SAMPLE_DATA=YES NODE_ENV=development npm run seed:sample
```

The seeder is opt-in, adds only unavailable unpriced placeholder products, tags them `is_sample=true` and refuses production. Never run it against production.

## API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public, rate-limited | Admin login |
| POST | `/api/auth/logout` | Session | End admin session |
| GET | `/api/auth/me` | Admin | Current session |
| GET | `/api/products`, `/api/products/:id` | Public | Catalogue and detail |
| GET | `/api/categories` | Public | Catalogue filters |
| POST/PUT/DELETE | `/api/products`, `/api/products/:id` | Admin | Product management |
| POST/PUT/DELETE | `/api/categories` and `/api/categories/:id` | Admin | Category management |
| POST | `/api/uploads/product-image` | Admin | Validated JPEG/PNG/WebP upload |
| POST | `/api/orders` | Public, rate-limited | Server-priced order save + WhatsApp link |
| GET | `/api/orders`, `/api/orders/:id` | Admin | Order management |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |
| POST | `/api/enquiries` | Public, rate-limited | Save customer enquiry |
| GET/PATCH/DELETE | `/api/enquiries` and `/api/enquiries/:id` | Admin | Enquiry management |
| GET/PUT | `/api/settings` | Public read / Admin write | Business profile |
| GET | `/api/admin/dashboard` | Admin | Database-backed statistics and chart data |
| GET | `/api/health` | Public | API/database health check |

Allowed order statuses: `PENDING`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`.

## Production build and deployment

```bash
npm run build
NODE_ENV=production npm start
```

Build the frontend first; Express serves `frontend/dist` if it exists (override with `FRONTEND_DIST_DIR`). Put the API behind HTTPS and a reverse proxy that forwards the original scheme and host. Set `NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET` (32+ random characters), and a persistent `UPLOAD_DIR`. The application uses secure, HTTP-only, same-site cookies in production. Keep frontend and backend on one origin; this app intentionally does not enable cross-origin credentials. If you split origins, add and test a strict origin allowlist with credentialed CORS and CSRF protections before release, and never point browser code at `localhost`.

The existing `.replit` file targets Replit Autoscale and runs a same-origin single-service build: `VITE_DEMO_MODE=false VITE_API_BASE_URL=/api npm run build`, then `NODE_ENV=production npm start`. Add `DATABASE_URL` (TLS-enabled) and `SESSION_SECRET` in Replit Secrets; the platform supplies `PORT`. Run `npm run db:migrate` against the intended database, and securely initialize the administrator once using `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` before enabling admin operations; remove the bootstrap values afterward. `VITE_` values are public at build time—never place secrets in them.

Uploaded images are stored locally under `backend/uploads` by default. Use a persistent volume or adapt the upload service to object storage before deploying to an ephemeral filesystem. Back up PostgreSQL and uploaded media independently.

## Business launch checklist

1. Confirm the supplied WhatsApp number in **Admin → Business settings** before release (international dialing code; digits are used in the click-to-chat URL).
2. Add a separate verified phone, email, full address, opening hours and social links only if the business supplies them.
3. Replace all demo content and sample imagery with business-approved product/farm photography and descriptions.
4. Set actual prices, units and availability in Admin → Products; confirm every listing with the business.
5. Update the About page placeholders and remove draft mission/vision wording unless approved.
6. Test a small order end-to-end and confirm the WhatsApp destination, customer summary, order persistence, delivery terms and status workflow.
7. Confirm privacy, cookie, retention, tax, shipping and legal requirements applicable to the business and deployment region.

## Verification commands

```bash
npm run test
npm run build
```

The backend unit tests cover request validation and sanitization. Database integration, real WhatsApp handoff, email/SMS delivery and live administrator authentication require a configured PostgreSQL instance and real business settings; do not treat the visual demo as proof of those integrations.
