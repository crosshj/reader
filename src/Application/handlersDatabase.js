import { dispatchEvent } from '../_lib/utils.js';

/**
 * Database operation handlers for ApplicationController
 */
export function getHandlers(appController) {
	const dispatchDbState = async (
		action,
		message,
		state = null,
		metadata = null
	) => {
		// Get current database state if not provided
		if (!state) {
			state = {};
			try {
				const itemsResults =
					appController.databaseService.queryTable('items');
				state['items'] = itemsResults;
			} catch (tableError) {
				state['items'] = { error: tableError.message };
			}
		}

		// Get current metadata if not provided
		if (!metadata) {
			metadata = {
				version: appController.databaseService.getVersion(),
				schema: appController.databaseService.getSchema(),
			};
		}

		// Notify persistence service about database state change
		await appController.persistenceService.handleDatabaseStateChange(action, state);

		dispatchEvent('db:state', {
			action,
			state,
			metadata,
			message,
		});
	};

	/**
	 * Save current database to file system
	 */
	const saveDatabaseToFileSystem = async () => {
		try {
			// Get current file name
			const fileName = appController.currentFileName || appController.persistenceService.getCurrentFileName();
			if (!fileName) {
				console.warn('No file name available for saving');
				return;
			}

			// Export current database
			const dbData = appController.databaseService.exportDatabase();
			
			// Save to folder service
			await appController.folderService.writeFile(fileName, dbData);
			
			// Mark as saved in persistence service
			appController.persistenceService.markAsSaved();
			
		} catch (error) {
			console.error('Error saving database to file system:', error);
		}
	};

	return {
		async handleLoadFromFile(file) {
		// Store the previous current file name before attempting to load
		const previousFileName = appController.currentFileName;
		
		try {
			let arrayBuffer;
			if (file.arrayBuffer) {
				// File picker path - get binary data directly
				arrayBuffer = await file.arrayBuffer();
			} else {
				// Folder service path - need to handle base64 data
				const fileData = await appController.folderService.readFile(file.name || file);
				
				if (typeof fileData === 'string') {
					// Convert base64 string back to ArrayBuffer
					const binaryString = atob(fileData);
					const bytes = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						bytes[i] = binaryString.charCodeAt(i);
					}
					arrayBuffer = bytes.buffer;
				} else {
					// Already binary data
					arrayBuffer = fileData;
				}
			}
			
			const dbInfo = await appController.databaseService.loadFromFile(arrayBuffer);
			
			dispatchDbState('loaded', 'Database loaded successfully', null, {
					version: dbInfo.version,
					schema: dbInfo.schema,
					tables: dbInfo.tables,
			});
			
			// Set current file name only if database loads successfully
			appController.currentFileName = file.name;
			
			// Only notify persistence service if database loads successfully
				appController.persistenceService.handleFileOpened(file);
				
				// Save file content to app storage for persistence
				await appController.persistenceService.saveFileContent(arrayBuffer, file.name);
				
				// Mark as clean since we just loaded the file
				appController.persistenceService.markAsSaved();
		} catch (error) {
			console.error('Error loading database:', error);
			// Don't notify persistence service on error - file was not successfully opened
			
			// Provide user-friendly error message
			const userMessage = 'Error loading database from file';
			
			dispatchEvent('db:state', {
				action: 'error',
				error: userMessage,
				message: userMessage,
			});
			
			// Restore the previous current file name since loading failed
			appController.currentFileName = previousFileName;
			
			// Get files from current folder to show in noFile state
			try {
				const filesResult = await appController.folderService.getFiles();
				const folderName = await appController.folderService.getFolderName();
				
				// Extract files array from the result object
				const files = filesResult.files || [];
				
				// Dispatch app:state to show noFile with available files
				dispatchEvent('app:state', {
					state: 'noFile',
					data: { 
						files: files, 
						folderName: folderName || '', 
						currentFileName: appController.currentFileName || ''
					}
				});
			} catch (folderError) {
				// If we can't get files, still show noFile state but without files
				dispatchEvent('app:state', {
					state: 'noFile',
					data: { files: [], folderName: '', currentFileName: appController.currentFileName || '' }
				});
			}
		}
		},

		async handleLoadFromArrayBuffer(arrayBuffer) {
			try {
				const dbInfo = await appController.databaseService.loadFromFile(arrayBuffer);
				
				dispatchDbState('loaded', 'Database loaded successfully', null, {
					version: dbInfo.version,
					schema: dbInfo.schema,
					tables: dbInfo.tables,
				});
				
				// Don't notify persistence service - this is for temporary databases
			} catch (error) {
				console.error('Error loading database from ArrayBuffer:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error: ${error.message}`,
				});
				
				// Get files from current folder to show in noFile state
				try {
					const filesResult = await appController.folderService.getFiles();
					const folderName = await appController.folderService.getFolderName();
					
					// Extract files array from the result object
					const files = filesResult.files || [];
					
					// Dispatch app:state to show noFile with available files
					dispatchEvent('app:state', {
						state: 'noFile',
						data: { files: files, folderName: folderName || '' }
					});
				} catch (folderError) {
					// If we can't get files, still show noFile state but without files
					dispatchEvent('app:state', {
						state: 'noFile',
						data: { files: [], folderName: '' }
					});
				}
			}
		},

		async handleLoadDatabase() {
			try {
				const fileData = appController.fileService.getFileData();
				if (!fileData) {
					throw new Error(
						'No file data available. Open a file first.'
					);
				}

				const arrayBuffer = await fileData.arrayBuffer();
				const dbInfo = await appController.databaseService.loadFromFile(
					arrayBuffer
				);

				// Get only items table data
				const allResults = {};
				try {
					const itemsResults =
						appController.databaseService.queryTable('items');
					allResults['items'] = itemsResults;
				} catch (tableError) {
					allResults['items'] = { error: tableError.message };
				}

				dispatchEvent('db:state', {
					action: 'file_opened',
					state: allResults,
					metadata: {
						version: dbInfo.version,
						schema: dbInfo.schema,
					},
					message: 'Database loaded successfully',
				});
			} catch (error) {
				console.error('Error loading database:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error: ${error.message}`,
				});
				
				// Get files from current folder to show in noFile state
				try {
					const filesResult = await appController.folderService.getFiles();
					const folderName = await appController.folderService.getFolderName();
					
					// Extract files array from the result object
					const files = filesResult.files || [];
					
					// Dispatch app:state to show noFile with available files
					dispatchEvent('app:state', {
						state: 'noFile',
						data: { files: files, folderName: folderName || '' }
					});
				} catch (folderError) {
					// If we can't get files, still show noFile state but without files
					dispatchEvent('app:state', {
						state: 'noFile',
						data: { files: [], folderName: '' }
					});
				}
			}
		},

		async handleInsertData(event) {
			try {
				// Extract parameters from event detail or use defaults
				const tableName = event?.detail?.tableName || 'items';
				const data = event?.detail?.data || {
					text: 'Test item',
				};

				if (!appController.databaseService.isLoaded()) {
					throw new Error('No database loaded');
				}

				const insertId = appController.databaseService.insertData(
					tableName,
					data
				);

				// Save to file system immediately
				await saveDatabaseToFileSystem();

				dispatchDbState(
					'item_inserted',
					`Item inserted successfully (ID: ${insertId})`
				);
			} catch (error) {
				console.error('Error inserting data:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error: ${error.message}`,
				});
			}
		},

		async handleUpdateData(event) {
			try {
				// Extract parameters from event detail or use defaults
				const tableName = event?.detail?.tableName || 'items';
				const data = event?.detail?.data || {};
				const whereClause = event?.detail?.whereClause;

				if (!appController.databaseService.isLoaded()) {
					throw new Error('No database loaded');
				}

				// Use provided whereClause or fall back to last item
				let finalWhereClause = whereClause;
				if (!finalWhereClause) {
					const lastItem =
						appController.databaseService.queryTable(tableName);
					if (!lastItem || lastItem.length === 0) {
						throw new Error('No items to update');
					}
					const lastId = lastItem[lastItem.length - 1].id;
					finalWhereClause = `id = ${lastId}`;
				}


				const rowsAffected = appController.databaseService.updateData(
					tableName,
					data,
					finalWhereClause
				);

				// Save to file system immediately
				await saveDatabaseToFileSystem();

				dispatchDbState(
					'item_updated',
					`Item updated successfully (${rowsAffected} rows affected)`
				);
			} catch (error) {
				console.error('Error updating data:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error: ${error.message}`,
				});
			}
		},

		async handleDeleteData(event) {
			try {
				// Extract parameters from event detail or use defaults
				const tableName = event?.detail?.tableName || 'items';
				const whereClause = event?.detail?.whereClause || '1=0'; // Safe default that deletes nothing

				if (!appController.databaseService.isLoaded()) {
					throw new Error('No database loaded');
				}

				const rowsAffected = appController.databaseService.deleteData(
					tableName,
					whereClause
				);

				// Save to file system immediately
				await saveDatabaseToFileSystem();

				dispatchDbState(
					'item_deleted',
					`Item deleted successfully (${rowsAffected} rows affected)`
				);
			} catch (error) {
				console.error('Error deleting data:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error: ${error.message}`,
				});
			}
		},

		async handleExportDatabase() {
			try {

				if (!appController.databaseService.isLoaded()) {
					throw new Error('No database loaded');
				}

				const dbData = appController.databaseService.exportDatabase();

				dispatchEvent('db:query', {
					action: 'export',
					size: dbData.byteLength,
					message: 'Database exported successfully',
				});
			} catch (error) {
				console.error('Error exporting database:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error: ${error.message}`,
				});
			}
		},

		async handleUpdateMetadata(e) {
			const { metadata } = e.detail;

			try {
				// Update the database schema
				await appController.databaseService.updateSchema(metadata);
				
				// Update app state
				appController.currentSchema = metadata;
				
				// Save to file system
				await saveDatabaseToFileSystem();
				
				dispatchDbState(
					'metadata_updated',
					'Database metadata updated and saved successfully'
				);
			} catch (error) {
				console.error('Error updating metadata:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error updating metadata: ${error.message}`,
				});
			}
		},

		async handleCreateNewFile(e) {
			const { metadata } = e.detail;

			try {
				// Derive filename from database title
				// Remove all non-alphanumeric characters (including spaces and punctuation)
				const cleanTitle = metadata.title.replace(/[^a-zA-Z0-9]/g, '');
				
				// Fallback to 'Database' if title becomes empty after cleaning
				const baseFileName = cleanTitle || 'Database';
				
				// Add .smartText extension
				const fullFileName = `${baseFileName}.smartText`;

				// Save the file to persist changes
				const dbData = appController.databaseService.exportDatabase();

				// Save new file to folder service
				await appController.folderService.writeFile(fullFileName, dbData);
				
				// Set as current file in app state
				appController.currentFileName = fullFileName;
				
				// Mark as saved and clear new file flag
				appController.persistenceService.markAsSaved();
				appController.persistenceService.setSavedFileName(fullFileName);
				appController.isNewFile = false;
				
				// Clear loading state and transition to dynamic UI
				dispatchEvent('app:state', { state: 'loading', message: '' });
				
				// Trigger database state to show the dynamic UI with current schema
				dispatchDbState(
					'file_created',
					'New file created and saved successfully',
					appController.currentState || {},
					{ schema: appController.currentSchema }
				);
			} catch (error) {
				console.error('Error creating new file:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error creating new file: ${error.message}`,
				});
			}
		},

		async handleBulkUpsert(e) {
			const { items, tableName } = e.detail;

			try {
				await appController.databaseService.bulkUpsert(
					items,
					tableName
				);

				// Save to file system immediately
				await saveDatabaseToFileSystem();

				dispatchDbState(
					'bulk_upserted',
					`Bulk upserted ${items.length} items`
				);
			} catch (error) {
				console.error('Error in bulk upsert:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error in bulk upsert: ${error.message}`,
				});
			}
		},

		async handleCleanupDatabase() {
			try {
				const cleanupResults = await appController.databaseService.cleanupDatabase();

				// Save to file system immediately
				await saveDatabaseToFileSystem();

				dispatchDbState(
					'cleanup',
					`Database cleaned up! Saved ${cleanupResults.savedBytes} bytes (${cleanupResults.savedPercent}%)`
				);
			} catch (error) {
				console.error('Error cleaning up database:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Cleanup error: ${error.message}`,
				});
			}
		},

		async handleRemoveUnusedTables() {
			try {
				const cleanupResults = await appController.databaseService.removeUnusedTables();

				// Save to file system immediately
				await saveDatabaseToFileSystem();

				dispatchDbState('cleanup_tables', cleanupResults.message);
			} catch (error) {
				console.error('Error removing unused tables:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Table cleanup error: ${error.message}`,
				});
			}
		},

		async handleGetDatabaseStats() {
			try {
			} catch (error) {
				console.error('Error getting database stats:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Stats error: ${error.message}`,
				});
			}
		},

		async handleExecuteQuery(e) {
			const { query } = e.detail;
			
			try {
				// Execute query using database service
				const result = await appController.databaseService.executeQuery(query);
				
				// Log clean query results to console
				console.log(`🔍 Query:\n${query}`);
				
				if (result.results && result.results.length > 0) {
					result.results.forEach((resultSet, index) => {
						if (resultSet.values && resultSet.values.length > 0) {
							// Create a clean table display
							const tableData = resultSet.values.map(row => {
								const rowObj = {};
								resultSet.columns.forEach((col, i) => {
									rowObj[col] = row[i];
								});
								return rowObj;
							});
							console.table(tableData);
						} else {
							console.log('No data returned');
						}
					});
				} else {
					console.log('No results returned');
				}
				
			// Dispatch success event
				dispatchEvent('db:state', {
					action: 'query_executed',
					message: 'Query executed successfully',
					queryResult: result,
				});
			} catch (error) {
				console.error('❌ Query Error:', error.message);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Query error: ${error.message}`,
				});
			}
		},
	};
}
