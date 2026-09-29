# Deployment and operations

## Supported deployment shape

One Node process serves the built React client, API and Socket.IO over one origin. SQLite and uploads live on a durable, backed-up volume. Use HTTPS at the reverse proxy. This is a single-instance deployment, not a horizontally scaled SaaS cluster.

The provided Docker/Compose files were prepared for deployment but cannot be considered host-verified until a Docker build and a staging rollout pass on your chosen host. Docker was not installed in the implementation environment. No service was published.

## Build and release

1. Run `npm ci` and `npm --prefix server ci`.
2. Run `npm test`, `npm run lint`, `npm run build` and both dependency audits.
3. Set `APP_URL` to the exact public HTTPS origin. Set `CORS_ORIGINS` to that origin. Use independent random access/refresh secrets of at least 32 characters. Never reuse the example values.
4. Set `DATABASE_URL=file:/data/erpzo.db` and `UPLOAD_DIR=/data/uploads`. Persist `/data`.
5. Run `docker compose build`, then `docker compose up -d` behind an HTTPS reverse proxy. Enable WebSocket upgrades and forward the original host/protocol. The supplied Compose port binds only to loopback.
6. The container runs versioned migrations before starting. Check `/api/health/ready` and container logs.
7. Bootstrap a platform administrator once, using temporary environment variables and `node server/scripts/bootstrap.js` inside the container. Never run the demo seed.
8. Validate school onboarding/login, a student admission, attendance, a document upload/download, and a support response in staging. Test refresh and logout over HTTPS.

Set `TRUST_PROXY_HOPS` only to your actual trusted proxy hop count. The included example assumes one reverse proxy. Configure proxy timeouts and upload size (at least 10 MB for documents). Keep the frontend and API on the same origin; refresh cookies use SameSite=Strict.

The optional `render.yaml` now uses the Docker runtime with a persistent disk instead of incorrectly pairing SQLite with PostgreSQL. A disk-capable service is required. See the [Render Blueprint reference](https://render.com/docs/blueprint-spec) and [persistent disk documentation](https://render.com/docs/disks).

## Existing databases and migration baseline

Never run `prisma migrate reset` on an existing school database. This repository's initial migration represents the complete current schema. For a database without migration history:

- Stop writes and create a verified backup.
- Compare the database and the Prisma schema. Review any differences and migration SQL before applying changes.
- Only when the database matches the initial schema, run `npx prisma migrate resolve --applied 202609180001_initial` from `server/`.
- Use `npm --prefix server run db:migrate` for future versioned migrations.

The current local database was backed up before non-destructive schema synchronization and then baselined. That does not authorize resetting databases elsewhere.

## Backup and restore

Run `npm --prefix server run db:backup -- /absolute/backup/directory`. It uses SQLite `VACUUM INTO` for a consistent database snapshot, copies uploads and writes a manifest. Pause document/avatar writes if you require a single point-in-time match between uploads and the database. Store encrypted copies off-host with a retention policy.

Restore drill: stop a separate test server; copy the backed-up `erpzo.db` and uploads to a new directory; point `DATABASE_URL` and `UPLOAD_DIR` there; start the test server and check login, record counts and a file download. Do not overwrite the live database during a drill. A platform configuration JSON export is not a database backup.

## External services

SMTP: configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, optional `SMTP_USER`/`SMTP_PASSWORD`, and `MAIL_FROM`. Verify delivery and reset-link origin in staging. Secrets belong only in the server environment.

School payments: configure the relevant Stripe/Connect or regional provider credentials and callback URLs. Verify successful, cancelled, failed, duplicate and refunded payment paths in the provider sandbox before enabling live payments. Platform subscription payments in this release are manually recorded, not automated charges.

## Flutter mobile release

The app uses `--dart-define=API_BASE_URL=https://your-domain.example`. Its development default is Android emulator localhost (`http://10.0.2.2:3000`). For Flutter web use `http://localhost:3000`; a physical device requires a reachable LAN address and a development CORS entry where applicable.

```sh
flutter pub get
flutter analyze --no-fatal-infos
flutter build apk --release --dart-define=API_BASE_URL=https://your-domain.example
```

Release builds reject a non-HTTPS API URL. Android release signing requires `erpzo_app/android/key.properties` with `storeFile`, `storePassword`, `keyAlias` and `keyPassword`; the keystore and properties file must remain private. The build no longer silently uses a debug signing key. Choose your production application ID before app-store publication. iOS requires macOS/Xcode signing and device testing, which was not available in this Windows environment.

The web build and Flutter analysis do not replace real Android/iOS login, token-refresh, notification, payment-return and update-install tests. Existing APKs in the repository predate these changes and were not replaced.

## Release blockers to confirm on the chosen host

- Docker image build, persistent-volume ownership and restart persistence.
- Public domain, TLS, proxy/WebSocket configuration, secrets and admin bootstrap.
- Backup/restore drill and operational monitoring.
- SMTP and any payment-provider sandbox checks.
- Signed mobile artifacts and physical-device tests if releasing the mobile app.
- Load/soak testing for your intended school and concurrent-user count. Migrate off SQLite before deploying multiple app instances.
