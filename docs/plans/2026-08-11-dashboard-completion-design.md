# Dashboard completion design

## Scope

Deployment and Coolify remain explicitly out of scope. This milestone finishes
the locally reviewable Bekten Studio workspace: dynamic public languages, the
refined shell, a three-view media manager, owner-managed access, searchable
activity history, and source-grounded editorial starter content.

## Product contract

- Owners can create a draft locale, translate it with English fallback,
  preview it, then activate or disable it. English remains prefixless; every
  other active locale uses its locale-code prefix.
- Translation rows stay compact: one collapsed key summary and two-line inputs
  for every registered language.
- The Dashboard shell uses one 64px header line. The sidebar wordmark has no
  “Studio” caption, and the collapse trigger is centered on the header/border
  intersection.
- Media has grid, list and desktop/icon views over one selection model. Virtual
  PostgreSQL folders organize Garage objects without changing object keys.
  Editors upload, rename and move; owners also delete. Context menus and drag
  and drop call the same validated server operations as explicit buttons.
- The media upload surface sits at the right edge of the Media Library header,
  not in a separate card. It uses an irregular translucent quatrefoil-shaped
  dropzone that gains contrast for drag-over, hover and keyboard focus; click
  and drop share the same validated upload path.
- `/dashboard/users` is owner-only. It supports invitation, role changes,
  suspension/reactivation and resend. The final active owner can never be
  demoted or suspended, including concurrent requests. Access changes revoke
  existing sessions.
- `/dashboard/activity` is owner-only and paginated. It filters by date, actor,
  action and entity. Display metadata is allow-listed and never includes raw
  tokens, email addresses, URLs, object keys or message bodies.
- Instagram continues through the existing Apify integration. Only verified
  caption/media pairs become editable editorial records. Public-source
  biography, exhibition and press summaries keep their source URL and remain
  explicitly replaceable in Studio.

## Architecture and data flow

All mutations enter through same-origin server actions or authenticated API
routes, validate with Zod, authorize again at the service boundary, execute in
PostgreSQL transactions and append an `AuditEvent`. Garage remains the binary
store; PostgreSQL remains the source of truth for folders, mutable display
names, editorial placement and permissions. Locale routing reads the active
`SiteLocale` registry server-side while a small safe fallback preserves the
four built-in locales when the database is unavailable.

## Failure and security behavior

- Public locale discovery fails closed to the built-in registry; draft and
  disabled locales never become public.
- Folder cycles, non-empty folder deletion, in-use media deletion and stale
  media versions are rejected.
- User-management responses avoid account enumeration outside the owner-only
  workspace. Invitation URLs are sealed in the existing outbox flow and are
  never persisted or logged in plaintext.
- Every list is bounded and cursor/page based. Audit metadata is sanitized at
  write and display boundaries.

## Verification

Each vertical slice follows RED → GREEN → refactor. Completion requires focused
coverage of at least 80%, full lint/type-check/unit/build gates, production-like
Playwright flows on desktop and mobile, and a final read-only security review.
Coolify configuration starts only after the user reviews the local result and
explicitly authorizes deployment.
