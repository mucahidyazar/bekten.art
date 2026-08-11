# Production operations

## Deployment contract

Bekten Art runs on Coolify from `Dockerfile.prod`. Configure secrets only in the
Coolify environment-variable store. Secret values must never be copied into the
repository, build arguments, screenshots, logs or incident notes.

Required public build variables are the canonical application URL and Google
measurement/container identifiers. Database, auth, Garage and Resend credentials
are runtime-only variables. `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` must have
the same HTTPS origin. Behind Coolify, `AUTH_TRUST_PROXY` must be exactly
`true`. Coolify's proxy must overwrite (or append its own address to) forwarded
client-IP headers; the application intentionally consumes only the rightmost
valid `X-Forwarded-For` hop. Configure the proxy to reject request bodies larger
than 16 KiB on the Dashboard magic-link endpoint as an outer resource limit;
the application enforces the same limit before parsing the form body.

## Pre-deploy checklist

1. Run `pnpm lint`, `pnpm type-check`, `pnpm test:coverage`, `pnpm build` and
   `pnpm audit --prod --audit-level=high` on the exact revision.
2. Build `Dockerfile.prod` with the production public build variables.
3. Create a PostgreSQL custom-format backup and record its SHA-256 checksum.
4. Restore that backup into an isolated PostgreSQL 17 instance and verify
   critical table counts.
5. Run `node scripts/preflight-v2-cutover.mjs` against the restored database;
   any `V2_CUTOVER_*` failure blocks the release.
6. Confirm the Garage bucket is private and the application key has only read
   and write access, never owner access.
7. Confirm the Resend sender domain is verified and the reply-to mailbox accepts
   a real reply.
8. Confirm the Dashboard magic-link callback origin matches canonical HTTPS and
   the configured editor email has an `EDITOR`, `OWNER` or `ADMIN` role.

## Deploy

The container entrypoint validates the production contract, proves legacy V1
media/content has a typed V2 target, performs `prisma migrate deploy` and starts
the standalone server only if every gate succeeds. The application has no legacy
object-storage startup mode or fallback; all media reads and writes use the
private Garage bucket through the typed media catalog.

Configure Coolify's health check to `/api/ready`. `/api/health` remains the
dependency-free liveness endpoint for diagnostics, but it must not be used as a
deployment readiness gate.

After deployment:

1. Require `200` from `/api/health` and `/api/ready`.
2. Verify locale redirects, one public content page and one media response.
3. Request and consume a Dashboard magic link for an allowed editor; verify an
   unapproved email cannot obtain Dashboard access.
4. Verify the language coverage matrix and one draft/publish edit in a
   non-English locale.
5. Submit an inquiry and newsletter subscription and confirm outbox delivery.
6. Upload one image to Garage, publish it through the Dashboard and verify its
   public media response.
7. Verify consent deny, grant and revoke paths; no GTM/GA request may occur
   before consent.

## Scheduled operations

Configure these Coolify scheduled tasks after the first healthy deployment. Both
routes use the runtime-only `OUTBOX_DISPATCH_SECRET` and return non-2xx on
authorization or processing failure.

- Every minute (`* * * * *`), dispatch a bounded mail batch:

  ```sh
  node -e "const port=process.env.PORT||'3000';fetch('http://127.0.0.1:'+port+'/api/email/outbox',{method:'POST',headers:{authorization:'Bearer '+process.env.OUTBOX_DISPATCH_SECRET}}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status)})"
  ```

- Daily at 03:15 UTC (`15 3 * * *`), purge expired feedback, rate-limit buckets,
  completed outbox jobs, webhook receipts and auth tokens:

  ```sh
  node -e "const port=process.env.PORT||'3000';fetch('http://127.0.0.1:'+port+'/api/operations/retention',{method:'POST',headers:{authorization:'Bearer '+process.env.OUTBOX_DISPATCH_SECRET}}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status)})"
  ```

The retention endpoint deletes at most 500 records per category per run, so a
large backlog drains incrementally without a long-running table-wide delete.

## Backup and restore

Use PostgreSQL's custom format so individual objects can be inspected and the
backup can be restored into an isolated database. Store the dump and checksum
outside the application repository. A backup is accepted only after a full
restore test and critical-record count comparison.

Garage objects are immutable during backup verification. Record object key, byte
length and SHA-256, then read each object back and compare the digest when
validating a storage restore.

## Rollback

An application-only rollback may use Coolify's previous image only when no
database migration was applied. The V2 removal migrations are one-way and the
previous image is not compatible with the migrated database. If the cutover must
be reversed, stop writes, restore the verified pre-cutover backup into a new
database, point Coolify to that database, deploy the matching previous image and
re-run readiness and smoke checks. Never run ad-hoc destructive down migrations
during an incident.

Do not delete a Garage backup until database metadata, public media responses
and the restore path have all been verified.

## Incident response

- Treat `/api/health=200` with `/api/ready=503` as a dependency/configuration
  incident; inspect structured server logs and provider dashboards.
- Rotate a credential immediately if it appears in output or source control.
- Revoke old Garage/Resend credentials after the replacement is live.
- Do not expose raw provider errors to users; correlate by timestamp and the
  structured event name in server logs.
