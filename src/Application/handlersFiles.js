import { dispatchEvent } from '../_lib/utils.js';

/**
 * File operation handlers for ApplicationController
 */
export function getHandlers(appController) {
	return {
		async handleOpenFile(event) {
			try {
				// Show loading state
				dispatchEvent('ui:loading', { message: 'Opening file...' });

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

					// Save file content to app storage for persistence
					await appController.persistenceService.saveFileContent(fileContent, file.name);

					// Mark as clean since we just loaded the file
					appController.persistenceService.markAsSaved();

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
					dispatchEvent('ui:showSplash');
				}
			} catch (error) {
				console.error(`Error opening file: ${error.message}`);
				// Dispatch error event for UI to handle
				dispatchEvent('file:error', {
					error: error.message,
					action: 'open',
				});
			}
		},

		async handleCreateFile() {
			try {
				// Show loading state
				dispatchEvent('ui:loading', {
					message: 'Creating new file...',
				});

				const success = await appController.fileService.createFile();
				if (success) {
					// Create a barebones SQLite database
					const dbData =
						await appController.databaseService.createBarebonesDatabase();

					// Save the database
					await appController.fileService.saveFile(dbData);

					// Update file data after saving
					appController.fileService.updateFileData(dbData);

					// Call database handler to load the created file
					await appController.databaseHandlers.handleLoadFromArrayBuffer(
						dbData
					);

					// Enable save button since we now have a file handle
					dispatchEvent('file:opened');
				} else {
					// Show splash screen again
					dispatchEvent('ui:showSplash');
				}
			} catch (error) {
				console.error(`Error creating file: ${error.message}`);
				// Dispatch error event for UI to handle
				dispatchEvent('file:error', {
					error: error.message,
					action: 'create',
				});
			}
		},

		async handleSaveFile() {
			try {
				alert('DEBUG: handleSaveFile called - starting save process');
				dispatchEvent('ui:loading', { message: 'Saving file...' });
				
				// Get current file content from persistence service
				alert('DEBUG: Getting current file content...');
				const currentFileContent = await appController.persistenceService.getCurrentFileContent();
				if (!currentFileContent) {
					alert('DEBUG: No file content found!');
					throw new Error('No file content to save.');
				}
				alert(`DEBUG: File content retrieved, size: ${currentFileContent.byteLength} bytes`);

				// Always use save as flow - let user choose where to save
				const suggestedName = appController.persistenceService.getCurrentFileName() || 'database.smartText';
				alert(`DEBUG: Calling fileService.saveFileAs with suggestedName: ${suggestedName}`);
				await appController.fileService.saveFileAs(currentFileContent, suggestedName, appController.persistenceService);
				
				// Update file data after saving
				appController.fileService.updateFileData(currentFileContent);
				
				// Mark as saved in persistence service
				appController.persistenceService.markAsSaved();
				appController.persistenceService.setSavedFileName(appController.fileService.getFileData()?.name || 'database.smartText');
				
				dispatchEvent('file:saved');
				
				// Clear loading state and restore UI
				dispatchEvent('ui:loading', { message: '' });
				
				// Trigger a database state refresh to restore the UI
				dispatchEvent('db:state', {
					action: 'file_saved',
					state: appController.currentState || {},
					metadata: appController.currentSchema ? { schema: appController.currentSchema } : {},
					message: 'File saved successfully'
				});
			} catch (error) {
				alert(`DEBUG: Error in handleSaveFile: ${error.message}`);
				console.error('Save failed:', error);
				dispatchEvent('file:error', {
					error: error.message,
					action: 'save',
				});
				// Clear loading state on error too
				dispatchEvent('ui:loading', { message: '' });
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
				dispatchEvent('file:error', {
					error: error.message,
					action: 'save',
				});
				throw error;
			}
		},
	};
}
