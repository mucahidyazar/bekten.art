# Bekten Art

Bekten Art is a multilingual portfolio and content platform built with Next.js,
React, PostgreSQL/Prisma, Garage object storage, NextAuth and Resend. Public
URLs always use an explicit locale prefix: `en`, `tr`, `ru` or `ky`.

## Architecture

The application is deployed as one Next.js service. Server-only domain modules
own validation and business rules, repositories encapsulate Prisma access, and
route handlers/server actions enforce authentication and request-boundary
security. PostgreSQL is the source of truth for users, content, media metadata,
audit events, rate limits and the email outbox. Garage stores private media
objects; public delivery is mediated by the application. Resend sends
transactional mail from durable outbox jobs.

```text
Browser -> Next.js pages/API -> domain service -> repository -> PostgreSQL
                               |              -> Garage (private objects)
                               +--------------> Resend (outbox dispatcher)
```

The approved V2 migration removes public accounts, Credentials and Google OAuth.
Its target identity model keeps NextAuth only for private Bekten Studio email
magic-link sessions. Until V2 step S3 is deployed, the current production
revision still uses Google OAuth; follow `docs/progress.md` for cutover status.
GTM/GA are loaded only after the visitor's consent decision. No legacy database
or object-storage runtime is used.

## Local development

Requirements:

- Node.js 24
- pnpm 11.21.0
- PostgreSQL 17-compatible database

Copy `.env.example` to an ignored local environment file and populate only the
values needed for the flow you are testing. Never commit credentials.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

The application is available at `http://localhost:3000`. For local development,
set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to that same origin.

## Quality gates

```bash
pnpm lint
pnpm type-check
pnpm test:coverage
pnpm build
pnpm e2e
pnpm audit --prod --audit-level=high
```

All pull requests and pushes to `main` run the same static, test, build, audit
and container-build gates in GitHub Actions.

## Database and production

Prisma migrations are additive and live in `prisma/migrations`. The production
container runs `prisma migrate deploy` before starting the standalone Next.js
server. Take and restore-test a PostgreSQL backup before every data or schema
cutover.

- `GET /api/health` is the dependency-free liveness probe.
- `GET /api/ready` verifies the production contract, PostgreSQL and Garage
  without exposing provider errors or secrets.
- `POST /api/email/outbox` and `POST /api/operations/retention` are
  scheduler-only, bearer-protected bounded jobs.
- `Dockerfile.prod` builds and runs as an unprivileged user.

The complete deployment, backup, rollback and incident procedure is in
[`docs/operations/production.md`](docs/operations/production.md).

## Environment contract

The authoritative key list is `.env.example`. Production requires:

- canonical application and NextAuth URLs;
- PostgreSQL connection URL;
- GTM/GA identifiers;
- during the pre-S3 V1 runtime only, the existing Google OAuth client; after the
  verified S3 cutover, Studio email auth replaces this requirement;
- a dedicated Garage bucket and scoped access key;
- Resend API key, verified sender and working support reply-to address;
- Resend webhook signing secret and an outbox scheduler secret;
- an explicit trusted-proxy flag for the Coolify boundary.

Production readiness fails closed when this contract is incomplete.

## License

See [`LICENSE`](LICENSE).
