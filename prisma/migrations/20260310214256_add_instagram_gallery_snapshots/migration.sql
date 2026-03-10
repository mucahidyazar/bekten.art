-- CreateTable
CREATE TABLE "instagram_posts" (
    "id" UUID NOT NULL,
    "instagram_media_id" TEXT NOT NULL,
    "shortcode" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "owner_username" TEXT,
    "caption" TEXT,
    "media_type" TEXT NOT NULL,
    "source_permalink" TEXT NOT NULL,
    "source_display_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "alt_text" TEXT,
    "posted_at" TIMESTAMP(3),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "raw_payload" JSONB NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_file_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_posts_instagram_media_id_key" ON "instagram_posts"("instagram_media_id");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_posts_shortcode_key" ON "instagram_posts"("shortcode");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_posts_uploaded_file_id_key" ON "instagram_posts"("uploaded_file_id");

-- CreateIndex
CREATE INDEX "instagram_posts_is_active_display_order_idx" ON "instagram_posts"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "instagram_posts_username_is_active_posted_at_idx" ON "instagram_posts"("username", "is_active", "posted_at");

-- AddForeignKey
ALTER TABLE "instagram_posts" ADD CONSTRAINT "instagram_posts_uploaded_file_id_fkey" FOREIGN KEY ("uploaded_file_id") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
