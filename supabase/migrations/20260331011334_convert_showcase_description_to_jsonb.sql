-- Convert showcases.description to jsonb safely
-- Handle existing data: if it's valid JSON (starts with '{'), cast it.
-- Otherwise, treat it as a string to be wrapped in a JSON string.
ALTER TABLE showcases 
ALTER COLUMN description TYPE jsonb 
USING (
  CASE 
    WHEN description IS NULL OR description = '' THEN NULL
    WHEN description LIKE '{%' THEN description::jsonb 
    ELSE to_jsonb(description) 
  END
);
