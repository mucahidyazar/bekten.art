# Public Content Consistency Implementation Plan

## User journeys

1. A visitor switching to Turkish sees the complete published archive. Missing
   Turkish entries fall back to English, then another published locale, without
   leaving `/tr/**`.
2. A visitor sees the same-sized landing hero on every public route on desktop
   and a predictable media/copy rhythm on mobile.
3. A visitor can reach Studio from the header and Collectors plus every other
   secondary destination from the footer or homepage.
4. A work with one image keeps the existing framed detail. A work with multiple
   images gains an accessible carousel without changing the content schema.
5. An editor sees source-grounded About and Journal defaults and can still
   replace them in Dashboard.
6. The approved local editor can request and consume a magic link and lands on
   `/dashboard` in the user's existing Chrome session.

## TDD slices

### Slice A — locale identity and fallback

- Add failing repository tests for locale union, stable translation group
  selection and detail fallback.
- Expose the resolved content locale in public entity contracts.
- Query published candidates across active built-in locales in one transaction,
  group by translation identity and select `requested → en → first`.
- Preserve exact-locale detail lookup first, then resolve the same slug from
  fallback locales.
- Update metadata helpers to canonicalize to the resolved content locale and
  mark the rendered content subtree with `lang`.
- Repair deterministic demo translation-group IDs locally and in the seed.

### Slice B — navigation and hero rhythm

- Add shell tests for Studio in primary nav, Collectors in footer and secondary
  route discoverability.
- Add CSS contract and browser geometry assertions for fixed desktop hero block
  and bounded mobile media/copy regions.
- Keep title size responsive without allowing title length to change the hero
  block height.

### Slice C — real media and multi-image work detail

- Add seed/refresh tests proving generated hero media is not used on Studio,
  Collectors, Commission, Private Viewings, Exhibitions, Journal and Press.
- Reuse only verified InstagramPost → READY/PUBLIC Garage media IDs.
- Add a shadcn-style carousel primitive and component tests for single/multiple
  media, keyboard navigation, controls, status and reduced motion.
- Use the current static frame for one image and carousel only for 2+ images.

### Slice D — source-grounded copy and accordion

- Add seed tests rejecting `demo`, `placeholder`, `replaceable` and unverified
  claims from public copy.
- Expand About and From the Studio in EN/TR/RU/KY from cited facts.
- Replace Commission FAQ native details with local shadcn Accordion and verify
  animated content plus keyboard semantics.
- Audit other public UI; retain semantic native elements when no shadcn
  primitive improves the interaction.

### Slice E — verification and local access

- Run focused tests and coverage for every slice, then global lint, type-check,
  unit/integration coverage and production build.
- Run desktop/mobile Playwright across EN/TR/RU/KY, checking equal archive
  counts, fallback language/canonical, hero geometry, carousel and accordion.
- Dispatch a local Dashboard magic link through configured Resend, consume it in
  the existing Chrome tab, verify the Dashboard shell and leave the tab ready.
- Update `docs/progress.md` only from fresh evidence.
