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

	return {
		async handleLoadFromFile(file) {
		try {
			const arrayBuffer = await file.arrayBuffer();
			const dbInfo = await appController.databaseService.loadFromFile(arrayBuffer);
			
			dispatchDbState('loaded', 'Database loaded successfully', null, {
					version: dbInfo.version,
					schema: dbInfo.schema,
					tables: dbInfo.tables,
			});
			
			// Only notify persistence service if database loads successfully
				appController.persistenceService.handleFileOpened(file);
				
				// Save file content to app storage for persistence
				await appController.persistenceService.saveFileContent(arrayBuffer, file.name);
				
				// Mark as clean since we just loaded the file
				appController.persistenceService.markAsSaved();
		} catch (error) {
			console.error('Error loading database:', error);
			// Don't notify persistence service on error - file was not successfully opened
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Error: ${error.message}`,
				});
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

				// Note: Auto-save is now handled by the persistence service
				// when db:state events are dispatched

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

				// Note: Auto-save is now handled by the persistence service
				// when db:state events are dispatched

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

				// Get the last item ID instead of hardcoded ID
				const lastItem =
					appController.databaseService.queryTable(tableName);
				if (!lastItem || lastItem.length === 0) {
					throw new Error('No items to delete');
				}
				const lastId = lastItem[lastItem.length - 1].id;
				const whereClause = `id = ${lastId}`;


				if (!appController.databaseService.isLoaded()) {
					throw new Error('No database loaded');
				}

				const rowsAffected = appController.databaseService.deleteData(
					tableName,
					whereClause
				);

				// Note: Auto-save is now handled by the persistence service
				// when db:state events are dispatched

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

				// Save the file to persist changes
				const dbData = appController.databaseService.exportDatabase();

				// Verify the exported data contains migrated values
				try {
					// Convert ArrayBuffer to string first
					const decoder = new TextDecoder();
					const dbDataString = decoder.decode(dbData);

					// Note: dbData is binary SQLite data, not JSON
					// We can't parse it as JSON for verification
					// const exportedDb = JSON.parse(dbDataString);
					// if (exportedDb.tables && exportedDb.tables.items) {
					// 	const items = exportedDb.tables.items;
					// 	const statusCounts = {};
					// 	items.forEach((item) => {
					// 		statusCounts[item.status] =
					// 			(statusCounts[item.status] || 0) + 1;
					// 	});
					// }
				} catch (e) {
				}

				// Don't save to file system here - let persistence service handle it
				// The persistence service will automatically update when db:state event fires

				// Use the existing dispatchDbState function
				dispatchDbState(
					'metadata_updated',
					'Database metadata updated successfully'
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

		async handleBulkUpsert(e) {
			const { items, tableName } = e.detail;

			try {
				await appController.databaseService.bulkUpsert(
					items,
					tableName
				);

				// Save the file to persist changes
				// Note: Auto-save is now handled by the persistence service
				// when db:state events are dispatched

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

				// Auto-save after cleanup
				// Note: Auto-save is now handled by the persistence service
				// when db:state events are dispatched

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

				// Note: Auto-save is now handled by the persistence service
				// when db:state events are dispatched

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
				
			// Dispatch success event
				dispatchEvent('db:state', {
					action: 'query_executed',
					message: 'Query executed successfully',
					queryResult: result,
				});
			} catch (error) {
				console.error('Error executing query:', error);
				dispatchEvent('db:state', {
					action: 'error',
					error: error.message,
					message: `Query error: ${error.message}`,
				});
			}
		},
	};
}
