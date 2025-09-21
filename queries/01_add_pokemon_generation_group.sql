-- ===============================================
-- MIGRATION SCRIPT: Add Pokemon Generation Group
-- ===============================================
-- Purpose: Adds a 'group' column to items table and populates with Pokemon generation data
-- Usage: Copy/paste into execute query modal for one-off run
-- 
-- Manual approach to add group field to schema
-- This query manually constructs the complete schema with the group field added

-- Step 1: First, let's see the current schema to copy it
SELECT schema FROM metadata;

-- Step 2: Add the group column to the table (comment this if it's already added)
ALTER TABLE items ADD COLUMN `group` TEXT;

-- Step 3: Update the schema with the group field manually added
-- Replace the entire schema with one that includes the group field
UPDATE metadata 
SET schema = '{
    "version": "1.0",
    "type": "list",
    "tableName": "items",
    "description": "Pokemon database with generation grouping",
    "title": "Shiny",
    "showHeaders": false,
    "controls": ["add","edit"],
    "fields": [
        {
            "name": "id",
            "displayName": "ID",
            "type": "integer",
            "primaryKey": true,
            "autoIncrement": true
        },
        {
            "name": "text",
            "displayName": "Text",
            "type": "text",
            "required": true
        },
        {
            "name": "status",
            "displayName": "Status",
            "type": "enum",
            "options": ["Wanted", "Hard", "Obtained", "Locked"],
            "defaultValue": "Wanted",
            "filterable": true,
            "showAllOption": true
        },
        {
            "name": "group",
            "displayName": "Generation",
            "type": "enum",
            "options": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Unknown"],
            "defaultValue": "Unknown",
            "filterable": false,
            "hidden": true
        }
    ]
}';

-- Step 4: Populate the group data
UPDATE items 
SET `group` = CASE 
    WHEN id BETWEEN 1 AND 151 THEN '1'
    WHEN id BETWEEN 152 AND 251 THEN '2'
    WHEN id BETWEEN 252 AND 386 THEN '3'
    WHEN id BETWEEN 387 AND 493 THEN '4'
    WHEN id BETWEEN 494 AND 649 THEN '5'
    WHEN id BETWEEN 650 AND 721 THEN '6'
    WHEN id BETWEEN 722 AND 809 THEN '7'
    WHEN id BETWEEN 810 AND 905 THEN '8'
    WHEN id BETWEEN 906 AND 1025 THEN '9'
    ELSE 'Unknown'
END;

-- Step 5: Verify the schema was updated
SELECT json_array_length(json_extract(schema, '$.fields')) as total_fields FROM metadata;

-- Step 6: Show the group field details
SELECT 
    json_extract(value, '$.name') as field_name,
    json_extract(value, '$.type') as field_type,
    json_extract(value, '$.displayName') as display_name
FROM metadata, json_each(json_extract(schema, '$.fields'))
WHERE json_extract(value, '$.name') = 'group';
