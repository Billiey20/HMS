-- Run this in your Supabase SQL Editor to support the new "Desk / Room" assignment

ALTER TABLE users ADD COLUMN IF NOT EXISTS duty_station VARCHAR(100);

-- Update helpful view to show duty station if needed (optional)
