import { dispatchEvent } from '../_lib/utils.js';

/**
 * File operation handlers for ApplicationController
 */
export function getHandlers(appController) {
	return {
		async handleOpenFile(event) {
			try {
				// Show loading state
				dispatchEvent('app:state', { state: 'loading', message: 'Opening file...' });

				let file;

				// Check if file was passed from system (file association)
				if (event?.detail?.file) {
					file = event.detail.file;
				} else {
					// Use file picker
					file = await appController.fileService.openFile();
				}

				if (file) {
					// Validate file type
					if (!file.name.toLowerCase().endsWith('.smarttext')) {
						throw new Error('Please select a .smartText file');
					}

					// Get file content for persistence
					const fileContent = await file.arrayBuffer();
					
					// No need to extract parent directory anymore - user will choose via directory picker
					
				// Call database handler to load the file
				await appController.databaseHandlers.handleLoadFromFile(
					file
				);

				// Only save file content and mark as saved if database loaded successfully
				// (The database handler will handle persistence on success)
				// Enable save button since we now have a file handle
				dispatchEvent('file:opened');

					// Save file handle for persistence (only if we have a file handle)
					if (appController.fileService.fileHandle) {
						try {
							if ('serialize' in appController.fileService.fileHandle) {
								const serialized = await appController.fileService.fileHandle.serialize();
								localStorage.setItem('lastFileHandle', JSON.stringify(serialized));
							}
						} catch (error) {
							console.warn('Could not save file handle:', error);
						}
					}
				} else {
					// Show splash screen again
					dispatchEvent('app:state', { state: 'splash' });
				}
			} catch (error) {
				console.error(`Error opening file: ${error.message}`);
				// Dispatch error event for UI to handle
				dispatchEvent('app:state', {
					state: 'fileError',
					error: error.message,
					data: { action: 'open' },
				});
			}
		},

		async handleCreateFile() {
			try {
				// Create a temporary barebones database for the modal to work with
				// This is loaded in memory but NOT saved as a file until user submits
				const tempDbData = await appController.databaseService.createBarebonesDatabase(appController);
				await appController.databaseHandlers.handleLoadFromArrayBuffer(tempDbData);

				// Set up the file context for saving
				appController.isNewFile = true;

				// Show the database metadata edit modal for creating a new file
				dispatchEvent('ui:showMetadataEdit', { isNewFile: true });

			} catch (error) {
				console.error(`Error creating file: ${error.message}`);
				// Dispatch error event for UI to handle
				dispatchEvent('app:state', {
					state: 'fileError',
					error: error.message,
					data: { action: 'create' },
				});
			}
		},

		async handleSaveFile() {
			try {
				dispatchEvent('app:state', { state: 'loading', message: 'Saving file...' });
				
				// Get current file content from persistence service
				const currentFileContent = await appController.persistenceService.getCurrentFileContent();
				if (!currentFileContent) {
					throw new Error('No file content to save.');
				}

				// Check if this is a new file being created
				if (appController.isNewFile && appController.currentFileName) {
					// Save to folder service
					await appController.folderService.writeFile(appController.currentFileName, currentFileContent);
					
					// Mark as saved and clear new file flag
					appController.persistenceService.markAsSaved();
					appController.persistenceService.setSavedFileName(appController.currentFileName);
					appController.isNewFile = false;
					appController.currentFileName = null;
					
					dispatchEvent('file:saved');
					
					// Clear loading state and show dynamic UI
					dispatchEvent('app:state', { state: 'loading', message: '' });
					
					// Trigger a database state refresh to show the dynamic UI
					dispatchEvent('db:state', {
						action: 'file_saved',
						state: appController.currentState || {},
						metadata: appController.currentSchema ? { schema: appController.currentSchema } : {},
						message: 'File saved successfully'
					});
				} else {
					// Existing file - use normal save flow
					const suggestedName = appController.persistenceService.getCurrentFileName() || 'database.smartText';
					await appController.fileService.saveFileAs(currentFileContent, suggestedName, appController.persistenceService);
					
					// Update file data after saving
					appController.fileService.updateFileData(currentFileContent);
					
					// Mark as saved in persistence service
					appController.persistenceService.markAsSaved();
					appController.persistenceService.setSavedFileName(appController.fileService.getFileData()?.name || 'database.smartText');
					
					dispatchEvent('file:saved');
					
					// Clear loading state and restore UI
					dispatchEvent('app:state', { state: 'loading', message: '' });
					
					// Trigger a database state refresh to restore the UI
					dispatchEvent('db:state', {
						action: 'file_saved',
						state: appController.currentState || {},
						metadata: appController.currentSchema ? { schema: appController.currentSchema } : {},
						message: 'File saved successfully'
					});
				}
			} catch (error) {
				console.error('Save failed:', error);
				dispatchEvent('app:state', {
					state: 'fileError',
					error: error.message,
					data: { action: 'save' },
				});
				// Clear loading state on error too
				dispatchEvent('app:state', { state: 'loading', message: '' });
			}
		},

		async saveFile(data) {
			try {
				await appController.fileService.saveFile(data);
				appController.fileService.updateFileData(data);
				dispatchEvent('file:saved');
			} catch (error) {
				console.error('Save failed:', error);
				// Dispatch error event for UI to handle
				dispatchEvent('app:state', {
					state: 'fileError',
					error: error.message,
					data: { action: 'save' },
				});
				throw error;
			}
		},
	};
}
