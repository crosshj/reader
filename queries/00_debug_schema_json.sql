-- ===============================================
-- DIAGNOSTIC SCRIPT: Debug Schema JSON
-- ===============================================
-- Purpose: Validate JSON structure in metadata table and check for syntax errors
-- Usage: Run when schema updates aren't working or JSON appears malformed
-- This query checks if the schema JSON is valid and properly formatted

-- Step 1: Check if the schema is valid JSON
SELECT 
    CASE 
        WHEN json_valid(schema) = 1 THEN 'Valid JSON'
        ELSE 'Invalid JSON'
    END as json_validity
FROM metadata;

-- Step 2: Pretty print the schema to check formatting
SELECT json_pretty(schema) as pretty_schema FROM metadata;

-- Step 3: Check if fields array is valid
SELECT 
    CASE 
        WHEN json_valid(json_extract(schema, '$.fields')) = 1 THEN 'Valid fields array'
        ELSE 'Invalid fields array'
    END as fields_validity
FROM metadata;

-- Step 4: Check each field individually
SELECT 
    json_extract(value, '$.name') as field_name,
    json_valid(value) as field_valid_json
FROM metadata, json_each(json_extract(schema, '$.fields'));

-- Step 5: Check for any null or malformed fields
SELECT 
    json_extract(value, '$.name') as field_name,
    json_extract(value, '$.type') as field_type,
    json_extract(value, '$.displayName') as display_name
FROM metadata, json_each(json_extract(schema, '$.fields'))
WHERE json_extract(value, '$.name') IS NULL 
   OR json_extract(value, '$.type') IS NULL;
