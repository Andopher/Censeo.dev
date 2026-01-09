-- UPDATED FIX: The error "invalid input value for enum" confirms you are using a Postgres ENUM.
-- You need to add the new values to the ENUM definition.

-- Run these commands in your Supabase SQL Editor:

-- 1. Add Senior Types
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'senior_frontend';
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'senior_backend';
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'senior_fullstack';

-- 2. Add Junior Types
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'junior_frontend';
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'junior_backend';
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'junior_fullstack';

-- 3. Add Legacy/Intermediary Types (Optional, but safe to add to prevent future errors)
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'frontend_engineer';
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'backend_engineer';
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'fullstack_engineer';
ALTER TYPE template_type ADD VALUE IF NOT EXISTS 'blank';

-- Note: 'production_incident', 'system_tradeoff', 'code_review' likely already exist.
