/**
 * Persistence Service
 * Handles single-file persistence workflow for the app
 */
export class PersistenceService {
	constructor(databaseService = null) {
		this.currentFile = null;
		this.hasUnsavedChanges = false;
		this.savedFileName = null; // Track the name of the file when saved
		this.isDirty = false; // Track if there are unsaved changes
		this.databaseService = databaseService; // Reference to database service for exporting
	}

	/**
	 * Handle file opened - called directly by handlers
	 */
	handleFileOpened(file = null, fileHandle = null) {
		// This will be called when a file is opened
		// We'll track the file and mark as saved initially
		this.hasUnsavedChanges = false;
		
		// Store file info for persistence
		if (file) {
			this.setCurrentFile({
				name: file.name,
				lastOpened: new Date().toISOString(),
				hasFileHandle: !!fileHandle
			});
		}
	}

	/**
	 * Handle database state changes - called directly by handlers
	 */
	async handleDatabaseStateChange(action, state) {
		// Only update persistence for actual data changes, not file loading or errors
		if (action && action !== 'file_opened' && action !== 'file_saved' && action !== 'error') {
			// Check if database is loaded before trying to update persistence
			if (this.databaseService && this.databaseService.isLoaded()) {
				await this.updatePersistenceWithChanges(state);
				this.markAsUnsaved();
			}
		}
	}

	/**
	 * Mark file as having unsaved changes
	 */
	markAsUnsaved() {
		this.hasUnsavedChanges = true;
		this.isDirty = true;
	}

	/**
	 * Mark file as saved
	 */
	markAsSaved() {
		this.hasUnsavedChanges = false;
		this.isDirty = false;
	}

	/**
	 * Check if there are unsaved changes
	 */
	hasUnsavedChanges() {
		return this.hasUnsavedChanges;
	}

	/**
	 * Prompt user to save or discard changes
	 */
	async promptSaveOrDiscard() {
		if (!this.isDirty) {
			return true; // No changes to save
		}

		const choice = confirm('You have unsaved changes. Do you want to save before continuing?');
		if (choice) {
			// User wants to save - return a signal that save is needed
			return { needsSave: true };
		} else {
			// User wants to discard changes
			this.markAsSaved();
			return { needsSave: false };
		}
	}

	/**
	 * Close current file
	 */
	async closeFile() {
		// Since we have automatic saving, no need to prompt user
		// Just clear the state and close the file
		
		// Clear in-memory state
		this.currentFile = null;
		this.hasUnsavedChanges = false;
		this.isDirty = false;
		this.savedFileName = null;
		
		// Clear persistence layer
		localStorage.removeItem('persistedFileContent');
		localStorage.removeItem('persistedFileName');
		localStorage.removeItem('persistedFileTimestamp');
		
		// Return signal that splash screen should be shown
		return { showSplash: true };
	}

	/**
	 * Set current file info
	 */
	setCurrentFile(fileInfo) {
		this.currentFile = fileInfo;
	}

	/**
	 * Get current file info
	 */
	getCurrentFile() {
		return this.currentFile;
	}

	/**
	 * Get current file content as ArrayBuffer
	 */
	async getCurrentFileContent() {
		try {
			const base64 = localStorage.getItem('persistedFileContent');
			if (!base64) {
				return null;
			}

			// Convert base64 back to ArrayBuffer
			const binaryString = atob(base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			return bytes.buffer;
		} catch (error) {
			console.error('Error getting current file content:', error);
			return null;
		}
	}

	/**
	 * Get current file name
	 */
	getCurrentFileName() {
		return localStorage.getItem('persistedFileName') || null;
	}

	/**
	 * Set saved file name (when user saves to a specific location)
	 */
	setSavedFileName(fileName) {
		this.savedFileName = fileName;
	}

	/**
	 * Get saved file name
	 */
	getSavedFileName() {
		return this.savedFileName;
	}

	/**
	 * Update persistence layer with current database changes
	 */
	async updatePersistenceWithChanges(state) {
		try {
			
			// We need access to the database service to export the current database
			// This will be passed in when the persistence service is created
			if (this.databaseService && this.databaseService.isLoaded()) {
				const currentDbContent = this.databaseService.exportDatabase();
				
				const fileName = this.getCurrentFileName();
				
				if (currentDbContent && fileName) {
					await this.saveFileContent(currentDbContent, fileName);
				} else {
					console.warn('Missing content or filename:', { currentDbContent: !!currentDbContent, fileName });
				}
			} else {
				console.warn('Database service not available for persistence update');
			}
			
		} catch (error) {
			console.error('Error updating persistence with changes:', error);
			// Don't show alert, just log the error
		}
	}

	/**
	 * Check if there's a file to restore
	 */
	hasFileToRestore() {
		return !!this.currentFile;
	}

	/**
	 * Save file content to app storage
	 */
	async saveFileContent(fileContent, fileName) {
		try {
			
			// Convert ArrayBuffer to base64 for storage
			const base64 = btoa(String.fromCharCode(...new Uint8Array(fileContent)));
			
			
			// Save to localStorage
			localStorage.setItem('persistedFileContent', base64);
			localStorage.setItem('persistedFileName', fileName);
			localStorage.setItem('persistedFileTimestamp', new Date().toISOString());
			
			return true;
		} catch (error) {
			console.error('Error saving file content:', error);
			return false;
		}
	}

	/**
	 * Restore file from persistence
	 */
	async restoreFile() {
		try {
			const base64 = localStorage.getItem('persistedFileContent');
			const fileName = localStorage.getItem('persistedFileName');
			
			
			if (!base64 || !fileName) {
				return false;
			}


			// Convert base64 back to ArrayBuffer
			const binaryString = atob(base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const fileContent = bytes.buffer;

			// Create a file object
			const file = new File([fileContent], fileName, {
				type: 'application/octet-stream'
			});

			
			// Return the file for the caller to handle
			return { file, success: true };
		} catch (error) {
			console.error('Error restoring file:', error);
			return false;
		}
	}
}
