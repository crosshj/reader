-- ===============================================
-- DIAGNOSTIC SCRIPT: Debug Fields
-- ===============================================
-- Purpose: Verify if a specific field exists in the metadata schema and show its properties
-- Usage: Replace 'group' with your field name, run to check field configuration
-- 
-- This query will help debug if the group field is properly in the schema

-- Step 1: Check the current schema
SELECT schema FROM metadata;

-- Step 2: Check if the group field exists in the fields array
SELECT 
    json_extract(schema, '$.fields') as fields_array
FROM metadata;

-- Step 3: Check specifically for the group field
SELECT 
    json_extract(schema, '$.fields[3]') as fourth_field,
    json_extract(schema, '$.fields[3].name') as field_name,
    json_extract(schema, '$.fields[3].displayName') as display_name,
    json_extract(schema, '$.fields[3].type') as field_type,
    json_extract(schema, '$.fields[3].options') as options
FROM metadata;

-- Step 4: Count total fields
SELECT 
    json_array_length(json_extract(schema, '$.fields')) as total_fields
FROM metadata;

-- Step 5: Show all field names
SELECT 
    json_extract(value, '$.name') as field_name,
    json_extract(value, '$.type') as field_type
FROM metadata, json_each(json_extract(schema, '$.fields'));
