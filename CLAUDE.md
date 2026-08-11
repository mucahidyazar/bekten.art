# Bekten.art Project Guide

## Product direction

Bekten.art V2 is a multilingual editorial artist archive and a private,
project-specific content workspace called Bekten Studio. The approved product
contract lives in:

- `docs/plans/2026-08-10-bekten-art-v2-design.md`
- `docs/plans/2026-08-10-bekten-art-v2-blueprint.md`
- `docs/progress.md`
- `docs/readme.md`

Public accounts, profiles, direct sales, carts and payments are not part of V2.
Commercial contact uses availability inquiry, commission request and private
viewing flows. Public-facing demo copy must remain editable through Studio and
must not be presented as verified biographical or artwork data.

## Technology

- Next.js App Router, React and strict TypeScript
- pnpm (use the version declared by `packageManager`)
- PostgreSQL through Prisma
- Garage through the S3-compatible storage adapter
- Resend for transactional email and Studio magic links
- NextAuth + Prisma adapter only for private Studio sessions
- Tailwind CSS, Radix primitives and shadcn-style components
- next-intl with `en`, `tr`, `ru` and `ky` public locales (`kg` is the legacy
  message-catalog alias)

Do not introduce Supabase, PocketBase, public password login, Google OAuth,
storefront behavior or a second CMS.

## Architecture rules

- Prefer Server Components; add client components only for real interaction.
- Validate every external input with a schema at the system boundary.
- Keep database access behind repositories and business rules in services.
- Use Prisma transactions for multi-record state changes.
- Store media metadata in PostgreSQL and objects in Garage; never expose Garage
  credentials or raw private object keys.
- Use the transactional outbox for delivery work and keep handlers idempotent.
- Keep public and Studio authorization boundaries explicit and fail closed.
- New files, folders and route segments use kebab-case.
- Never import anything from the temporary `backup/` tree.

## Required workflow

For features and fixes, follow test-first RED -> GREEN -> refactor. Before a
checkpoint or completion run the relevant focused tests, then:

```bash
pnpm lint
pnpm type-check
pnpm test:coverage
pnpm build
pnpm e2e
pnpm audit --prod --audit-level=high
```

Maintain at least 80% statements, branches, functions and lines. Preserve WCAG
2.1 AA behavior, keyboard access, reduced-motion support, locale-aware URLs,
canonical/hreflang metadata and consent-gated Google analytics/media.

## Progress and decisions

Only mark an item `[x]` in `docs/progress.md` after code, tests and verification
evidence exist. Add user decisions or review-required choices to
`docs/readme.md`; do not silently invent product policy.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
