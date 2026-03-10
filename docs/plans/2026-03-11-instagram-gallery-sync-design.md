# Instagram Gallery Sync Design

## Summary

`/gallery` will stop scraping Instagram at request time. A weekly sync job will
fetch the latest profile posts from Apify, mirror each post's cover image into
PocketBase under `bekten-art/images/instagram/...`, and store the snapshot in
PostgreSQL.

Runtime behavior:

- gallery reads only from PostgreSQL
- images are served from PocketBase
- Instagram and Apify are only touched during sync

## Data Model

New table: `instagram_posts`

Stored fields:

- `instagram_media_id`, `shortcode`, `username`, `owner_username`
- `caption`, `media_type`, `source_permalink`, `source_display_url`,
  `thumbnail_url`, `alt_text`
- `posted_at`, `display_order`, `is_active`, `is_pinned`
- `uploaded_file_id`
- `raw_payload`, `synced_at`, `created_at`, `updated_at`

Each post points to one mirrored `uploaded_files` row.

## Sync Rules

Command surface:

- `pnpm instagram:sync`

Flow:

1. Call Apify `apify/instagram-profile-scraper` for the configured username.
2. Read `latestPosts`.
3. Keep only posts where `ownerUsername === configured username`.
4. For each new post:
   - download the cover image
   - upload it to PocketBase in `images/instagram/<shortcode>.<ext>`
   - create an `uploaded_files` row
   - upsert the `instagram_posts` row
5. For existing posts:
   - refresh metadata, order, and sync timestamp
6. Preserve older rows that are no longer returned by Apify; do not delete
   automatically.

The actor returns pinned posts first, so `display_order` follows actor order.

## Failure Behavior

- If Apify fails, the current gallery remains untouched.
- If one image download or PocketBase upload fails, that post is skipped and the
  rest continue.
- Duplicate rows are prevented by unique keys on `instagram_media_id` and
  `shortcode`.
- Gallery rendering falls back to the mirrored PocketBase URL and never fetches
  Instagram at runtime.

## Deployment

Required env:

- `APIFY_TOKEN`
- `APIFY_INSTAGRAM_USERNAME`
- optional `APIFY_ACTOR_ID` with default `apify/instagram-profile-scraper`

Scheduling:

- run `pnpm instagram:sync` once per week from server cron or the deployment
  platform scheduler
