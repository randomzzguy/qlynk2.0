-- Migration: Add theme system support to pages table
-- Version: v1
-- Created: 2024-12-25

-- Step 1: Add new columns to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS theme_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS theme_data JSONB DEFAULT '{}'::jsonb;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_theme_category ON pages(theme_category);
CREATE INDEX IF NOT EXISTS idx_pages_theme_data_gin ON pages USING GIN (theme_data);

-- Step 3: Migrate existing data
-- Map old themes to new categories
UPDATE pages 
SET theme_category = CASE
  WHEN theme IN ('professional', 'minimalist') THEN 'businesses'
  WHEN theme IN ('creative', 'vibrant', 'aurora') THEN 'portfolios'
  WHEN theme IN ('dark', 'monopress', 'brutalist') THEN 'freelancers'
  ELSE 'freelancers'
END
WHERE theme_category IS NULL;

-- Map old theme names to new theme IDs
UPDATE pages
SET theme = CASE
  WHEN theme = 'professional' THEN 'serviceco'
  WHEN theme = 'creative' THEN 'gallerygrid'
  WHEN theme = 'minimalist' THEN 'minimalistcv'
  WHEN theme = 'dark' THEN 'skillstack'
  WHEN theme = 'vibrant' THEN 'casestudy'
  WHEN theme = 'monopress' THEN 'quickpitch'
  WHEN theme = 'aurora' THEN 'storybuilder'
  WHEN theme = 'brutalist' THEN 'hiremenow'
  ELSE 'quickpitch'
END;

-- Migrate existing data to theme_data JSONB with config_version
UPDATE pages
SET theme_data = jsonb_build_object(
  'config_version', 'v1',
  'headline', COALESCE(tagline, name || ' - ' || profession),
  'subhead', COALESCE(bio, 'Welcome to my page'),
  'email', COALESCE(email, ''),
  'phone', COALESCE(phone, '')
)
WHERE theme_data = '{}'::jsonb OR theme_data IS NULL;

-- Step 4: Add NOT NULL constraint after migration
ALTER TABLE pages 
ALTER COLUMN theme_category SET DEFAULT 'freelancers',
ALTER COLUMN theme_data SET NOT NULL;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN pages.theme_category IS 'Theme category: freelancers, portfolios, products, or businesses';
COMMENT ON COLUMN pages.theme_data IS 'JSONB field containing theme-specific configuration. Always includes config_version for migration safety.';
