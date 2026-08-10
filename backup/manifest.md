# Temporary V1 presentation backup

This directory contains presentation specimens retained during the V2 rebuild.
Each file keeps its original path below `backup/v1/` so it can be compared with
the V1 implementation without restoring a runtime route.

`backup/` is intentionally excluded from TypeScript, ESLint, Vitest and Next.js
route discovery. Runtime code, tests, scripts, Prisma and build tooling must not
import from it. The directory is temporary and must be deleted before V2
completion.

| Original path                                    | Reason retained                                                                                                            | Intended V2 target                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/app/[locale]/(root)/admin/`                 | Reference for the existing management information hierarchy, page compositions and interaction states.                     | S6 Bekten Studio shell and task-focused CRUD screens under `/studio`.                         |
| `src/components/admin/`                          | Reference for reusable dashboard layout, table, card and status presentation patterns.                                     | S6 Studio component system, adapted to editor/owner permissions and non-technical language.   |
| `src/server/admin/`                              | Reference for the data-shaping and repository boundaries used by the old management views; not an active backend contract. | S2 domain repositories and S6 Studio query services, rebuilt around V2 content aggregates.    |
| `src/app/[locale]/(root)/store/`                 | Reference for artwork-listing composition and create-flow interaction details, excluding V1 commerce behavior.             | S7 public works/collections catalogue and S6 Studio work editing.                             |
| `src/components/sections/store-section.tsx`      | Reference for the full catalogue section's responsive artwork presentation.                                                | S7 `/works`, `/available-works` and collection grids without price, cart or payment language. |
| `src/components/sections/home-store-section.tsx` | Reference for a compact home-page artwork selection and its responsive treatment.                                          | S7 editorial home-page featured-works section.                                                |
