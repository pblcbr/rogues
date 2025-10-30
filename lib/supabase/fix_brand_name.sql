-- Fix missing brand_name in existing workspaces
-- Extracts brand name from brand_website or domain

-- Function to extract brand name from website
CREATE OR REPLACE FUNCTION extract_brand_name(website TEXT)
RETURNS TEXT AS $$
DECLARE
  domain TEXT;
  brand_name TEXT;
BEGIN
  IF website IS NULL OR website = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove protocol and www
  domain := regexp_replace(website, '^https?://', '', 'i');
  domain := regexp_replace(domain, '^www\.', '', 'i');
  
  -- Get first part before dot
  domain := split_part(domain, '/', 1);
  domain := split_part(domain, '.', 1);
  
  -- Capitalize first letter
  brand_name := upper(substring(domain from 1 for 1)) || substring(domain from 2);
  
  RETURN brand_name;
END;
$$ LANGUAGE plpgsql;

-- Update workspaces that are missing brand_name
UPDATE workspaces
SET brand_name = extract_brand_name(brand_website)
WHERE brand_name IS NULL OR brand_name = ''
AND (brand_website IS NOT NULL AND brand_website != '');

-- Also try with domain if brand_website is empty
UPDATE workspaces
SET brand_name = extract_brand_name(domain)
WHERE brand_name IS NULL OR brand_name = ''
AND (domain IS NOT NULL AND domain != '');

-- Show results
SELECT id, name, brand_name, brand_website, domain
FROM workspaces
ORDER BY created_at DESC;

