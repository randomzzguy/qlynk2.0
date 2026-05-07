-- Drop the existing constraint
ALTER TABLE pages DROP CONSTRAINT IF EXISTS valid_theme;

-- Add the updated constraint with all 24 themes
ALTER TABLE pages ADD CONSTRAINT valid_theme CHECK (
  theme IN (
    -- Freelancer Themes
    'quickpitch', 'skillstack', 'hiremenow', 'storybuilder', 'localpro', 'sidehustle',
    -- Portfolio Themes
    'gallerygrid', 'casestudy', 'minimalistcv', 'motionreel', 'interactivedemo', 'narrativescroll',
    -- Business Themes
    'ecobrand', 'eventspace', 'franchisehub', 'legacyco', 'localbiz', 'serviceco',
    -- Product Themes
    'digitaldownload', 'featurefocus', 'hardwareshowcase', 'launchpad', 'nichetool', 'opensource'
  )
);
