-- Cleanup and re-insert workshop data with proper structure
-- This script ensures workshop section has both settings and items

-- First, clean up existing data
DELETE FROM section_items WHERE section_type = 'workshop';
DELETE FROM section_settings WHERE section_type = 'workshop';

-- Insert workshop settings (required for section to show)
INSERT INTO section_settings (
  section_type,
  section_title,
  section_description,
  badge_text,
  max_items,
  is_active,
  display_order,
  created_at,
  updated_at
) VALUES (
  'workshop',
  'The Creative Workshop',
  'Step into the creative sanctuary where masterpieces come to life, where tradition meets innovation',
  'Behind the Art',
  6,
  true,
  0,
  NOW(),
  NOW()
);

-- Insert workshop items with data in JSONB field
INSERT INTO section_items (
  section_type,
  data,
  "order",
  is_active,
  created_at,
  updated_at
) VALUES
(
  'workshop',
  '{
    "url": "/img/workshop/workshop-0.jpeg",
    "title": "Broad Workshop View",
    "description": "The heart of Bekten Usubaliev''s artistic journey, this workshop is a place where creativity and imagination know no bounds. Various artworks, stretching from walls to the floor, reflect the breadth of his artistic vision."
  }',
  0,
  true,
  NOW(),
  NOW()
),
(
  'workshop',
  '{
    "url": "/img/workshop/workshop-1.jpeg",
    "title": "Portraits and Other Paintings",
    "description": "Brought to life by Bekten''s delicate brush strokes, these portraits dive deep into the depths of the human soul with their rich details. Each painting tells a different story to its viewers."
  }',
  1,
  true,
  NOW(),
  NOW()
),
(
  'workshop',
  '{
    "url": "/img/workshop/workshop-2.jpeg",
    "title": "Painting Shelves",
    "description": "These shelves house Bekten''s completed and ongoing projects. Each painting represents a different phase of the artist''s journey."
  }',
  2,
  true,
  NOW(),
  NOW()
),
(
  'workshop',
  '{
    "url": "/img/workshop/workshop-3.jpeg",
    "title": "Artist at Work",
    "description": "Bekten in his natural element, completely absorbed in his craft. This image captures the intense focus and passion that goes into every brushstroke."
  }',
  3,
  true,
  NOW(),
  NOW()
),
(
  'workshop',
  '{
    "url": "/img/workshop/workshop-4.jpeg",
    "title": "Detailed View of Artworks",
    "description": "A closer look at some of the masterpieces adorning the workshop walls. Each piece showcases Bekten''s mastery of color, form, and emotional expression."
  }',
  4,
  true,
  NOW(),
  NOW()
);

-- Verify the data was inserted correctly
SELECT 'Settings inserted:' as info, COUNT(*) as count FROM section_settings WHERE section_type = 'workshop';
SELECT 'Items inserted:' as info, COUNT(*) as count FROM section_items WHERE section_type = 'workshop';

-- Show the inserted data
SELECT 'Workshop Settings:' as info;
SELECT section_title, section_description, badge_text, max_items, is_active FROM section_settings WHERE section_type = 'workshop';

SELECT 'Workshop Items:' as info;
SELECT id, data->>'title' as title, data->>'url' as url, "order", is_active FROM section_items WHERE section_type = 'workshop' ORDER BY "order";
