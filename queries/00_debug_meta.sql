-- ===============================================
-- DIAGNOSTIC SCRIPT: Debug Meta
-- ===============================================
-- Purpose: Display comprehensive table structure, columns, indexes, and sample data
-- Usage: Replace 'items' with your table name, run to inspect any table
-- 
-- This query displays comprehensive metadata about a table including:
-- - Column information (name, type, constraints, etc.)
-- - Index information
-- - Table creation SQL
-- - Row count

-- Replace 'items' with the table name you want to inspect
-- Usage: Change the table name in the queries below

-- Step 1: Show basic table information
SELECT 
    name as table_name,
    sql as create_statement
FROM sqlite_master 
WHERE type = 'table' 
AND name = 'items';

-- Step 2: Show detailed column information
SELECT 
    cid as column_id,
    name as column_name,
    type as data_type,
    "notnull" as not_null,
    dflt_value as default_value,
    pk as primary_key
FROM pragma_table_info('items')
ORDER BY cid;

-- Step 3: Show indexes for the table
SELECT 
    name as index_name,
    sql as index_sql
FROM sqlite_master 
WHERE type = 'index' 
AND tbl_name = 'items'
AND name NOT LIKE 'sqlite_%';

-- Step 4: Show row count
SELECT COUNT(*) as row_count FROM items;

-- Step 5: Show sample data (first 5 rows)
SELECT * FROM items LIMIT 5;
