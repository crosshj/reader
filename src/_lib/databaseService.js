import initSqlJs from 'sql.js';
import { dispatchEvent } from './utils.js';

/**
 * Database Service
 * Handles SQLite operations using sql.js for .smartText files
 */
export class DatabaseService {
	constructor() {
		this.db = null;
		this.version = null;
		this.schema = null;
		this.SQL = null;
	}

	/**
	 * Load database from file data
	 * @param {ArrayBuffer} fileData - File data as ArrayBuffer
	 * @returns {Promise<Object>} Database info with version and schema
	 */
	async loadFromFile(fileData) {
		try {
			// Initialize sql.js if not already done
			if (!this.SQL) {
				this.SQL = await initSqlJs({
					locateFile: (file) => {
						if (file.endsWith('.wasm')) {
							return '/reader-favicon.svg'.replace('reader-favicon.svg', 'sql-wasm.wasm');
						}
						return file;
					},
				});
			}

		// Load the database
		this.db = new this.SQL.Database(new Uint8Array(fileData));

			// Get version and schema from metadata table
			const metadata = this.getMetadata();
			this.version = metadata.version;
			this.schema = metadata.schema;

			return {
				version: this.version,
				schema: this.schema,
				tables: this.getTableNames(),
			};
		} catch (error) {
			console.error('Error loading database:', error);
			throw error;
		}
	}

