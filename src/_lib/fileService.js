/**
 * File Service
 * Handles file operations for .smartText files using DocumentTreeAccess plugin
 */
import { Capacitor } from '@capacitor/core';
import { DocumentTreeAccess } from 'capacitor-document-tree-access';
import { Share } from '@capacitor/share';

export class FileService {
	constructor() {
		this.fileData = null;
		this.isNative = Capacitor.isNativePlatform();
		this.platform = Capacitor.getPlatform();
		this.folderSelected = false;
		
	}

	/**
	 * Select a folder for file operations
	 * @returns {Promise<boolean>} Success status
	 */
	async selectFolder() {
		try {
			const result = await DocumentTreeAccess.pickFolder();
			this.folderSelected = true;
			return true;
		} catch (error) {
			if (error.message && error.message.includes('cancelled')) {
				return false;
			}
			console.error('Error selecting folder:', error);
			throw error;
		}
	}

	/**
	 * Check if a folder is already selected
	 * @returns {Promise<boolean>} True if folder is selected
	 */
	async hasSelectedFolder() {
		try {
			const result = await DocumentTreeAccess.getPersistedUri();
			this.folderSelected = result.uri !== null;
			return this.folderSelected;
		} catch (error) {
			console.error('Error checking folder status:', error);
			return false;
		}
	}

	/**
	 * Open file by reading from selected folder
	 * @param {string} fileName - Name of file to open
	 * @returns {Promise<File>} Selected file
	 */
	async openFile(fileName) {
		try {
			// Ensure folder is selected
			if (!this.folderSelected) {
				const hasFolder = await this.hasSelectedFolder();
				if (!hasFolder) {
					throw new Error('No folder selected. Please select a folder first.');
				}
			}

			// Read file from selected folder
			const result = await DocumentTreeAccess.readFile({ name: fileName });
			const fileData = new TextEncoder().encode(result.data);
			this.fileData = new File([fileData], fileName, { type: 'application/octet-stream' });

			return this.fileData;
		} catch (error) {
			console.error('Error opening file:', error);
			throw error;
		}
	}

	/**
	 * Create new .smartText file
	 * @param {string} fileName - Name of file to create
	 * @returns {Promise<boolean>} Success status
	 */
	async createFile(fileName = 'reader.smartText') {
		try {
			// Ensure folder is selected
			if (!this.folderSelected) {
				const hasFolder = await this.hasSelectedFolder();
				if (!hasFolder) {
					throw new Error('No folder selected. Please select a folder first.');
				}
			}

			// Create empty file in selected folder
			await DocumentTreeAccess.writeFile({ name: fileName, data: '' });
			this.fileData = new File([''], fileName, { type: 'application/octet-stream' });
			
			return true;
		} catch (error) {
			console.error('Error creating file:', error);
			throw error;
		}
	}

	/**
	 * List files in the selected folder
	 * @returns {Promise<Array>} Array of file objects
	 */
	async listFiles() {
		try {
			// Ensure folder is selected
			if (!this.folderSelected) {
				const hasFolder = await this.hasSelectedFolder();
				if (!hasFolder) {
					throw new Error('No folder selected. Please select a folder first.');
				}
			}

			const result = await DocumentTreeAccess.listFiles();
			return result.files;
		} catch (error) {
			console.error('Error listing files:', error);
			throw error;
		}
	}

	/**
	 * Save data to a file
	 * @param {ArrayBuffer} data - Data to save
	 * @param {string} fileName - Name of file to save
	 * @returns {Promise<void>}
	 */
	async saveFile(data, fileName) {
		try {
			// Ensure folder is selected
			if (!this.folderSelected) {
				const hasFolder = await this.hasSelectedFolder();
				if (!hasFolder) {
					throw new Error('No folder selected. Please select a folder first.');
				}
			}

			// Convert ArrayBuffer to string for the plugin
			const uint8Array = new Uint8Array(data);
			const dataString = new TextDecoder().decode(uint8Array);

			// Write file to selected folder
			await DocumentTreeAccess.writeFile({ name: fileName, data: dataString });
			
			// Update file data
			this.fileData = new File([data], fileName, { type: 'application/octet-stream' });
		} catch (error) {
			console.error('Error saving file:', error);
			throw error;
		}
	}

	/**
	 * Save data to a file (creates new file if none exists)
	 * @param {ArrayBuffer} data - Data to save
	 * @param {string} suggestedName - Suggested filename
	 * @param {PersistenceService} persistenceService - Not used, kept for compatibility
	 * @returns {Promise<void>}
	 */
	async saveFileAs(data, suggestedName = 'database.smartText', persistenceService = null) {
		try {
			const fileName = suggestedName || `reader_${Date.now()}.smartText`;
			
			// Use the unified saveFile method
			await this.saveFile(data, fileName);
			
		} catch (error) {
			console.error('Error saving file as:', error);
			throw error;
		}
	}

	/**
	 * Delete a file from the selected folder
	 * @param {string} fileName - Name of file to delete
	 * @returns {Promise<void>}
	 */
	async deleteFile(fileName) {
		try {
			// Ensure folder is selected
			if (!this.folderSelected) {
				const hasFolder = await this.hasSelectedFolder();
				if (!hasFolder) {
					throw new Error('No folder selected. Please select a folder first.');
				}
			}

			await DocumentTreeAccess.deleteFile({ name: fileName });
		} catch (error) {
			console.error('Error deleting file:', error);
			throw error;
		}
	}


	/**
	 * Get current file data
	 * @returns {File|null}
	 */
	getFileData() {
		return this.fileData;
	}

	/**
	 * Update file data after saving
	 * @param {ArrayBuffer} data - New file data
	 * @param {string} fileName - Name of the file
	 */
	updateFileData(data, fileName) {
		this.fileData = new File([data], fileName, {
			type: 'application/octet-stream',
		});
	}

	/**
	 * Set file data (used after creation)
	 * @param {File} file - File data
	 */
	setFile(file) {
		this.fileData = file;
	}

	/**
	 * Check if file operations are supported on current platform
	 * @returns {boolean}
	 */
	isSupported() {
		// DocumentTreeAccess plugin works on Android and Web
		return this.platform === 'android' || this.platform === 'web';
	}

}
