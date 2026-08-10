# Bekten.art V2 Construction Blueprint

**Objective:** Replace the V1 public portfolio/account/store experience with the
approved editorial-heritage public site and a private, non-technical Bekten
Studio built on PostgreSQL, Prisma, Garage, and Resend.

**Execution mode:** Direct commits on the current branch, with TDD RED and GREEN
checkpoint commits for production changes. `docs/progress.md` is the canonical
status list. `docs/readme.md` is the permanent decision log.

## Global invariants

Every step must preserve these constraints:

1. New files, folders and route URL segments use kebab-case.
2. Public login, registration, profile, user tools, cart, payment and store
   language do not survive V2.
3. Studio access is private magic-link auth; editor and owner capabilities are
   distinct.
4. PostgreSQL is the source of truth, Garage stores media, Resend sends mail.
5. Demo content is editable but cannot silently pass the production content
   readiness gate.
6. Every input boundary is schema-validated; mutations enforce origin,
   authorization, rate limits and auditability.
7. New business behavior follows RED → GREEN → refactor and keeps at least 80%
   statements, branches, functions and lines coverage.
8. Four public locales remain `en`, `tr`, `ru`, `ky`; metadata, canonical,
   hreflang and sitemap use the shared locale path contract.
9. WCAG 2.1 AA, keyboard use, visible focus and reduced-motion are release gates.
10. `backup/` is temporary, retains original relative paths, contains no secrets
    or production data, and is deleted before V2 completion.

## Dependency graph

```text
S0 design/baseline
  └─ S1 V1 cleanup
       ├─ S2 domain foundation ─┬─ S4 content publishing ─┬─ S7 public catalog
       │                        │                         ├─ S8 editorial pages
       │                        │                         └─ S10 media/revisions
       │                        └─ S5 inquiry platform ───── S9 inquiry pages
       └─ S3 Studio auth ───────── S6 Studio shell/CRUD ──── S10 media/revisions
S7 + S8 + S9 + S10 ─────────────────────────────────────────── S11 release audit
```

S2 and S3 may proceed in parallel after S1. S4 and the public/API portion of S5
may proceed in parallel after S2. Studio inquiry management belongs to S6 and
depends on S3 + S5. S10 depends on both S4 revision primitives and S6 Studio
shell. Public catalog/editorial pages can proceed alongside Studio CRUD once
their corresponding read contracts are stable.

## S0 — Approved design, decision log and baseline

**Context:** Visual references are under `docs/references/`; the approved design
is `docs/plans/2026-08-10-bekten-art-v2-design.md`. The V1 baseline was green on
10 August 2026: ESLint, Next typegen + TypeScript, 84 Vitest files / 464 tests,
and production webpack build.

**Tasks**

- Keep design, decisions and progress synchronized.
- Record current routes, dependencies and removal classifications.
- Adversarially review this blueprint before implementation.

**Verification**

```bash
git diff --check
pnpm check
```

**Exit:** Blueprint review has no unresolved critical/high finding; inventory is
specific enough to execute S1 without deleting reusable backend primitives.

## S1 — Controlled V1 removal and cleanup commit

**Context:** Remove public-account/store concepts first, as explicitly requested.
Preserve only parts that materially accelerate V2 and place those under a
temporary path that mirrors their original location.

**Tasks**

- Write removal contract tests for forbidden V1 routes, nav items and source
  imports; validate RED.
- Create `backup/manifest.md` with `original path → reason → V2 target` entries.
- Move reusable V1 presentation specimens into `backup/src/...`; do not move
  database, Garage, Resend, audit, outbox, consent, SEO or locale infrastructure.
- Exclude `backup/` from TypeScript, lint and framework discovery and add a
  source-import guard that runs in every later quality gate.
- Remove public auth/register/reset/verify/profile/user-provider/user-tools.
- Remove store/create-store UI, prices and transaction language.
- Remove the old `/admin` presentation shell while retaining server-side
  authorization/audit/repository primitives that V2 Studio will reuse.
- Remove dead tests, messages, packages and environment variables.
- Update robots/sitemap/navigation so removed routes cannot be published.
- Mark only evidence-backed S1 items in `docs/progress.md`.

**Verification**

```bash
rg -n "sign-in|sign-up|forgot-password|reset-password|profile|/store|/admin" src e2e
! rg -n "backup/" src e2e scripts prisma
pnpm lint
pnpm type-check
pnpm test
pnpm build
git diff --check
```

