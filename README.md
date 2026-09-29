# ERPZO school ERP and SaaS administration

ERPZO is a multi-tenant school management platform. A platform administrator onboards schools and manages subscription records, configuration and support. Each school administrator manages only their own school. Teachers and students have separate web portals and a Flutter mobile app.

## Architecture

- `src/`: React 19 + Vite web application, public inquiry pages and four role-based portals.
- `server/src/`: Express 5 API, Socket.IO messaging, JWT authentication, server-side role and tenant checks.
- `server/prisma/`: Prisma schema, versioned SQLite migration and optional demo data.
- `erpzo_app/`: Flutter teacher/student app. Administrators use the web application.
- `tests/`, `server/tests/`: browser regression checks and isolated database integration tests.
- `Dockerfile`, `compose.yaml`, `docs/DEPLOYMENT.md`: single-instance deployment and operations.

The database in this release is **SQLite**, including in the provided deployment. Do not supply a PostgreSQL URL to this schema. Multi-instance/cloud-native scaling requires a separately planned PostgreSQL migration, shared uploads, shared rate limiting and a Socket.IO adapter.

## Local setup

Use Node 24 LTS (minimum 22.12) and npm. From the repository root:

```sh
npm ci
npm --prefix server ci
```

Copy `server/.env.example` to `server/.env` only if you do not already have one. Generate two independent signing secrets with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

For a fresh database:

```sh
npm --prefix server run db:migrate
```

For an existing database, back it up first. Do not reset or reseed existing data. The local database used during this implementation has already been backed up, synchronized and baselined. Other installations should compare their schema before marking the initial migration as applied; see `docs/DEPLOYMENT.md`.

Create the first platform administrator using temporary environment variables `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (at least 12 characters), then run:

```sh
npm --prefix server run db:bootstrap
```

The bootstrap command never overwrites existing accounts. Remove the bootstrap password from the environment afterwards.

```sh
npm run dev
```

Open **http://localhost:5173**. The API runs on **http://localhost:3000**. The web development server proxies `/api`, `/uploads` and `/socket.io`. Sign in as platform administrator, onboard a school, and then sign in with the administrator credentials chosen for that school.

For a disposable demonstration database only, set `ALLOW_DEMO_SEED=true` and run `npm --prefix server run db:seed`. The seed contains known demo credentials and is blocked in production. Never deploy a database containing demo accounts.

## Verification

```sh
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
npm --prefix server audit --omit=dev --audit-level=high
```

`npm test` creates and migrates its own SQLite database under `server/work/`; it does not use your school database. It verifies tenant isolation, role grants, school onboarding, fees, documents, support, subscriptions and school operations.

Browser tests use Chrome through Playwright. `tests/local-admin-smoke.cjs` expects an independently seeded test API and web server at `http://localhost:5174`, or `SMOKE_URL`. It writes test schools and support tickets, so **never point it at production or your working school database**. It checks 61 admin views, browser onboarding, settings and support workflows, and captures errors/screenshots under `work/`.

`tests/account-switch.cjs` verifies session cache isolation against the built web app without a real API.

## Capability boundaries

- School/admin workflows and platform records use the database; empty data is displayed honestly.
- Subscriptions and platform payments are an **offline billing register**. Recording a payment does not charge a card. Coupons/addons/features are catalog records, not automatic billing or permission enforcement.
- Email/SMS/WhatsApp campaign screens save drafts. Campaign delivery adapters are not connected.
- Password recovery uses SMTP when configured; otherwise the UI directs users to an administrator. Password reset tokens are hashed, expire, and are consumed atomically.
- School fee payments have Stripe and regional-provider adapters. Live payment processing requires merchant credentials, provider onboarding, signed webhooks and sandbox verification. No live money was moved during testing.
- Documents are protected downloads stored in SQLite with a 10 MB upload limit. Public avatar files accept bounded image uploads.
- Impersonation is disabled. Login Activity shows each account's latest successful login, not a complete login-history ledger.
- Parent and staff records are managed by school administrators. Dedicated parent/staff web portals are not implemented.
- Platform website/branding settings are saved configuration; full automatic white-label website provisioning and custom-domain DNS are outside this release.

See `docs/DEPLOYMENT.md` for deployment prerequisites, backup/restore and mobile release requirements.
