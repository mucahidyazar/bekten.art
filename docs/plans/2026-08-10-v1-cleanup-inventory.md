# Bekten.art V1 Cleanup Inventory

**Status:** Execution inventory for V2 step S1  
**Rule:** `backup/` is temporary and cannot be imported by runtime, tests,
scripts, Prisma or build tooling.

## Remove now

These paths implement public account/profile behavior that has no V2 use. Git
history is sufficient recovery; they do not need a temporary source backup.

### Public authentication pages and UI

- `src/app/[locale]/(root)/(auth)/`
- `src/app/[locale]/(root)/auth/`
- `src/app/[locale]/(root)/confirm-email-action/`
- `src/components/forms/sign-in-form.tsx`
- `src/components/forms/sign-up-form.tsx`
- `src/components/forms/password-reset-forms.tsx`
- `src/components/forms/password-reset-forms.test.tsx`
- `src/components/molecules/auth-section.tsx`
- `src/components/molecules/sign-out-button.tsx`
- `e2e/auth-validation.spec.ts`

### Profile and public user UI

- `src/app/[locale]/(root)/profile/`
- `src/components/organisms/profile-form.tsx`
- `src/components/providers/user-provider.tsx`
- `src/types/ui-user.ts`

### Public-account APIs and services

- `src/app/api/auth/register/`
- `src/app/api/auth/forgot-password/`
- `src/app/api/auth/reset-password/`
- `src/app/api/auth/verify-email/`
- `src/app/api/auth/admin-check/`
- `src/server/auth/credentials.ts`
- `src/server/auth/credentials.test.ts`
- `src/server/auth/email-verification.ts`
- `src/server/auth/email-verification.test.ts`
- `src/server/auth/database-email-verification.ts`
- `src/server/auth/database-email-verification.test.ts`
- `src/server/auth/configured-email-verification.ts`
- `src/server/auth/password-reset.ts`
- `src/server/auth/password-reset.test.ts`
- `src/server/auth/database-password-reset.ts`
- `src/server/auth/database-password-reset.test.ts`
- `src/server/auth/configured-password-reset.ts`
- `src/server/email/auth-email-outbox.ts`
- `src/server/email/auth-email-outbox.test.ts`
- `src/server/email/configured-auth-email-outbox.ts`

`src/auth.ts`, the NextAuth handler/adapter/session types and generic
authorization/rate-limit/origin helpers are retained temporarily because S3
reconfigures them into the Studio-only email provider before deleting the unused
Credentials/Google branches.

## Move to temporary backup

These presentation files are useful visual/interaction references for Studio or
the V2 public catalogue. Preserve original relative paths below `backup/v1/`.

### Admin presentation reference

- `src/app/[locale]/(root)/admin/`
- `src/components/admin/`
- `src/server/admin/`

### Store presentation reference

- `src/app/[locale]/(root)/store/`
- `src/components/sections/store-section.tsx`
- `src/components/sections/home-store-section.tsx`

The backup manifest must explain each preserved group and its intended V2 target.
Files keep their content but are excluded from TypeScript, ESLint, Vitest and
framework route discovery.

## Rework in place during cleanup

- `src/app/[locale]/layout.tsx`: remove public user preload/provider and music
  surface; keep locale messages, consent, GTM and hreflang.
- `src/app/[locale]/(root)/layout.tsx`: remove user props and V1 breadcrumbs where
  routes disappear; preserve skip link and `main#main-content`.
- `src/components/organisms/header.tsx`: temporary account-free public chrome.
- `src/components/navbar.tsx`: remove store/admin/auth links and use only valid
  public V1 bridge routes until V2 IA lands.
- `src/components/molecules/app-tools.tsx`: locale tools only; no account/admin.
- `src/components/molecules/section-header.tsx`: remove edit/admin affordance.
- `src/app/[locale]/(root)/page.tsx`: remove store query/section and public user
  assumptions.
- `src/services/sections.ts`: remove store-specific exported read.
- `src/app/sitemap.ts`, `src/app/robots.ts`, breadcrumbs and OG route: remove
  deleted-route references and block `/studio`.
- `public/locales/*/common.json`: remove auth/store/admin copy after source
  references are gone.
- `src/app/api/uploads/route.ts`: keep Garage behavior; S3 replaces the legacy
  admin guard with Studio authorization.
- `src/app/api/cms/contact-info/`: retain temporarily but rename/rework under a
  kebab-case Studio API when its editor lands.
- `e2e/operations.spec.ts`: replace `/admin` expectations with removed-route and
  future `/studio` guard coverage.

## Keep as infrastructure

- `src/lib/db.ts`, Prisma client/config/migrations
- `src/server/content/`, `src/server/database/content.ts`
- `src/server/storage/`, `src/lib/media-library.ts`, Garage upload primitives
- `src/server/email/` except the public-account files listed above
- `src/server/operations/`, audit, outbox, retention and health/readiness
- `src/components/consent/`, GTM consent and privacy controls
- `src/components/seo/`, localized-path and metadata helpers
- `i18n.ts`, locale routing and four public locale catalogs
- `Artwork`, `PressItem`, `ContactInfo`, `MediaObject`, `AuditEvent`, `OutboxJob`,
  newsletter and operational persistence
- `User`, `Account`, `Session`, `VerificationToken` and generic auth rate-limit
  persistence until S3 Studio auth cutover is verified

## Packages and environment follow-up

S1 may remove a dependency/env only if no kept path needs it. Expected final S3
removals include Credentials/Google/password dependencies and config:

- Candidate packages: `bcryptjs`; auth form-only dependencies are removed only
  if Studio forms do not use them.
- Candidate env: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and password-reset-only
  contracts.
- Keep: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`/`AUTH_SECRET` while NextAuth provides
  Studio sessions; `NEXT_PUBLIC_APP_URL` remains the canonical public origin.

## S1 proof

```bash
! rg -n "backup/" src e2e scripts prisma
! find src/app -type f | rg '/(sign-in|sign-up|forgot-password|reset-password|profile|store|admin)/'
pnpm lint
pnpm type-check
pnpm test
pnpm build
git diff --check
```
