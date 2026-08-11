# Dynamic Locales, Media Workspace and User Access Design

**Date:** 2026-08-11  
**Status:** Approved  
**Scope:** Bekten Dashboard only; Coolify and production deployment remain deferred.

## Goals

- Let an owner add and publish a new public language without a code deployment.
- Keep English prefixless and use locale prefixes for every other active language.
- Fall back safely to English when UI or editorial translations are incomplete.
- Make translation editing denser and easier to scan.
- Turn Media into a Garage-backed, folder-aware file manager with three views.
- Let owners manage Dashboard access, roles and Resend magic-link invitations.
- Align the sidebar and content header while preserving the Bekten visual system.

## Non-goals

- No external CMS, translation, identity or media service.
- No physical Garage object move during a folder move or display-name rename.
- No public user accounts, passwords or public profile system.
- No production deployment or Coolify mutation in this milestone.

## 1. Dynamic locale registry

`SiteLocale` is the source of truth for languages exposed by the public site. It
stores a validated BCP 47-style code, English and native labels, text direction,
sort order, lifecycle state and audit timestamps. English is the immutable
default locale and cannot be disabled. Existing EN/TR/RU/KY records are seeded
without changing their current URLs.

Language lifecycle:

1. An owner creates a disabled draft locale.
2. UI translation rows become editable immediately in Dashboard.
3. Editors preview the locale through an authenticated preview contract.
4. An owner enables it; the locale selector, routing, sitemap and hreflang then
   expose it publicly.
5. A locale with content is disabled instead of deleted.

`public/locales` remains an immutable fallback for the four original languages.
Database values are canonical for newly added languages and overrides. English
is the final fallback for every missing key. ICU argument names must remain
identical to the English source.

The current static locale union becomes a validated locale-code value. Public
middleware recognizes syntactically valid locale prefixes; server layouts
verify that the locale is enabled. Unknown or disabled locales return 404.
English remains `/`, `/works`, etc.; `/en/**` permanently redirects to its
prefixless equivalent.

## 2. Editorial translation groups and fallback

Artwork, Collection, Exhibition, JournalEntry, Page and PressItem records gain
a stable translation-group identifier. A locale variant is a separate record,
but all variants of the same concept share that identifier.

When a requested locale variant is missing, the read layer may render the
English record. It must not advertise duplicate localized SEO: canonical points
to the English URL and hreflang includes only actually published variants.
Dashboard clearly labels fallback content and offers “Create translation from
English” as a draft operation. Publishing remains explicit per locale.

Existing records are never guessed together from title text. Deterministic demo
records may use their known seed identity; unmatched production records receive
their own translation group and can be linked explicitly in Dashboard.

## 3. Compact translation workspace

The Languages page keeps searchable keys but replaces large nested cards with a
dense, responsive table-like editor:

- locale chip, state and textarea share one compact row;
- textareas start at two lines and grow to a bounded height;
- character counts and fallback help appear on focus or validation failure;
- a sticky action row saves the currently opened key;
- language creation, ordering, preview and activation are separate owner-only
  actions and do not clutter ordinary translation editing.

## 4. Dashboard shell alignment

The logo-area “Studio” caption is removed. Sidebar header and content header use
one shared 64px height token, aligned borders and vertical centering. Collapsed,
desktop and mobile states keep accessible names and keyboard behavior.

## 5. Garage media workspace

`MediaFolder` stores a virtual hierarchy in PostgreSQL. `MediaObject` gains an
optional folder relation and a mutable display name while its provider,
checksum and Garage object key remain immutable. Moving or renaming is therefore
an atomic metadata operation, not an S3 copy/delete.

The Media page provides:

- card grid, detailed list and desktop/icon views;
- breadcrumbs, folder creation and view persistence;
- pointer, touch and keyboard-capable drag-and-drop in every view;
- a shadcn/Radix context menu plus an equivalent visible ellipsis menu;
- rename, move and delete confirmation dialogs;
- optimistic conflict detection and audit events.

Editors can upload, create folders, rename and move. Owners/admins can also
delete. Media referenced by editorial placements cannot be deleted. Non-empty
folders cannot be deleted. Storage failure cannot leave a successful deletion
response, and database/storage compensation follows the existing fail-closed
Garage contract.

## 6. Dashboard user management

`/dashboard/users` is visible only to owners/admins. It shows name, email, role,
invitation status, account status and last sign-in. Owners/admins can invite,
resend access, change role, suspend or remove access.

Invitations use Resend and the existing single-use, expiring magic-link flow.
The email is pre-authorized in PostgreSQL, and the account becomes active after
the first verified sign-in. No password is introduced. Mutations require
same-origin validation, schema validation, database rate limiting and audit
events. The last active owner cannot be removed, suspended or demoted. A user
cannot bypass that invariant by editing their own account concurrently.

`mucahidyazar@gmail.com` is promoted to OWNER in local development so all
management flows can be verified end to end.

## 7. Testing and rollout

Every slice follows RED → GREEN → refactor. Required evidence:

- unit tests for locale/media/user contracts;
- PostgreSQL repository and transaction integration tests;
- route/action authorization, CSRF, rate-limit and audit tests;
- component accessibility tests for compact translations, context menus,
  dialogs, drag/drop keyboard alternatives and responsive shell alignment;
- Playwright flows for add/preview language, media operations in all three
  views, invitation/role safety and last-owner protection;
- lint, typecheck, at least 80% changed-scope coverage, full test, build and
  dependency audit.

Local migrations and browser verification are in scope. Coolify secrets,
production migrations, Garage production checks and deployment remain the final
separate phase.
