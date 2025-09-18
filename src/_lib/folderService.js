import { DocumentTreeAccess } from 'capacitor-document-tree-access';

export class FolderService {
	constructor() {
		// Plugin handles persistence automatically
	}

	/**
	 * Get list of files from the currently selected folder
	 * @returns {Promise<{files: Array|null, error: string|null}>} Result object with files array and error
	 */
	async getFiles() {
		try {
			// Check if we have a persisted folder
			alert('DEBUG: Checking for persisted folder...');
			const persistedResult = await DocumentTreeAccess.getPersistedUri();
			alert(`DEBUG: Persisted result: ${JSON.stringify(persistedResult)}`);
			
			if (!persistedResult.uri) {
				alert('DEBUG: No persisted folder found');
				return { files: null, error: 'no folder selected' };
			}

			alert('DEBUG: Found persisted folder, listing files...');
			// Get files from the plugin (works on both web and native)
			const result = await DocumentTreeAccess.listFiles();
			alert(`DEBUG: List files result: ${JSON.stringify(result)}`);
			
			const files = result.files.map(file => ({
				name: file.name,
				uri: file.uri,
				size: file.size,
				type: file.type || this.getFileType(file.name),
				modified: new Date() // Plugin doesn't provide modification time
			}));

			alert(`DEBUG: Mapped files: ${JSON.stringify(files)}`);
			return { files, error: null };
		} catch (error) {
			alert(`DEBUG: Error reading folder contents: ${error.message}`);
			return { files: null, error: `Cannot access folder: ${error.message}` };
		}
	}


	/**
	 * Select a folder for file operations
	 * @returns {Promise<{success: boolean, error: string|null}>} Result object
	 */
	async selectFolder() {
		try {
			alert('DEBUG: About to call DocumentTreeAccess.pickFolder()');
			const result = await DocumentTreeAccess.pickFolder();
			alert(`DEBUG: DocumentTreeAccess.pickFolder() returned: ${JSON.stringify(result)}`);
			
			if (result.uri) {
				alert('DEBUG: Folder has URI, proceeding...');
				// Add a small delay to ensure the folder selection is properly persisted
				await new Promise(resolve => setTimeout(resolve, 500));
				
				// Verify the folder was persisted
				const persistedResult = await DocumentTreeAccess.getPersistedUri();
				alert(`DEBUG: Persistence verification: ${JSON.stringify(persistedResult)}`);
				
				return { success: true, error: null };
			} else {
				alert('DEBUG: No URI in result');
				return { success: false, error: 'No folder selected' };
			}
		} catch (error) {
			alert(`DEBUG: Error in selectFolder: ${error.message}`);
			return { success: false, error: `Failed to select folder: ${error.message}` };
		}
	}


	/**
	 * Read file content
	 * @param {string} fileName - Name of file to read
	 * @returns {Promise<string>} File content
	 */
	async readFile(fileName) {
		try {
			const result = await DocumentTreeAccess.readFile({ name: fileName });
			return result.data;
		} catch (error) {
			console.error('Error reading file:', error);
			throw error;
		}
	}

	/**
	 * Write file content
	 * @param {string} fileName - Name of file to write
	 * @param {string} content - Content to write
	 * @returns {Promise<boolean>} Success status
	 */
	async writeFile(fileName, content) {
		try {
			await DocumentTreeAccess.writeFile({ name: fileName, data: content });
			return true;
		} catch (error) {
			console.error('Error writing file:', error);
			throw error;
		}
	}

	/**
	 * Delete file
	 * @param {string} fileName - Name of file to delete
	 * @returns {Promise<boolean>} Success status
	 */
	async deleteFile(fileName) {
		try {
			await DocumentTreeAccess.deleteFile({ name: fileName });
			return true;
		} catch (error) {
			console.error('Error deleting file:', error);
			throw error;
		}
	}

	/**
	 * Format file size for display
	 * @param {number} bytes - File size in bytes
	 * @returns {string} Formatted file size
	 */
	formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	/**
	 * Clear the selected folder (plugin handles persistence automatically)
	 */
	async clearSelectedFolder() {
		// Plugin handles persistence automatically, so we don't need to do anything here
		// The user would need to select a new folder through the UI
	}

	/**
	 * Get file type based on extension
	 */
	getFileType(fileName) {
		const extension = fileName.split('.').pop().toLowerCase();
		const typeMap = {
			'txt': 'text/plain',
			'json': 'application/json',
			'csv': 'text/csv',
			'pdf': 'application/pdf',
			'doc': 'application/msword',
			'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'xls': 'application/vnd.ms-excel',
			'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'png': 'image/png',
			'jpg': 'image/jpeg',
			'jpeg': 'image/jpeg',
			'gif': 'image/gif',
			'mp4': 'video/mp4',
			'mp3': 'audio/mpeg'
		};
		return typeMap[extension] || 'application/octet-stream';
	}
}