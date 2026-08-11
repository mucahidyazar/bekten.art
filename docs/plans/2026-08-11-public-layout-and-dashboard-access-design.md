# Public layout and dashboard access design

## Decision

The Collectors hero becomes the canonical composition for every public hero
that contains an image. A single reusable hero component owns the two-column
layout, display typography, artwork proportions, responsive behavior and the
real `public/img/frame.png` overlay. Routes may change copy and media, but not
the structural geometry. Hero images no longer opt out of the frame.

A single public container primitive owns maximum width and responsive inline
padding for the header, hero, page sections and footer. Full-bleed background
bands may remain full width, while their content always uses this primitive.

## Footer

The compact legal row is replaced with a three-column navigation row:

1. The existing Bekten logo on the left.
2. All works, Available works and Commission in the center.
3. Press and Privacy on the right.

The redundant `© 2026 Bekten` text is removed. A separate final attribution
row reads “Made with 💜 by mucahid.dev for bekten.art”; only `mucahid.dev` is an
external link and it uses safe external-link attributes.

## Dashboard access

The CMS remains at the canonical prefixless `/dashboard` route. Access is not
controlled by a client-visible environment allowlist. A normalized email must
exist in PostgreSQL with an `EDITOR`, `OWNER`, or migration-window `ADMIN`
role. The local development database will contain
`mucahidyazar@gmail.com` as `EDITOR`.

Local authentication uses the same Resend magic-link and database-session
flow as production. `.env.example` documents every required variable; the
ignored local `.env` receives complete local values without committing or
printing secrets. The public `/studio` route is unaffected.

## Verification

Tests first lock footer content/order, canonical hero framing, shared container
usage, dashboard allow/deny behavior and environment completeness. Verification
then includes focused coverage, global lint/typecheck/unit/build, desktop/mobile
Playwright and a real local magic-link request with the authorized email.
