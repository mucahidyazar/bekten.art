# Bekten Art Production Transformation Design

## Context

Bekten Art is a Next.js 16 application backed by PostgreSQL and Prisma. The
current runtime still carries a Supabase-shaped compatibility facade, uses
PocketBase for media, contains incomplete admin/product surfaces, and lacks the
security, observability, testing, SEO and accessibility gates required for a
production release.

The Heremio project is the reference implementation for operational patterns.
Its strongest reusable qualities are its repository/service/handler boundaries,
S3-compatible Garage adapter, production environment validation, health checks,
secured admin composition, Resend mailer and Docker/Coolify deployment shape.
Its Drizzle ORM and product-specific domain model are not requirements for this
project.

## Approaches considered

### 1. Full Heremio monorepo and Drizzle migration

This would maximize structural parity, but it would also replace a working
Prisma schema and migration history, introduce workspace complexity and force a
large data migration unrelated to the product requirements.

### 2. Patch the current architecture

This would be the shortest path, but it would preserve the Supabase facade,
page-local data access and duplicated action code that caused the current
maintenance and performance problems.

### 3. Selective architectural port (selected)

Keep the single Next.js application and Prisma/PostgreSQL foundation, remove the
Supabase facade completely, and port Heremio's backend boundaries and
production patterns. This provides the architectural benefit without an
unnecessary ORM or monorepo rewrite.

## Target architecture

The server-side dependency flow will be:

```text
App Router page / route / server action
  -> configured handler or service
  -> domain service
  -> typed Prisma repository
  -> PostgreSQL
```

Cross-cutting boundaries will be isolated under `src/server`:

- authentication and authorization
- browser mutation/origin guards
- rate limiting
- object storage
- email delivery
- production environment validation
- health/readiness and structured logging
- admin query and mutation services

Prisma remains the ORM and source of schema migrations. All Supabase-named
runtime modules, SQL snapshots and import-only compatibility artifacts will be
removed after their data paths have been replaced.

The generic `SectionData.data` JSON table is a migration source, not the target
domain model. Typed tables are introduced additively for artwork, news, press,
testimonials, workshops, memories, artist facts, contact data, feedback,
newsletter subscriptions, media, audit events, outbox jobs and rate limits.
Each vertical slice is dual-read/backfilled and count-verified before the legacy
JSON path is retired. This prevents a flag-day schema cutover while eliminating
the runtime type ambiguity that currently leaks into pages and admin actions.

## Media and Garage

PocketBase will be replaced with a provider-neutral object storage contract and
an AWS SDK v3 Garage implementation. Garage is configured with a private,
dedicated bucket, explicit region, endpoint, credentials and
`forcePathStyle: true`.

Uploads are admin-only, size-bounded and MIME/signature validated. The database
stores the Garage object key and immutable metadata, not provider record IDs.
Public media uses a stable application URL backed by a cacheable read route so
private Garage credentials and expiring signed URLs never appear in persisted
content.

A one-time migration script will copy existing PocketBase objects to Garage and
update their database records transactionally. After migration verification,
PocketBase code and environment variables are removed.

## Authentication

The user explicitly requires a stable NextAuth release. The application will
migrate from the v5 beta API to the latest stable `next-auth` v4 line and use its
Prisma adapter. Credentials and Google OAuth remain enabled.

JWT sessions will persist only bounded identity and authorization state. Login
and registration receive database-backed rate limits, generic authentication
errors, normalized callback URLs and same-origin redirect enforcement. Profile
data is separated into public and owner/admin views to close the current IDOR
path.

## Google analytics and consent

Google OAuth, GTM and GA4 remain. Tracking loads only after explicit analytics
consent and uses Consent Mode v2 defaults/updates. GTM and GA4 identifiers are
validated, duplicate pageview emission is prevented, and CSP explicitly allows
only the required Google origins. Cookie removal is performed when consent is
revoked.

## Email and Resend

Resend provides transactional delivery. `mucahid.dev` is already verified in
the authenticated Resend account. The application uses a branded sender on the
verified domain and a separately configurable reply-to mailbox. The mailer has
validated server-only configuration, text and HTML variants, idempotency keys,
and non-sensitive delivery logging.

Initial email flows are password reset, contact/inquiry notification,
newsletter confirmation and relevant admin notifications. Delivery failure is
reported to the caller without leaking provider responses.

## Admin product surface

The admin area receives a dedicated route-group shell rather than being
conditionally embedded in the public layout. Navigation is role/capability
checked and keyboard accessible.

The production module set is:

- Overview with real database metrics and recent persisted activity
- Content management for sections, news, store, artist, workshop, memories and
  testimonials
- Media library backed by Garage and Instagram sync metadata
- Users and access management
- Contact and inquiry management
- Email/newsletter management and delivery status
- System status for database, storage, email and release configuration
- Audit history for administrative mutations

Heremio's platform-specific billing, affiliate, moderation and account deletion
screens are not copied because they do not belong to Bekten Art's product model.

## SEO, accessibility and performance

Every public language receives an explicit, crawlable locale-prefixed URL.
Canonical, hreflang, sitemap, breadcrumbs and redirects share one localized URL
utility. `robots.txt` and `sitemap.xml` bypass locale/auth middleware. Only
canonical public pages appear in the sitemap.

Page-specific metadata and structured data are generated from real content.
Every indexable page has a coherent heading hierarchy. The locale code for
Kyrgyz is `ky`.

The WCAG 2.1 AA target includes native interactive semantics, visible focus,
skip navigation, labels, accessible names, contrast, reduced-motion behavior,
media controls and automated axe coverage.

Public reads use request deduplication and explicit revalidation. Homepage
sections are batched/parallelized, news detail uses a targeted query, duplicate
user lookups are removed and global media/player cost is deferred until needed.

## Production operations

The production image uses a current Node LTS image, pnpm, Next standalone
output, non-root execution and an application healthcheck. Startup validates
production environment variables and applies Prisma migrations before serving.

Coolify will receive the Garage, Resend, auth, Google and canonical URL settings
only after the application contract is finalized. Secrets are created and
transferred within authenticated browser sessions and are never written to the
repository or reported in chat.

## Testing and release gates

Changes follow RED/GREEN/refactor cycles with Vitest, React Testing Library and
Playwright. The required final gates are:

- unit/integration tests green
- critical user journeys green in Playwright
- at least 80% coverage for the production modules introduced or materially
  changed by this transformation
- lint and TypeScript clean
- Prisma schema and migrations validated
- production build and Docker build green
- production dependency audit triaged with no unresolved critical/high finding
  reachable from the application
- accessibility and SEO browser assertions green
- health/readiness and Coolify deployment verified
- no PocketBase/Supabase runtime code, mock admin data, placeholder actions or
  broken navigation paths remain

## Data safety

Existing uncommitted user changes are preserved. Database and media migrations
are additive first and destructive cleanup occurs only after verification.
External secrets stay outside Git. Every admin mutation and migration failure is
explicitly surfaced and can be retried without duplicating state.