**Rollback:** Revert the cleanup commit. `backup/manifest.md` must allow targeted
recovery before wholesale revert.

**Exit:** No public V1 account/store/admin route is generated, kept infrastructure
still compiles, quality gates are green, and the cleanup is one isolated commit.

## S2 — Editorial domain foundation

**Context:** Existing typed content lacks `Collection`, `Exhibition`,
`JournalEntry`, editable `Page`, `Inquiry`, `ContentRevision` and structured
media placement. Begin additive; destructive schema cleanup waits until S11.

**Tasks**

- RED: schema/repository contract tests for locale, slug, status and ordering.
- Add `Collection`, `Exhibition`, `JournalEntry`, `Page`, `Inquiry`,
  `ContentRevision`, `ContentMediaPlacement` and required enums.
- Keep the existing `PressItem` table as the persistence model for the V2
  `PressEntry` domain contract during the additive cutover; add any missing slug
  or editorial fields now and defer a physical table rename to a verified later
  migration.
- Extend `Artwork` with collection, availability and editorial SEO metadata;
  stop exposing price fields in V2 contracts.
- Add EDITOR/OWNER enum values additively. During one release, authorize legacy
  `ADMIN` exactly as `OWNER`; migrate verified operator rows `ADMIN → OWNER` in a
  transaction; audit counts before/after; then remove the compatibility branch.
  Legacy enum labels may remain dormant because PostgreSQL enum deletion is
  destructive.
- Add additive migration, indexes, foreign keys and validated rollback notes.
- Implement Zod domain contracts and repository interfaces.
- Prove migrations against an isolated PostgreSQL restore.

**Verification**

```bash
pnpm prisma validate
pnpm db:generate
pnpm vitest run src/server/content
pnpm type-check
```

**Rollback:** Revert app reads and leave additive tables unused; never drop live
V1 tables in this step.

**Exit:** New models migrate on an isolated DB, contracts are typed and tested,
and no public route depends on unfinished Studio behavior.

## S3 — Private Studio magic-link authentication

**Context:** Public authentication is gone. Keep stable NextAuth session and
Prisma adapter infrastructure, but configure it only for role-gated Studio email
magic links. NextAuth already hashes email verification tokens at rest. Remove
Credentials, Google and every public registration/password-reset/profile flow.

**Tasks**

- RED: unknown email, unauthorized role, expired/replayed token, timing-safe
  response, same-origin and rate-limit tests.
- Configure the existing `VerificationToken`/adapter path for short-lived,
  one-use Studio links and verify its hashed-at-rest invariant with an integration
  test; do not create a second session/token implementation.
- Add `/studio/sign-in`, request-link POST and consume-token flow.
- Create the Studio session with secure cookie settings, short maximum age and
  database-backed revocation.
- Restrict access to EDITOR/OWNER; owner-only guard remains explicit.
- Queue mail through the transactional outbox; never await Resend in the public
  request path.
- Add audit events and retention cleanup for expired tokens/sessions.
- Remove credentials/password code paths, Google provider/config, public auth
  pages, registration/password-reset APIs and their unused packages/env/docs
  after the Studio email flow is green. Leave dormant password columns/data in
  place so S3 remains reversible; physical column/data deletion is deferred to
  S11's backup-verified destructive-cleanup window. The internal NextAuth handler
  remains only as the Studio session protocol endpoint.

**Verification**

```bash
pnpm vitest run src/server/studio-auth src/app/api/studio-auth
pnpm type-check
pnpm lint
pnpm playwright test e2e/studio-auth.spec.ts
```

**Rollback:** Disable Studio routes and revoke Studio sessions; content remains
unchanged.

**Exit:** No public account API exists, and the complete editor magic-link flow
passes unit, integration and browser tests.

## S4 — Revisioned publishing core

**Context:** Current publication only flips a status flag. V2 requires preview,
immutable history, publish snapshots, restore-as-new-revision and cache updates.

**Tasks**

- RED: draft visibility, preview authorization, optimistic conflict, publish,
  restore, audit and cache invalidation tests.
- Implement immutable snapshot revisions and monotonically increasing versions.
- Make publish a transaction: validate aggregate → create revision → update
  published state → audit → enqueue revalidation.
