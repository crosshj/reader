/**
 * File Service
 * Handles file operations for .smartText files on both web and mobile platforms
 */
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export class FileService {
	constructor() {
		this.fileHandle = null;
		this.fileData = null;
		this.mobileFilePath = null;
		this.isNative = Capacitor.isNativePlatform();
		this.platform = Capacitor.getPlatform();
	}

	/**
	 * Open file picker to select .smartText file
	 * @returns {Promise<File>} Selected file
	 */
	async openFile() {
		try {
			// Check if File System Access API is supported
			if (!('showOpenFilePicker' in window)) {
				throw new Error('File System Access API not supported');
			}

			// Show file picker for .smartText files
			const [fileHandle] = await window.showOpenFilePicker({
				types: [
					{
						description: 'Reader Database files',
						accept: {
							'application/octet-stream': ['.smartText'],
						},
					},
				],
				excludeAcceptAllOption: true,
			});

			this.fileHandle = fileHandle;
			const file = await fileHandle.getFile();
			this.fileData = file;

			return file;
		} catch (error) {
			if (error.name === 'AbortError') {
				return null;
			}
			console.error('Error opening file:', error);
			throw error;
		}
	}

	/**
	 * Create new .smartText file
	 * @returns {Promise<boolean>} Success status
	 */
	async createFile() {
		try {
			if (this.isNative) {
				// Mobile: Use Capacitor Filesystem API
				return await this.createFileMobile();
			} else {
				// Web: Use File System Access API
				return await this.createFileWeb();
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('File creation cancelled');
				return false;
			}
			console.error('Error creating file:', error);
			throw error;
		}
	}

	/**
	 * Create file on mobile using Capacitor Filesystem
	 * @returns {Promise<boolean>} Success status
	 */
	async createFileMobile() {
		const fileName = `reader_${Date.now()}.smartText`;
		const filePath = `Documents/${fileName}`;
		
		// Create empty file
		await Filesystem.writeFile({
			path: filePath,
			data: '',
			directory: Directory.Documents,
			encoding: Encoding.UTF8
		});

		// Store file path for mobile
		this.mobileFilePath = filePath;
		this.fileData = new File([''], fileName, { type: 'application/octet-stream' });
		
		return true;
	}

	/**
	 * Create file on web using File System Access API
	 * @returns {Promise<boolean>} Success status
	 */
	async createFileWeb() {
		// Check if File System Access API is supported
		if (!('showSaveFilePicker' in window)) {
			throw new Error('File System Access API not supported');
		}

		// Show save file picker for .smartText files
		const fileHandle = await window.showSaveFilePicker({
			types: [
				{
					description: 'Reader Database files',
					accept: {
						'application/octet-stream': ['.smartText'],
					},
				},
			],
			suggestedName: 'eg.smartText',
		});

		this.fileHandle = fileHandle;
		this.fileData = new File([''], fileHandle.name, { type: 'application/octet-stream' });
		
		return true;
	}

	/**
	 * Save data to the current file
	 * @param {ArrayBuffer} data - Data to save
	 * @returns {Promise<void>}
	 */
	async saveFile(data) {
		try {
			if (this.isNative) {
				// Mobile: Use Capacitor Filesystem API
				await this.saveFileMobile(data);
			} else {
				// Web: Use File System Access API
				await this.saveFileWeb(data);
			}
		} catch (error) {
			console.error('Error saving file:', error);
			throw error;
		}
	}

	/**
	 * Save data to a file (creates new file if none exists)
	 * Uses Android share intent on mobile, web download on web
	 * @param {ArrayBuffer} data - Data to save
	 * @param {string} suggestedName - Suggested filename
	 * @param {PersistenceService} persistenceService - Not used, kept for compatibility
	 * @returns {Promise<void>}
	 */
	async saveFileAs(data, suggestedName = 'database.smartText', persistenceService = null) {
		try {
			const fileName = suggestedName || `reader_${Date.now()}.smartText`;
			
			if (this.isNative && this.platform === 'android') {
				// Use Android share intent for mobile
				await this.saveFileAsMobileShare(data, fileName);
			} else {
				// Use web download approach for web
				await this.saveFileAsWeb(data, fileName);
			}
			
			// Update the file service
			this.fileData = new File([data], fileName, { type: 'application/octet-stream' });
			
		} catch (error) {
			console.error('Error saving file as:', error);
			throw error;
		}
	}

	/**
	 * Save file on mobile using Capacitor Filesystem
	 * @param {ArrayBuffer} data - Data to save
	 * @returns {Promise<void>}
	 */
	async saveFileMobile(data) {
		if (!this.mobileFilePath) {
			throw new Error('No file path available for mobile save');
		}

		// Convert ArrayBuffer to base64 for Capacitor Filesystem
		const uint8Array = new Uint8Array(data);
		const base64Data = btoa(String.fromCharCode(...uint8Array));

		await Filesystem.writeFile({
			path: this.mobileFilePath,
			data: base64Data,
			directory: Directory.Documents,
			encoding: Encoding.UTF8
		});
	}

	/**
	 * Save file on web using File System Access API
	 * @param {ArrayBuffer} data - Data to save
	 * @returns {Promise<void>}
	 */
	async saveFileWeb(data) {
		if (!this.fileHandle) {
			throw new Error('No file handle available');
		}

		const writable = await this.fileHandle.createWritable();
		await writable.write(data);
		await writable.close();
	}

	/**
	 * Save file as on mobile using Android share intent
	 * @param {ArrayBuffer} data - Data to save
	 * @param {string} fileName - Filename
	 * @returns {Promise<void>}
	 */
	async saveFileAsMobileShare(data, fileName) {
		let tempFilePath = null;
		
		try {
			// Create a temporary file with the actual filename
			tempFilePath = fileName;
			
			// Convert ArrayBuffer to base64 for file creation
			const uint8Array = new Uint8Array(data);
			const base64Data = btoa(String.fromCharCode(...uint8Array));

			// Write temporary file
			await Filesystem.writeFile({
				path: tempFilePath,
				data: base64Data,
				directory: Directory.Cache,
				encoding: Encoding.UTF8
			});

			// Get the file URI
			const fileUri = await Filesystem.getUri({
				directory: Directory.Cache,
				path: tempFilePath
			});

			// Use Capacitor Share plugin to trigger Android share intent
			const shareOptions = {
				title: `Share ${fileName}`,
				text: `Sharing ${fileName}`,
				url: fileUri.uri,
				dialogTitle: `Share ${fileName}`
			};
			
			const result = await Share.share(shareOptions);
			
			// Clean up temporary file after sharing (regardless of success/failure)
			// The result.action can be 'shared', 'dismissed', or 'cancelled'
			// We clean up in all cases since the user has either shared or decided not to
			await this.cleanupTempFile(tempFilePath);
			
		} catch (error) {
			// Clean up temp file if it was created
			if (tempFilePath) {
				await this.cleanupTempFile(tempFilePath);
			}
			
			console.error('Error sharing file via Android share intent:', error);
			// Fallback to download if sharing fails
			await this.saveFileAsWeb(data, fileName);
		}
	}

	/**
	 * Clean up temporary file
	 * @param {string} tempFilePath - Path to temporary file
	 */
	async cleanupTempFile(tempFilePath) {
		try {
			await Filesystem.deleteFile({
				directory: Directory.Cache,
				path: tempFilePath
			});
		} catch (cleanupError) {
			console.warn('Failed to clean up temporary file:', cleanupError);
		}
	}

	/**
	 * Save file as on mobile using simple web download approach (fallback)
	 * @param {ArrayBuffer} data - Data to save
	 * @param {string} suggestedName - Suggested filename
	 * @param {PersistenceService} persistenceService - Persistence service for mobile parent directory
	 * @returns {Promise<void>}
	 */
	async saveFileAsMobile(data, suggestedName, persistenceService) {
		alert(`DEBUG: saveFileAsMobile called with suggestedName: ${suggestedName}`);
		const fileName = suggestedName || `reader_${Date.now()}.smartText`;
		alert(`DEBUG: Generated fileName: ${fileName}`);
		
		// Use the simple web download approach - create blob and trigger download
		alert('DEBUG: Using simple web download approach');
		try {
			// Create a blob from the data
			const blob = new Blob([data], { type: 'application/octet-stream' });
			const url = URL.createObjectURL(blob);
			
			// Create a temporary anchor element to trigger download
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			link.style.display = 'none';
			
			// Add to DOM, click, and remove
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Clean up the blob URL
			URL.revokeObjectURL(url);
			
			alert(`DEBUG: Download triggered for ${fileName}`);
			
		} catch (error) {
			alert(`DEBUG: Error in saveFileAsMobile: ${error.message}`);
			throw error;
		}

		// Update the file service
		this.fileData = new File([data], fileName, { type: 'application/octet-stream' });
		alert(`DEBUG: Updated fileData with new file`);
	}


	/**
	 * Save file to Downloads directory (fallback)
	 * @param {ArrayBuffer} data - Data to save
	 * @param {string} fileName - Filename
	 * @param {string} base64Data - Base64 encoded data
	 * @returns {Promise<void>}
	 */
	async saveToDownloads(data, fileName, base64Data) {
		try {
			await Filesystem.writeFile({
				path: fileName,
				data: base64Data,
				directory: Directory.ExternalStorage,
				encoding: Encoding.UTF8
			});
			alert('DEBUG: Successfully saved to Downloads directory');
			this.mobileFilePath = fileName;
		} catch (error) {
			alert(`DEBUG: Downloads directory failed: ${error.message}`);
			// Final fallback to Data directory
			alert('DEBUG: Final fallback to Data directory');
			await Filesystem.writeFile({
				path: fileName,
				data: base64Data,
				directory: Directory.Data,
				encoding: Encoding.UTF8
			});
			alert('DEBUG: Successfully saved to Data directory');
			this.mobileFilePath = fileName;
		}
	}

	/**
	 * Save file as on web using web download approach
	 * @param {ArrayBuffer} data - Data to save
	 * @param {string} fileName - Filename
	 * @returns {Promise<void>}
	 */
	async saveFileAsWeb(data, fileName) {
		try {
			// Create a blob from the data
			const blob = new Blob([data], { type: 'application/octet-stream' });
			const url = URL.createObjectURL(blob);
			
			// Create a temporary anchor element to trigger download
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			link.style.display = 'none';
			
			// Add to DOM, click, and remove - all in one synchronous operation
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Clean up the blob URL after a short delay to ensure download starts
			setTimeout(() => {
				URL.revokeObjectURL(url);
			}, 100);
		} catch (error) {
			console.error('Error downloading file:', error);
			throw error;
		}
	}

	/**
	 * Get current file handle (web only)
	 * @returns {FileSystemFileHandle|null}
	 */
	getFileHandle() {
		return this.fileHandle;
	}

	/**
	 * Get current file data
	 * @returns {File|null}
	 */
	getFileData() {
		return this.fileData;
	}

	/**
	 * Get current file path (mobile only)
	 * @returns {string|null}
	 */
	getFilePath() {
		return this.mobileFilePath;
	}



	/**
	 * Update file data after saving
	 * @param {ArrayBuffer} data - New file data
	 */
	updateFileData(data) {
		if (this.isNative && this.mobileFilePath) {
			// Mobile: Update file data with new content
			const fileName = this.mobileFilePath.split('/').pop();
			this.fileData = new File([data], fileName, {
				type: 'application/octet-stream',
			});
		} else if (this.fileHandle) {
			// Web: Create a new File object with the updated data
			this.fileData = new File([data], this.fileHandle.name, {
				type: 'application/octet-stream',
			});
		}
	}

	/**
	 * Set file handle and data (used after creation)
	 * @param {FileSystemFileHandle|string} fileHandle - File handle (web) or file path (mobile)
	 * @param {File} file - File data
	 */
	setFile(fileHandle, file) {
		if (this.isNative) {
			// Mobile: Store file path
			this.mobileFilePath = fileHandle;
		} else {
			// Web: Store file handle
			this.fileHandle = fileHandle;
		}
		this.fileData = file;
	}

	/**
	 * Check if file operations are supported on current platform
	 * @returns {boolean}
	 */
	isSupported() {
		if (this.isNative) {
			// Mobile: Always supported with Capacitor Filesystem
			return true;
		} else {
			// Web: Check File System Access API support
			return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
		}
	}

}
