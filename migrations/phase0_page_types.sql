-- Phase 0.2: Page Type Classification
-- Extends tracked_pages for routing to appropriate ships
-- NOTE: tracked_pages base table is in 'core' schema, public.tracked_pages is a VIEW

-- Add page_type column to the BASE TABLE
ALTER TABLE core.tracked_pages
  ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'homepage';

-- Valid page types comment
COMMENT ON COLUMN public.tracked_pages.page_type IS
  'homepage | pricing | security | customers | case_studies | integrations | docs | comparison | partners';

-- Add index for ship routing
CREATE INDEX IF NOT EXISTS idx_tracked_pages_page_type
  ON core.tracked_pages(page_type) WHERE enabled = true;

-- Seed page types for existing tracked pages (based on URL patterns)
UPDATE core.tracked_pages SET page_type =
  CASE
    WHEN url ILIKE '%/pricing%' THEN 'pricing'
    WHEN url ILIKE '%/security%' OR url ILIKE '%/trust%' THEN 'security'
    WHEN url ILIKE '%/customers%' OR url ILIKE '%/case-stud%' THEN 'customers'
    WHEN url ILIKE '%/integrations%' OR url ILIKE '%/apps%' THEN 'integrations'
    WHEN url ILIKE '%/partners%' THEN 'partners'
    WHEN url ILIKE '%/docs%' OR url ILIKE '%/documentation%' THEN 'docs'
    WHEN url ILIKE '%/compare%' OR url ILIKE '%/vs-%' OR url ILIKE '%versus%' THEN 'comparison'
    ELSE 'homepage'
  END
WHERE page_type IS NULL OR page_type = 'homepage';
