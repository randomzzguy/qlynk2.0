-- Fix: Add unique constraint on user_id for upsert to work
-- This allows one page per user

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pages_user_id_key'
    ) THEN
        ALTER TABLE pages ADD CONSTRAINT pages_user_id_key UNIQUE (user_id);
    END IF;
END $$;
