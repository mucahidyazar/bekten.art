ALTER TABLE "inquiries"
    DROP CONSTRAINT "inquiries_type_details_check",
    ADD CONSTRAINT "inquiries_type_details_check" CHECK (
        ("type" = 'AVAILABILITY' AND "related_artwork_title" IS NOT NULL)
        OR ("type" = 'COMMISSION' AND COALESCE(LENGTH(BTRIM("brief")) > 0, false))
        OR ("type" = 'PRIVATE_VIEWING' AND CARDINALITY("preferred_dates") BETWEEN 1 AND 3)
        OR ("type" IN ('COLLECTOR', 'GENERAL') AND COALESCE(LENGTH(BTRIM("subject")) > 0, false) AND COALESCE(LENGTH(BTRIM("message")) > 0, false))
    );
