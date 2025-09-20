import { DocumentTreeAccess } from 'capacitor-document-tree-access';

export class FolderService {
	constructor() {
		this.storedFolderName = null; // Store folder name for web compatibility
	}

	async getFiles() {
		try {
			const persistedResult = await DocumentTreeAccess.getPersistedUri();
			if (!persistedResult.uri) {
				return { files: null, error: 'no folder selected' };
			}

			const result = await DocumentTreeAccess.listFiles();
			const files = result.files.map(file => ({
				name: file.name,
				uri: file.uri,
				size: file.size,
				type: file.type || this.getFileType(file.name),
				modified: new Date()
			}));

			return { files, error: null };
		} catch (error) {
			return { files: null, error: `Cannot access folder: ${error.message}` };
		}
	}

	async getFolderName() {
		try {
			// For web, we need to use the stored folder name since the URI is virtual
			if (this.storedFolderName) {
				return this.storedFolderName;
			}

			const persistedResult = await DocumentTreeAccess.getPersistedUri();
			if (!persistedResult.uri) {
				return null;
			}
			
			// Check if this is the web virtual URI
			if (persistedResult.uri === 'virtual://web-dir') {
				// For web, we can't get the real folder name from the URI
				// Return a generic name or try to get it from localStorage
				const storedName = localStorage.getItem('selectedFolderName');
				return storedName || 'Selected Folder';
			}
			
			// For native platforms, extract folder name from URI
			const uri = persistedResult.uri;
			alert(`Extracting folder name from URI: ${uri}`);
			
			// Handle different URI formats and extract just the folder name
			let folderName;
			if (uri.includes('/')) {
				const parts = uri.split('/').filter(part => part.length > 0);
				// Get the last non-empty part
				folderName = parts[parts.length - 1];
			} else {
				folderName = uri;
			}
			
			// Clean up the folder name (remove any file:// prefix or other artifacts)
			folderName = folderName.replace(/^file:\/\//, '').replace(/\/$/, '');
			
			// Decode URL-encoded characters
			folderName = decodeURIComponent(folderName);
			
			// If folder name is still empty or just a path separator, try to get a meaningful name
			if (!folderName || folderName === '' || folderName === '/') {
				// Try to extract from the full path by looking for the last meaningful directory
				const pathParts = uri.split('/').filter(part => part.length > 0);
				for (let i = pathParts.length - 1; i >= 0; i--) {
					const part = pathParts[i];
					if (part && part !== 'content' && part !== 'tree' && !part.includes(':')) {
						folderName = decodeURIComponent(part);
						break;
					}
				}
			}
			
			alert(`Extracted folder name: ${folderName}`);
			return folderName || 'Database Files';
		} catch (error) {
			console.error('Error getting folder name:', error);
			return 'Database Files';
		}
	}

	async selectFolder() {
		try {
			const timeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('pickFolder timeout after 30 seconds')), 30000)
			);
			
			const result = await Promise.race([
				DocumentTreeAccess.pickFolder(),
				timeoutPromise
			]);
			
			if (result.uri) {
				await new Promise(resolve => setTimeout(resolve, 500));
				const persistedResult = await DocumentTreeAccess.getPersistedUri();
				return { success: true, error: null };
			} else {
				return { success: false, error: 'No folder selected' };
			}
		} catch (error) {
			return { success: false, error: `Failed to select folder: ${error.message}` };
		}
	}

	async readFile(fileName) {
		try {
			alert(`FolderService: Reading file ${fileName}`);
			const result = await DocumentTreeAccess.readFile({ name: fileName });
			alert(`FolderService: File read result type: ${typeof result}, has data: ${result && result.data !== undefined}`);
			
			if (!result || result.data === undefined) {
				throw new Error(`No data returned for file: ${fileName}`);
			}
			
			return result.data;
		} catch (error) {
			alert(`Error reading file ${fileName}: ${error.message}`);
			throw new Error(`Failed to read file ${fileName}: ${error.message}`);
		}
	}

	async writeFile(fileName, content) {
		try {
			// Convert ArrayBuffer to base64 for Android plugin
			let base64Data;
			if (content instanceof ArrayBuffer) {
				const bytes = new Uint8Array(content);
				const binaryString = String.fromCharCode(...bytes);
				base64Data = btoa(binaryString);
			} else if (content instanceof Uint8Array) {
				const binaryString = String.fromCharCode(...content);
				base64Data = btoa(binaryString);
			} else {
				// Assume it's already base64 or plain text
				base64Data = content;
			}
			
			await DocumentTreeAccess.writeFile({ name: fileName, data: base64Data });
			return true;
		} catch (error) {
			console.error('Error writing file:', error);
			throw error;
		}
	}

	async deleteFile(fileName) {
		try {
			await DocumentTreeAccess.deleteFile({ name: fileName });
			return true;
		} catch (error) {
			console.error('Error deleting file:', error);
			throw error;
		}
	}

	formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	async clearSelectedFolder() {}

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