- Implement restore as a new revision; never mutate a historical snapshot.
- Add signed preview access for authorized Studio users.
- Add bounded cache revalidation job handling.

**Verification**

```bash
pnpm vitest run src/server/studio-content src/server/content
pnpm test:coverage
```

**Rollback:** Public reads stay on the last published snapshot; disable writes
while preserving the revision ledger.

**Exit:** Drafts cannot leak publicly and every publication/restoration is
transactional, auditable and cache-consistent.

## S5 — Premium inquiry platform

**Context:** Replace generic feedback/store conversion with availability,
commission, private-viewing and general inquiry aggregates.

**Tasks**

- RED: validation, origin, abuse, related-artwork snapshot, privacy consent,
  transaction/outbox, duplicate submission and retention tests.
- Add public inquiry API with type-specific schemas and generic success output.
- Persist inquiry and `inquiry.created` outbox job in one transaction.
- Extend Resend dispatcher templates without leaking private Studio links.
- Define repository operations for status, labels and internal notes; expose them
  only later through the authorized S6 Studio inbox.
- Extend retention cleanup for inquiry PII and completed jobs.

**Verification**

```bash
pnpm vitest run src/server/inquiry src/app/api/inquiries src/server/email
pnpm type-check
pnpm lint
```

**Rollback:** Disable submissions while preserving existing records and queued
notifications.

**Exit:** Each premium flow stores a typed inquiry, reliably notifies via outbox,
and is manageable without technical database access.

## S6 — Bekten Studio shell and content CRUD

**Context:** The editor is non-technical. Use domain language and task-based
screens; hide users, system health, cron, outbox and deployment details.

**Tasks**

- RED component/a11y tests for navigation, permissions, forms, empty/error/loading
  states and mobile behavior.
- Build `/studio` shell, dashboard and clear module navigation.
- Add works, collections, exhibitions, journal/press and pages CRUD.
- Add locale state, autosave/conflict handling, preview and publish affordances.
- Add inquiry inbox with filters, status, labels and notes.
- Split owner-only operations into an explicit protected module.

**Verification**

```bash
pnpm vitest run src/components/studio src/app/studio
pnpm test:coverage
pnpm type-check
! rg -n "backup/" src e2e scripts prisma
```

**Rollback:** Disable editing routes; public site continues from published data.

**Exit:** An editor can complete ordinary content/inquiry work without seeing
technical controls, and owner boundaries are proven by tests.

## S7 — Editorial public shell, works and collections

**Context:** Rebuild rather than reskin the V1 animated store. Preserve locale,
consent, SEO and accessibility infrastructure.

**Tasks**

- RED visual-structure and accessibility tests for skip link, headings, nav,
  artwork grids, keyboard focus and reduced motion.
- Implement editorial tokens, typography, parchment/grain, rust and restrained
  gold in CSS variables.
- Rebuild header/footer and locale-aware IA without user/admin links.
- Build home, `/works`, `/works/[slug]`, `/available-works`, `/collections` and
  `/collections/[slug]` from published repository reads.
- Use existing real archive images first; demo metadata remains Studio-editable.
- Add availability inquiry CTA without price/cart/payment language.

**Verification**

```bash
pnpm vitest run src/components/public src/app/\[locale\]
pnpm playwright test e2e/public-catalog.spec.ts e2e/accessibility.spec.ts
pnpm build
```

**Rollback:** Route old published data through a minimal read-only fallback shell;
do not restore store/account UX.

**Exit:** Core artwork discovery matches the approved references at desktop and
mobile, is fully localized, and passes accessibility/SEO checks.

## S8 — Exhibitions, artist, journal, press and archive

**Context:** Complete the editorial publication IA with the same design system
and publishing contracts as S7.

**Tasks**

- RED page contract, metadata and structured-data tests.
- Build exhibitions/detail, artist, archive, journal/detail and
  press-publications routes.
- Build editable informational page rendering for artist/studio/collectors.
- Update sitemap, breadcrumbs and schema.org types using published rows only.
- Remove renamed V1 `/news`, `/gallery` and `/about` routes or add deliberate
  permanent redirects with locale preservation.

**Verification**

```bash
pnpm vitest run src/app/sitemap.test.ts src/components/seo
pnpm playwright test e2e/editorial-navigation.spec.ts
pnpm build
```

