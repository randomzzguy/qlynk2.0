-- Migration: Add profession column to agent_configs
ALTER TABLE public.agent_configs
  ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT 'Digital Creator';