	/**
	 * Get metadata from database
	 * @returns {Object} Metadata object with version and schema
	 */
	getMetadata() {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			const result = this.db.exec(
				'SELECT * FROM metadata ORDER BY id LIMIT 1'
			);
			if (result.length === 0) {
				throw new Error('No metadata table found');
			}

			const row = result[0].values[0];
			const schema = JSON.parse(row[2]); // schema is the 3rd column (index 2)
			return {
				version: row[1],
				schema: schema,
			};
		} catch (error) {
			console.error('Error reading metadata:', error);
			throw error;
		}
	}

	/**
	 * Get all table names
	 * @returns {Array<string>} Array of table names
	 */
	getTableNames() {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			const result = this.db.exec(
				"SELECT name FROM sqlite_master WHERE type='table'"
			);
			return result[0]?.values?.map((row) => row[0]) || [];
		} catch (error) {
			console.error('Error getting table names:', error);
			throw error;
		}
	}

	/**
	 * Query database table
	 * @param {string} tableName - Name of table to query
	 * @param {string} whereClause - Optional WHERE clause
	 * @returns {Array<Object>} Query results
	 */
	queryTable(tableName, whereClause = '') {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			const sql = `SELECT * FROM ${tableName} ${whereClause}`;
			const result = this.db.exec(sql);

			if (result.length === 0) {
				return [];
			}

			const columns = result[0].columns;
			const values = result[0].values;

			return values.map((row) => {
				const obj = {};
				columns.forEach((col, index) => {
					obj[col] = row[index];
				});
				return obj;
			});
		} catch (error) {
			console.error(`Error querying table ${tableName}:`, error);
			throw error;
		}
	}

	/**
	 * Insert data into table
	 * @param {string} tableName - Name of table
	 * @param {Object} data - Data to insert
	 * @returns {number} Insert ID
	 */
	insertData(tableName, data) {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			const columns = Object.keys(data);
			const values = Object.values(data);
			const placeholders = values.map(() => '?').join(', ');

			// Escape column names to handle SQL reserved keywords
			const escapedColumns = columns.map(col => `\`${col}\``).join(', ');

			const sql = `INSERT INTO ${tableName} (${escapedColumns}) VALUES (${placeholders})`;
			const stmt = this.db.prepare(sql);
			stmt.run(values);

			return (
				this.db.exec('SELECT last_insert_rowid()')?.[0]
					?.values?.[0]?.[0] ?? 0
			);
		} catch (error) {
			console.error(`Error inserting into ${tableName}:`, error);
			throw error;
		}
	}

	/**
	 * Update data in table
	 * @param {string} tableName - Name of table
	 * @param {Object} data - Data to update
	 * @param {string} whereClause - WHERE clause
	 * @returns {number} Number of rows affected
	 */
	updateData(tableName, data, whereClause) {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			// Check if this update involves a status field and remove CHECK constraint if needed
			if (data.status) {
				this.ensureNoCheckConstraint(tableName, 'status');

				// Also try to remove CHECK constraint aggressively as a fallback
				try {
					this.removeCheckConstraintSync(tableName, 'status');
				} catch (e) {
					// Constraint may not exist, continue
				}
			}

			// Escape column names to handle SQL reserved keywords
			const setClause = Object.keys(data)
				.map((key) => `\`${key}\` = ?`)
				.join(', ');
			const values = Object.values(data);

			const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
			const stmt = this.db.prepare(sql);
			stmt.run(values);

			// Use SQLite's changes() function to get rows affected
			const result = this.db.exec('SELECT changes() AS rowsAffected');
			return result?.[0]?.values?.[0]?.[0] ?? 0;
		} catch (error) {
			console.error(`Error updating ${tableName}:`, error);
			throw error;
		}
	}

	/**
	 * Delete data from table
	 * @param {string} tableName - Name of table
	 * @param {string} whereClause - WHERE clause
	 * @returns {number} Number of rows affected
	 */
	deleteData(tableName, whereClause) {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
			const stmt = this.db.prepare(sql);
			stmt.run();

			// Use SQLite's changes() function to get rows affected
			const result = this.db.exec('SELECT changes() AS rowsAffected');
			return result?.[0]?.values?.[0]?.[0] ?? 0;
		} catch (error) {
			console.error(`Error deleting from ${tableName}:`, error);
			throw error;
		}
	}

	/**
	 * Get database as ArrayBuffer for saving
	 * @returns {ArrayBuffer} Database data
	 */
	exportDatabase() {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			return this.db.export().buffer;
		} catch (error) {
			console.error('Error exporting database:', error);
			throw error;
		}
	}

	/**
	 * Clean up database to reduce file size
	 * @returns {Object} Cleanup results with before/after sizes
	 */
	cleanupDatabase() {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			// Get size before cleanup
			const beforeSize = this.db.export().buffer.byteLength;

			// Run VACUUM to reclaim space and optimize database
			this.db.exec('VACUUM');

			// Run ANALYZE to update statistics
			this.db.exec('ANALYZE');

			// Get size after cleanup
			const afterSize = this.db.export().buffer.byteLength;
			const savedBytes = beforeSize - afterSize;
			const savedPercent = ((savedBytes / beforeSize) * 100).toFixed(2);

			return {
				beforeSize,
				afterSize,
				savedBytes,
				savedPercent: parseFloat(savedPercent),
			};
		} catch (error) {
			console.error('Error cleaning up database:', error);
			throw error;
		}
	}

	/**
	 * Get database statistics and size information
	 * @returns {Object} Database statistics
	 */
	getDatabaseStats() {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			const tables = this.getTableNames();
			const stats = {
				tables: tables.length,
				tableNames: tables,
				fileSize: this.db.export().buffer.byteLength,
				pageCount: 0,
				pageSize: 0,
				freePages: 0,
			};

			// Get page information
			const pageInfo = this.db.exec('PRAGMA page_count');
			if (pageInfo.length > 0) {
				stats.pageCount = pageInfo[0].values[0][0];
			}

			const pageSize = this.db.exec('PRAGMA page_size');
			if (pageSize.length > 0) {
				stats.pageSize = pageSize[0].values[0][0];
			}

			const freePages = this.db.exec('PRAGMA freelist_count');
			if (freePages.length > 0) {
				stats.freePages = freePages[0].values[0][0];
			}

			// Get row counts for each table
			stats.tableRowCounts = {};
			tables.forEach((tableName) => {
				try {
					const result = this.db.exec(
						`SELECT COUNT(*) as count FROM ${tableName}`
					);
					if (result.length > 0) {
						stats.tableRowCounts[tableName] =
							result[0].values[0][0];
					}
				} catch (error) {
					stats.tableRowCounts[tableName] = 'Error';
				}
			});

			return stats;
		} catch (error) {
			console.error('Error getting database stats:', error);
			throw error;
		}
	}

	/**
	 * Remove unused tables (tables not in the expected schema)
	 * @param {Array<string>} expectedTables - Array of expected table names
	 * @returns {Object} Cleanup results
	 */
	removeUnusedTables(expectedTables = ['metadata', 'items']) {
		if (!this.db) {
			throw new Error('Database not loaded');
		}

		try {
			const allTables = this.getTableNames();
			const tablesToRemove = allTables.filter(
				(table) => !expectedTables.includes(table)
			);

			if (tablesToRemove.length === 0) {
				return { removedTables: [], message: 'No unused tables found' };
			}

			// Remove each unused table
			tablesToRemove.forEach((tableName) => {
				this.db.exec(`DROP TABLE IF EXISTS ${tableName}`);
			});

			return {
				removedTables: tablesToRemove,
				message: `Removed ${tablesToRemove.length} unused tables`,
			};
		} catch (error) {
			console.error('Error removing unused tables:', error);
			throw error;
		}
	}

	/**
	 * Check if database is loaded
	 * @returns {boolean}
	 */
	isLoaded() {
		return this.db !== null;
	}

	/**
	 * Get current version
	 * @returns {string|null}
	 */
	getVersion() {
		return this.version;
	}

	/**
	 * Get current schema
	 * @returns {Object|null}
	 */
	getSchema() {
		return this.schema;
	}

	/**
	 * Close database connection
	 */
	close() {
		if (this.db) {
			this.db.close();
			this.db = null;
			this.version = null;
			this.schema = null;
		}
	}

	/**
	 * Create a barebones SQLite database with metadata and default tables
	 * @returns {Promise<ArrayBuffer>} Database data as ArrayBuffer
	 */
	async createBarebonesDatabase(appController = null) {
		// Initialize sql.js if not already done
		if (!this.SQL) {
				this.SQL = await initSqlJs({
					locateFile: (file) => {
						if (file.endsWith('.wasm')) {
							return '/sql-wasm.wasm';
						}
						return file;
					},
				});
		}

		// Create new database
		const db = new this.SQL.Database();

		// Create metadata table
		db.exec(`
			CREATE TABLE metadata (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				version TEXT NOT NULL,
				schema TEXT NOT NULL
			)
		`);

		// Insert default metadata
		const defaultSchema = {
			version: '1.0',
			title: 'Database',
			type: 'list',
			tableName: 'items',
            showHeaders: false,
			// controls: ['add', 'selectedEdit'],
            controls: ['add'],
            fields: [
				{
					name: 'id',
					displayName: 'ID',
					type: 'integer',
					primaryKey: true,
					autoIncrement: true,
				},
				{
					name: 'text',
					displayName: 'Text',
					type: 'text',
					required: true,
				},
				{
					name: 'status',
					displayName: 'Status',
					type: 'enum',
					options: ['Todo', 'Doing', 'Done'],
					defaultValue: 'Todo',
                    filterable: true,
				},

			],

		};

		const stmt = db.prepare(
			'INSERT INTO metadata (version, schema) VALUES (?, ?)'
		);
		stmt.run(['1.0', JSON.stringify(defaultSchema)]);

		// Create default items table based on schema
		db.exec(`
			CREATE TABLE items (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				text TEXT NOT NULL,
				status TEXT DEFAULT 'Todo',
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`);

		// Create trigger to automatically update modified_at on UPDATE
		db.exec(`
			CREATE TRIGGER update_items_modified_at 
			AFTER UPDATE ON items
			BEGIN
				UPDATE items SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
			END
		`);

		// No sample data - start with empty table

		// Export database as ArrayBuffer
		const dbData = db.export();
		db.close();

		// Set the current schema in the app state for the modal to use
		// This ensures the modal can read the default values
		if (appController) {
			appController.currentSchema = defaultSchema;
			
			// Also dispatch an event to set the reader's currentSchema
			// This ensures the modal can read the default values
			dispatchEvent('db:state', {
				action: 'schema_loaded',
				state: {},
				metadata: { schema: defaultSchema },
				message: 'Default schema loaded'
			});
		}

		return dbData.buffer;
	}

	/**
	 * Update schema metadata
	 * @param {Object} metadata - Metadata to update
	 * @returns {Promise<void>}
	 */
	async updateSchema(metadata) {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		try {
			// Get current schema from database
			const currentMetadata = this.getMetadata();
			const currentSchema = currentMetadata.schema;

			// Update schema with new metadata
			const updatedSchema = {
				...currentSchema,
				title: metadata.title,
				description: metadata.description || '',
				fields: metadata.fields || currentSchema.fields || [],
				controls: metadata.controls ||
					currentSchema.controls || [
						'add',
						'edit',
						'delete',
						'bulk-upsert',
					],
				showHeaders:
					metadata.showHeaders !== undefined
						? metadata.showHeaders
						: true,
			};

			// Ensure we have a valid schema object
			const schemaJson = JSON.stringify(updatedSchema);
			if (
				!schemaJson ||
				schemaJson === 'null' ||
				schemaJson === 'undefined'
			) {
				throw new Error('Invalid schema object');
			}

			// Check if metadata record exists first
			const countResult = this.db.exec(
				'SELECT COUNT(*) as count FROM metadata'
			);
			const count = countResult[0].values[0][0];

			if (count === 0) {
				// Record doesn't exist, create it
				const insertStmt = this.db.prepare(
					'INSERT INTO metadata (version, schema) VALUES (?, ?)'
				);
				insertStmt.run('1.0', schemaJson);
			} else {
				// Record exists, update the first one
				// Escape single quotes in the JSON string for SQL
				const escapedSchemaJson = schemaJson.replace(/'/g, "''");
				const updateQuery = `UPDATE metadata SET schema = '${escapedSchemaJson}' WHERE id = 1`;
				const updateResult = this.db.exec(updateQuery);
			}

			// Update the current schema in memory
			this.schema = updatedSchema;

			// Update the database table structure to match the new schema
			await this.updateTableStructure(updatedSchema, currentSchema);

			// Verify the update worked by reading back from database
			const verifyStmt = this.db.prepare(
				'SELECT schema FROM metadata WHERE id = 1'
			);
			const verifyResult = verifyStmt.get();
		} catch (error) {
			console.error('Error updating schema:', error);
			throw error;
		}
	}

	/**
	 * Update table structure to match the new schema
	 * @param {Object} schema - Updated schema
	 * @returns {Promise<void>}
	 */
	async updateTableStructure(schema, originalSchema = null) {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		try {
			const tableName = schema.tableName || 'items';
			const fields = schema.fields || [];

			// Get current table columns
			const tableInfo = this.db.exec(`PRAGMA table_info(${tableName})`);
			const currentColumns = tableInfo[0]?.values || [];
			const currentColumnNames = currentColumns.map((col) => col[1]); // Column name is at index 1

			// Get new column names from schema
			const newColumnNames = fields.map((field) => field.name);

			// Find columns to add and remove
			const columnsToAdd = newColumnNames.filter(
				(name) => !currentColumnNames.includes(name)
			);
			const columnsToRemove = currentColumnNames.filter(
				(name) => !newColumnNames.includes(name) && name !== 'id'
			);


			// Handle enum field changes and data migration
			await this.handleEnumFieldChanges(
				schema,
				tableName,
				originalSchema
			);

			// Add new columns
			for (const columnName of columnsToAdd) {
				const field = fields.find((f) => f.name === columnName);
				if (field) {
					let columnType = 'TEXT';
					if (field.type === 'integer') columnType = 'INTEGER';
					if (field.type === 'datetime') columnType = 'TEXT';

					const nullable = field.required ? 'NOT NULL' : '';
					const defaultValue = field.defaultValue
						? `DEFAULT '${field.defaultValue}'`
						: '';

					const alterQuery =
						`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType} ${nullable} ${defaultValue}`.trim();

					this.db.exec(alterQuery);
				}
			}

			// Note: SQLite doesn't support DROP COLUMN directly, so we'll leave removed columns
			// They'll just be ignored in the UI but remain in the database
		} catch (error) {
			console.error('Error updating table structure:', error);
			throw error;
		}
	}

	/**
	 * Handle enum field changes and data migration
	 * @param {Object} schema - Updated schema
	 * @param {string} tableName - Name of the table
	 * @returns {Promise<void>}
	 */
	async handleEnumFieldChanges(schema, tableName, originalSchema = null) {

		if (!this.db) {
			throw new Error('Database not initialized');
		}

		try {
			// Use original schema for comparison if provided, otherwise get current schema
			const schemaToCompare = originalSchema || this.getMetadata().schema;
			const currentFields = schemaToCompare.fields || [];
			const newFields = schema.fields || [];


			// Find enum fields that have changed
			for (const newField of newFields) {
				if (newField.type === 'enum') {
					const currentField = currentFields.find(
						(f) => f.name === newField.name
					);

					if (currentField && currentField.type === 'enum') {
						const currentOptions = currentField.options || [];
						const newOptions = newField.options || [];


						// Check if options have changed (compare order, not just content)
						const optionsChanged =
							JSON.stringify(currentOptions) !==
							JSON.stringify(newOptions);


						if (optionsChanged) {
							// Migrate data from old values to new values

							await this.migrateEnumData(
								tableName,
								newField.name,
								currentOptions,
								newOptions
							);

							// Skip CHECK constraint removal during migration - it's already handled on updates
						}
					}
				}
			}
		} catch (error) {
			console.error('Error handling enum field changes:', error);
			throw error;
		}
	}

	/**
	 * Migrate enum data from old values to new values
	 * @param {string} tableName - Name of the table
	 * @param {string} fieldName - Name of the enum field
	 * @param {Array} oldOptions - Old enum options
	 * @param {Array} newOptions - New enum options
	 * @returns {Promise<void>}
	 */

	async migrateEnumData(tableName, fieldName, oldOptions, newOptions) {
		try {
			// Get all items from database
			const itemsQuery = `SELECT id, \`${fieldName}\` FROM ${tableName}`;
			const itemsResult = this.db.exec(itemsQuery);
			const items = itemsResult?.[0]?.values || [];

			// Get unique values actually in the database
			const uniqueValues = [
				...new Set(items.map(([id, value]) => value).filter(Boolean)),
			];

			// Create dynamic mapping from current values to new values (position-based)
			const migrationMapping = {};
			uniqueValues.forEach((currentValue, index) => {
				if (index < newOptions.length) {
					migrationMapping[currentValue] = newOptions[index];
				}
			});

			// Build migration query
			const updateStatements = [];

			// Build all UPDATE statements in one loop
			for (const [id, currentValue] of items) {
				if (currentValue) {
					let newValue;
					if (migrationMapping[currentValue]) {
						// Use mapped value
						newValue = migrationMapping[currentValue];
					} else if (
						!newOptions.includes(currentValue) &&
						newOptions.length > 0
					) {
						// Use first new option for unmapped values
						newValue = newOptions[0];
					}

					if (newValue) {
						updateStatements.push(
							`UPDATE ${tableName} SET \`${fieldName}\` = '${newValue}' WHERE id = ${id}`
						);
					}
				}
			}


			// Execute all updates
			for (const statement of updateStatements) {
				this.db.exec(statement);
			}
		} catch (error) {
			console.error(`Migration failed for ${fieldName}:`, error);
			throw error;
		}
	}

	/**
	 * Create intelligent migration mapping between old and new enum options
	 *
	 * Migration Strategies:
	 * 1. Position-based mapping: Maps by position (1st old → 1st new, 2nd old → 2nd new, etc.)
	 * 2. Shorter new enum: Extra old options map to the last new option
	 * 3. Longer new enum: Extra new options are not mapped (new data can use them)
	 * 4. Fallback: Any unmapped old options map to the first new option
	 *
	 * @param {Array} oldOptions - Old enum options
	 * @param {Array} newOptions - New enum options
	 * @returns {Object} Mapping from old values to new values
	 */
	createEnumMigrationMapping(oldOptions, newOptions) {
		const mapping = {};


		// Strategy 1: Position-based mapping (primary strategy)
		// Map old items to new items by position: first to first, second to second, etc.
		const minLength = Math.min(oldOptions.length, newOptions.length);

		for (let i = 0; i < minLength; i++) {
			const oldOption = oldOptions[i];
			const newOption = newOptions[i];
				mapping[oldOption] = newOption;
		}

		// Strategy 2: Handle remaining old options when new enum is shorter
		if (oldOptions.length > newOptions.length) {
			const lastNewOption = newOptions[newOptions.length - 1];

			for (let i = newOptions.length; i < oldOptions.length; i++) {
				const oldOption = oldOptions[i];
					if (!mapping[oldOption]) {
						mapping[oldOption] = lastNewOption;
					}
			}
		}

		// Strategy 3: Handle remaining old options when new enum is longer
		// This shouldn't happen in normal usage, but if it does, map to first new option
		if (oldOptions.length < newOptions.length) {
		}

		// Strategy 4: Fallback for any unmapped values
		// This should rarely be needed with position-based mapping
		for (const oldOption of oldOptions) {
			if (!mapping[oldOption]) {
				mapping[oldOption] = newOptions[0] || oldOption;
			}
		}

		return mapping;
	}

	/**
	 * Ensure no CHECK constraint exists for a field (check and remove if needed)
	 * @param {string} tableName - Name of the table
	 * @param {string} fieldName - Name of the field
	 * @returns {void}
	 */
	ensureNoCheckConstraint(tableName, fieldName) {
		try {
			// Check if CHECK constraint exists by looking at the table schema
			const tableInfo = this.db.exec(`PRAGMA table_info(${tableName})`);
			const columns = tableInfo[0]?.values || [];

			// Look for the field and check if it has a CHECK constraint
			const fieldColumn = columns.find((col) => col[1] === fieldName);

			if (fieldColumn) {
				const columnDef = fieldColumn[2]; // Column definition

				if (columnDef && columnDef.includes('CHECK')) {
					this.removeCheckConstraintSync(tableName, fieldName);
				} else {

					// Try a different approach - check if we can insert a test value
					try {
						const testQuery = `INSERT INTO ${tableName} (\`${fieldName}\`) VALUES ('TEST_VALUE')`;
						this.db.exec(testQuery);
					} catch (testError) {
						if (testError.message.includes('CHECK constraint')) {
							this.removeCheckConstraintSync(
								tableName,
								fieldName
							);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error checking CHECK constraint:', error);
			// Don't throw - this is a safety check, not critical
		}
	}

	/**
	 * Remove CHECK constraint for enum field (synchronous version)
	 * @param {string} tableName - Name of the table
	 * @param {string} fieldName - Name of the enum field
	 * @returns {void}
	 */
	removeCheckConstraintSync(tableName, fieldName) {
		try {
			// First, try to detect if CHECK constraint actually exists
			const tableInfo = this.db.exec(`PRAGMA table_info(${tableName})`);
			const columns = tableInfo[0]?.values || [];
			const fieldColumn = columns.find((col) => col[1] === fieldName);

			if (!fieldColumn) {
				return;
			}

			const columnDef = fieldColumn[2];
			if (!columnDef || !columnDef.includes('CHECK')) {
				return;
			}

			// Get all data from the current table
			const selectQuery = `SELECT * FROM ${tableName}`;
			const data = this.db.exec(selectQuery);

			// Create new table without CHECK constraint
			const newTableName = `${tableName}_new`;

			// Build column definitions without CHECK constraints
			const columnDefs = columns.map((col) => {
				const colName = col[1]; // Column name
				const colType = col[2]; // Column type
				const notNull = col[3]; // NOT NULL
				const defaultValue = col[4]; // Default value
				const primaryKey = col[5]; // Primary key

				let def = `${colName} ${colType}`;
				if (notNull) def += ' NOT NULL';
				if (primaryKey) def += ' PRIMARY KEY AUTOINCREMENT';
				if (defaultValue !== null) def += ` DEFAULT ${defaultValue}`;

				// Skip CHECK constraints entirely
				// No CHECK constraint will be added

				return def;
			});

			const createQuery = `CREATE TABLE ${newTableName} (${columnDefs.join(
				', '
			)})`;
			this.db.exec(createQuery);

			// Copy data to new table
			if (data.length > 0) {
				const insertQuery = `INSERT INTO ${newTableName} SELECT * FROM ${tableName}`;
				this.db.exec(insertQuery);
			}

			// Drop old table and rename new table
			this.db.exec(`DROP TABLE ${tableName}`);
			this.db.exec(`ALTER TABLE ${newTableName} RENAME TO ${tableName}`);

		} catch (error) {
			console.error('Error removing CHECK constraint:', error);
			// Don't throw - this is a safety operation
		}
	}

	/**
	 * Remove CHECK constraint for enum field
	 * @param {string} tableName - Name of the table
	 * @param {string} fieldName - Name of the enum field
	 * @returns {Promise<void>}
	 */
	async removeCheckConstraint(tableName, fieldName) {
		try {

			// Get current table structure
			const tableInfo = this.db.exec(`PRAGMA table_info(${tableName})`);
			const columns = tableInfo[0]?.values || [];

			// Get all data from the current table
			const selectQuery = `SELECT * FROM ${tableName}`;
			const data = this.db.exec(selectQuery);

			// Create new table without CHECK constraint
			const newTableName = `${tableName}_new`;

			// Build column definitions without CHECK constraints
			const columnDefs = columns.map((col) => {
				const colName = col[1]; // Column name
				const colType = col[2]; // Column type
				const notNull = col[3]; // NOT NULL
				const defaultValue = col[4]; // Default value
				const primaryKey = col[5]; // Primary key

				let def = `${colName} ${colType}`;
				if (notNull) def += ' NOT NULL';
				if (primaryKey) def += ' PRIMARY KEY AUTOINCREMENT';
				if (defaultValue !== null) def += ` DEFAULT ${defaultValue}`;

				// Skip CHECK constraints entirely
				// No CHECK constraint will be added

				return def;
			});

			const createQuery = `CREATE TABLE ${newTableName} (${columnDefs.join(
				', '
			)})`;
			this.db.exec(createQuery);

			// Copy data to new table
			if (data.length > 0) {
				const insertQuery = `INSERT INTO ${newTableName} SELECT * FROM ${tableName}`;
				this.db.exec(insertQuery);
			}

			// Drop old table and rename new table
			this.db.exec(`DROP TABLE ${tableName}`);
			this.db.exec(`ALTER TABLE ${newTableName} RENAME TO ${tableName}`);

		} catch (error) {
			console.error('Error removing CHECK constraint:', error);
			throw error;
		}
	}

	/**
	 * Update CHECK constraint for enum field
	 * @param {string} tableName - Name of the table
	 * @param {string} fieldName - Name of the enum field
	 * @param {Array} options - New enum options
	 * @returns {Promise<void>}
	 */
	async updateEnumConstraint(tableName, fieldName, options) {
		const maxRetries = 3;
		let retryCount = 0;

		while (retryCount < maxRetries) {
			try {
				// Clean up any existing temporary table from previous attempts
				const newTableName = `${tableName}_new`;
				try {
					this.db.exec(`DROP TABLE IF EXISTS ${newTableName}`);
				} catch (e) {
					// Ignore errors if table doesn't exist
				}

				// SQLite doesn't support modifying CHECK constraints directly
				// We need to recreate the table with the new constraint

				// Get current table structure
				const tableInfo = this.db.exec(
					`PRAGMA table_info(${tableName})`
				);
				const columns = tableInfo[0]?.values || [];

				// Get all data from the current table
				const selectQuery = `SELECT * FROM ${tableName}`;
				const data = this.db.exec(selectQuery);

				// Create new table with updated constraint
				const constraintOptions = options
					.map((opt) => `'${opt}'`)
					.join(', ');

				// Build column definitions
				const columnDefs = columns.map((col) => {
					const colName = col[1]; // Column name
					const colType = col[2]; // Column type
					const notNull = col[3]; // NOT NULL
					const defaultValue = col[4]; // Default value
					const primaryKey = col[5]; // Primary key

					let def = `${colName} ${colType}`;
					if (notNull) def += ' NOT NULL';
					if (primaryKey) def += ' PRIMARY KEY AUTOINCREMENT';
					if (defaultValue !== null)
						def += ` DEFAULT ${defaultValue}`;

					// Skip CHECK constraint - let the app handle validation

					return def;
				});

				const createQuery = `CREATE TABLE ${newTableName} (${columnDefs.join(
					', '
				)})`;

				this.db.exec(createQuery);

				// Copy data to new table
				if (data.length > 0) {
					const insertQuery = `INSERT INTO ${newTableName} SELECT * FROM ${tableName}`;
					this.db.exec(insertQuery);
				}

				// Drop old table and rename new table
				this.db.exec(`DROP TABLE ${tableName}`);
				this.db.exec(
					`ALTER TABLE ${newTableName} RENAME TO ${tableName}`
				);

				break; // Success, exit retry loop
			} catch (error) {
				retryCount++;
				console.error(
					`Error updating enum constraint (attempt ${retryCount}/${maxRetries}):`,
					error
				);

				if (retryCount >= maxRetries) {
					console.error('Max retries reached, giving up');
					throw error;
				}

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		}
	}

	/**
	 * Bulk upsert items into the database
	 * @param {Array} items - Array of items to upsert
	 * @param {string} tableName - Name of the table to upsert into
	 * @returns {Promise<void>}
	 */
	async bulkUpsert(items, tableName = 'items') {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		if (!Array.isArray(items) || items.length === 0) {
			throw new Error('Items must be a non-empty array');
		}

		try {
			// Get the current schema to understand the table structure
			const metadata = this.getMetadata();
			const schema = metadata.schema;

			// Get fields from the schema (it's a flat structure)
			const fields = schema.fields || [];

			// Get the primary key field
			const primaryKeyField = fields.find((field) => field.primaryKey);
			if (!primaryKeyField) {
				throw new Error(`No primary key found for table ${tableName}`);
			}

			// Prepare field names for the upsert statement (escape for SQL reserved keywords)
			const fieldNames = fields.map((field) => `\`${field.name}\``).join(', ');

			// Process each item and build individual upsert queries
			for (const item of items) {
				const values = fields.map((field) => {
					if (field.autoIncrement && !item[field.name]) {
						return null; // Let auto-increment handle it
					}

					let value = item[field.name];

					// Handle different field types
					switch (field.type) {
						case 'datetime':
							if (field.name === 'created_at' && !value) {
								return new Date().toISOString();
							}
							if (field.name === 'modified_at') {
								return new Date().toISOString();
							}
							return value || null;
						case 'integer':
							return value ? parseInt(value) : null;
						case 'text':
						case 'enum':
						default:
							return value || null;
					}
				});

				// Build the upsert query for this specific item
				const valueStrings = values.map((value) => {
					if (value === null) return 'NULL';
					if (typeof value === 'string')
						return `'${value.replace(/'/g, "''")}'`;
					return value;
				});

				// Build update clause for non-primary key fields
				const updateFields = fields.filter(
					(field) => !field.primaryKey
				);
				const updateClause = updateFields
					.map((field) => {
						const fieldValue = valueStrings[fields.indexOf(field)];
						return `\`${field.name}\` = ${fieldValue}`;
					})
					.join(', ');

				const upsertQuery = `
					INSERT INTO ${tableName} (${fieldNames})
					VALUES (${valueStrings.join(', ')})
					ON CONFLICT(\`${primaryKeyField.name}\`) DO UPDATE SET
					${updateClause}
				`;

				this.db.exec(upsertQuery);
			}

		} catch (error) {
			console.error('Error in bulk upsert:', error);
			throw error;
		}
	}

	/**
	 * Setup database cleanup functions on window object for easy access
	 * @param {Object} handlers - Database handlers object
	 */
	setupCleanupFunctions(handlers) {
		window.dbCleanup = {
			stats: async () => {
				await handlers.handleGetDatabaseStats();
			},
			cleanup: async () => {
				await handlers.handleCleanupDatabase();
			},
			removeTables: async () => {
				await handlers.handleRemoveUnusedTables();
			},
			tables: () => {
				if (this.isLoaded()) {
					const tables = this.getTableNames();
					return tables;
				} else {
					return [];
				}
			},
		};

	}

	/**
	 * Execute a custom SQL query
	 * @param {string} query - SQL query to execute
	 * @returns {Promise<Object>} Query result
	 */
	async executeQuery(query) {
		if (!this.db) {
			throw new Error('No database loaded');
		}

		try {
			
			// Execute the query
			const result = this.db.exec(query);
			
			// Return a structured result
			return {
				success: true,
				query: query,
				results: result,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			console.error('Query execution error:', error);
			throw new Error(`Query execution failed: ${error.message}`);
		}
	}
}
