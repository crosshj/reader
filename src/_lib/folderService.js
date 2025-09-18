export class FolderService {
	constructor() {
		this.selectedFolderHandle = null;
	}

	/**
	 * Get list of files from the currently selected folder
	 * @returns {Promise<{files: Array|null, error: string|null}>} Result object with files array and error
	 */
	async getFiles() {
		if (!this.selectedFolderHandle) {
			// Try to restore from persistence
			await this.restoreFolderHandle();
		}

		if (!this.selectedFolderHandle) {
			return { files: null, error: 'no folder selected' };
		}

		try {
			return await this.getFilesFromFolder();
		} catch (error) {
			console.error('Error reading folder contents:', error);
			return { files: null, error: `Cannot access folder: ${error.message}` };
		}
	}

	async getFilesFromFolder() {
		const files = [];
		
		for await (const [name, handle] of this.selectedFolderHandle.entries()) {
			if (handle.kind === 'file' && name.endsWith('.smartText')) {
				try {
					const file = await handle.getFile();
					files.push({
						name: file.name,
						uri: name,
						size: file.size,
						modified: new Date(file.lastModified),
						type: file.type || this.getFileType(file.name)
					});
				} catch (fileError) {
					// Skip files we can't read
					console.warn(`Could not read file ${name}:`, fileError);
				}
			}
		}

		return { files, error: null };
	}

	/**
	 * Select a folder for file operations
	 * @returns {Promise<{success: boolean, error: string|null}>} Result object
	 */
	async selectFolder() {
		try {
			// Check if File System Access API is supported
			if (!('showDirectoryPicker' in window)) {
				return { success: false, error: 'File System Access API is not supported in this browser' };
			}

			// Request folder access
			const folderHandle = await window.showDirectoryPicker();
			this.selectedFolderHandle = folderHandle;
			
			// Persist the folder handle
			await this.persistFolderHandle(folderHandle);
			
			return { success: true, error: null };
		} catch (error) {
			console.error('Error selecting folder:', error);
			if (error.name === 'AbortError') {
				return { success: false, error: 'no folder selected' };
			}
			return { success: false, error: `Failed to select folder: ${error.message}` };
		}
	}

	/**
	 * Store folder handle in IndexedDB for persistence
	 */
	async storeFolderHandleInIndexedDB(handle) {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('FolderService', 1);
			
			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction(['folderHandles'], 'readwrite');
				const store = transaction.objectStore('folderHandles');
				
				// Store the handle with a key
				const putRequest = store.put(handle, 'currentFolder');
				putRequest.onsuccess = () => resolve();
				putRequest.onerror = () => reject(putRequest.error);
			};
			
			request.onupgradeneeded = () => {
				const db = request.result;
				db.createObjectStore('folderHandles');
			};
		});
	}

	/**
	 * Retrieve folder handle from IndexedDB
	 */
	async getFolderHandleFromIndexedDB() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('FolderService', 1);
			
			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction(['folderHandles'], 'readonly');
				const store = transaction.objectStore('folderHandles');
				
				const getRequest = store.get('currentFolder');
				getRequest.onsuccess = () => resolve(getRequest.result);
				getRequest.onerror = () => reject(getRequest.error);
			};
			
			request.onupgradeneeded = () => {
				const db = request.result;
				db.createObjectStore('folderHandles');
			};
		});
	}

	/**
	 * Try to restore a previously selected folder
	 */
	async tryRestoreWebFolder() {
		try {
			const handle = await this.getFolderHandleFromIndexedDB();
			if (handle) {
				// Verify the handle is still valid by checking permissions
				const permission = await handle.requestPermission({ mode: 'read' });
				if (permission === 'granted') {
					this.selectedFolderHandle = handle;
					return true;
				} else {
					// Permission was revoked, clear the stored handle
					await this.clearStoredFolderHandle();
					return false;
				}
			}
			return false;
		} catch (error) {
			console.warn('Could not restore folder:', error);
			return false;
		}
	}

	/**
	 * Clear stored folder handle from IndexedDB
	 */
	async clearStoredFolderHandle() {
		try {
			const request = indexedDB.open('FolderService', 1);
			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction(['folderHandles'], 'readwrite');
				const store = transaction.objectStore('folderHandles');
				store.delete('currentFolder');
			};
		} catch (error) {
			console.warn('Could not clear stored folder handle:', error);
		}
	}

	/**
	 * Read file content
	 * @param {string} fileName - Name of file to read
	 * @returns {Promise<string>} File content
	 */
	async readFile(fileName) {
		if (!this.selectedFolderHandle) {
			throw new Error('No folder selected');
		}

		try {
			const fileHandle = await this.selectedFolderHandle.getFileHandle(fileName);
			const file = await fileHandle.getFile();
			return await file.text();
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
		if (!this.selectedFolderHandle) {
			throw new Error('No folder selected');
		}

		try {
			const fileHandle = await this.selectedFolderHandle.getFileHandle(fileName, { create: true });
			const writable = await fileHandle.createWritable();
			await writable.write(content);
			await writable.close();
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
		if (!this.selectedFolderHandle) {
			throw new Error('No folder selected');
		}

		try {
			await this.selectedFolderHandle.removeEntry(fileName);
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
	 * Persist the selected folder handle
	 */
	async persistFolderHandle(handle) {
		try {
			await this.storeFolderHandleInIndexedDB(handle);
		} catch (error) {
			console.warn('Could not persist folder handle:', error);
		}
	}

	/**
	 * Restore the selected folder handle
	 */
	async restoreFolderHandle() {
		return await this.tryRestoreWebFolder();
	}

	/**
	 * Clear the selected folder
	 */
	async clearSelectedFolder() {
		this.selectedFolderHandle = null;
		await this.clearStoredFolderHandle();
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