**Rollback:** Keep permanent redirects pointed to the nearest valid V2 page.

**Exit:** All editorial routes have real DB reads, locale metadata and no broken
V1 URLs in navigation or sitemap.

## S9 — Commission, private viewing and inquiry UX

**Context:** Build premium, low-pressure conversion pages matching the reference
compositions and backed by S5.

**Tasks**

- RED form accessibility, validation, abuse and success/error-state tests.
- Build collectors, commission-a-work, private-viewings and contact pages.
- Build availability inquiry sheet/page from work detail.
- Use calm explanatory copy, explicit privacy consent and no sales urgency.
- Preserve user input on recoverable failures and announce status accessibly.

**Verification**

```bash
pnpm vitest run src/components/inquiry src/app/api/inquiries
pnpm playwright test e2e/inquiry-flows.spec.ts
```

**Rollback:** Disable forms with a contact fallback; never lose submitted DB rows.

**Exit:** All three premium conversion journeys complete through the real API and
outbox in integration/E2E evidence.

## S10 — Studio media, preview and revisions UX

**Dependencies:** S4 revision/publish primitives and S6 Studio shell/authorization
must both be complete.

**Context:** Current Garage primitives are strong, but Studio must support private
draft media, signed access, alt text, placements and history restoration.

**Tasks**

- RED unauthorized access, MIME/magic-byte, object-key, private URL, placement,
  reorder, deletion-in-use and restore tests.
- Add private media listing and signed preview without public ACL leakage.
- Add Studio media picker/upload, alt text, caption and cover/gallery ordering.
- Prevent deletion of referenced objects until references are intentionally
  removed or archived.
- Build revision timeline, comparison summary and restore confirmation.

**Verification**

```bash
pnpm vitest run src/server/storage src/components/studio-media
pnpm playwright test e2e/studio-editorial.spec.ts
```

**Rollback:** Disable upload/delete while preserving Garage objects and DB
metadata.

**Exit:** Editor can safely manage media and history end-to-end without making
draft assets public.

## S11 — Production cutover and completion audit

**Context:** Completion requires current-state proof for every objective, not the
absence of obvious errors.

**Tasks**

- Replace all remaining demo content with approved real content or keep the
  production content-readiness gate closed.
- Verify no public auth/profile/store/admin routes, copy, env or dependencies.
- Run migration/backup/restore rehearsal and verify Garage objects.
- Validate Resend domain, templates, outbox/retention jobs and webhook behavior.
- Run locale, SEO, accessibility, security and dependency audits.
- Delete `backup/` and prove no production import ever referenced it.
- Rebuild the production image and deploy through Coolify.
- Verify `/api/health`, `/api/ready`, public locales, Studio guard, inquiry and
  publish flows on the deployed revision.
- Complete every applicable item in `docs/progress.md`; record new decisions in
  `docs/readme.md`.

**Verification**

```bash
test ! -e backup
pnpm lint
pnpm type-check
pnpm test:coverage
pnpm build
pnpm e2e
pnpm audit --prod --audit-level=high
docker build -f Dockerfile.prod -t bekten-art-v2:local .
```

**Rollback:** Use the verified PostgreSQL backup, immutable Garage objects and
previous Coolify image. Production must not start on a partially migrated schema.

**Exit:** Every objective has direct file, test, build, migration and deployed
runtime evidence; only then may the V2 goal be marked complete.

## Plan mutation protocol

- A newly discovered blocking dependency may split a step, but may not narrow the
  final objective.
- Inserted steps must name dependencies, rollback and exit evidence.
- A skipped item requires a user decision recorded in `docs/readme.md`.
- No step may mark a broader `docs/progress.md` item complete using only a narrow
  unit test.
- Security or data-integrity regressions stop the affected stream until fixed;
  independent aligned work may continue.

## Known anti-patterns to reject

- Keeping public NextAuth screens “just in case”.
- Renaming `/admin` to `/studio` without simplifying the product model.
- Treating `Feedback` as Inquiry through copy-only changes.
- Publishing drafts by toggling one status flag without a revision snapshot.
- Exposing Garage private objects through permanent public URLs.
- Hardcoding reference-image titles/text into React components.
- Expanding remote image host allowlists instead of owning media in Garage.
- Adding an external CMS, commerce provider or Supabase compatibility layer.
- Marking demo content as production-ready.
