import { dispatchEvent, addEventListener } from '../_lib/utils.js';
import { FileService } from '../_lib/fileService.js';
import { DatabaseService } from '../_lib/databaseService.js';
import { CapacitorService } from '../_lib/capacitorService.js';
import { PersistenceService } from '../_lib/persistenceService.js';
import { FolderService } from '../_lib/folderService.js';
import { getHandlers as getFileHandlers } from './handlersFiles.js';
import { getHandlers as getDatabaseHandlers } from './handlersDatabase.js';

export class ApplicationController {
	constructor() {
		this.fileService = new FileService();
		this.databaseService = new DatabaseService();
		this.capacitorService = new CapacitorService();
		this.persistenceService = new PersistenceService(this.databaseService);
		this.folderService = new FolderService();
		this.fileHandlers = getFileHandlers(this);
		this.databaseHandlers = getDatabaseHandlers(this);
		this.currentState = null;
		this.currentSchema = null;
		this.currentFileName = null;
		this.isNewFile = false;
		this.setupEventListeners();
	}

	setupEventListeners() {
		addEventListener('app:init', this.onAppInit.bind(this));
		addEventListener('reader:ready', this.onReaderReady.bind(this));

		// File operation event handlers
		addEventListener('ui:openFile', this.fileHandlers.handleOpenFile);
		addEventListener('ui:createFile', this.fileHandlers.handleCreateFile);

		// Database operation event handlers
		addEventListener(
			'ui:insertData',
			this.databaseHandlers.handleInsertData
		);
		addEventListener(
			'ui:updateData',
			this.databaseHandlers.handleUpdateData
		);
		addEventListener(
			'ui:deleteData',
			this.databaseHandlers.handleDeleteData
		);
		addEventListener(
			'ui:updateMetadata',
			this.databaseHandlers.handleUpdateMetadata
		);
		addEventListener(
			'ui:createNewFile',
			this.databaseHandlers.handleCreateNewFile
		);
		addEventListener(
			'ui:bulkUpsert',
			this.databaseHandlers.handleBulkUpsert
		);
		addEventListener(
			'ui:executeQuery',
			this.databaseHandlers.handleExecuteQuery
		);

		// Folder operation event handlers
		addEventListener('ui:selectFolder', this.handleSelectFolder.bind(this));
		addEventListener('ui:getFiles', this.handleGetFiles.bind(this));
		addEventListener('ui:openFileFromFolder', this.handleOpenFileFromFolder.bind(this));

		// Track database state for UI restoration
		addEventListener('db:state', (e) => {
			const { state, metadata } = e.detail;
			this.currentState = state;
			this.currentSchema = metadata?.schema;
		});
	}

	async onAppInit() {
		// Application-level initialization will go here

		// Initialize Capacitor UI components (status bar, safe areas, and platform class)
		await this.capacitorService.initializeUI();

		// Setup web fallback for file handling if not on native platform
		this.setupWebFileHandler();

		// Show content once styles are loaded
		document.body.classList.add('styles-loaded');

		// Setup database cleanup functions
		this.databaseService.setupCleanupFunctions(this.databaseHandlers);

		// Simulate some initialization work
		setTimeout(() => {
			dispatchEvent('reader:ready');
		}, 1000);
	}

	/**
	 * Setup web fallback for file handling
	 */
	setupWebFileHandler() {
		// Only setup web fallback if not on native platform
		if (this.capacitorService.isNativePlatform()) {
			return;
		}

		// Handle file opening from system (web fallback)
		window.handleFileOpen = async (file) => {
			try {
				// Dispatch file open event
				dispatchEvent('ui:openFile', { file });
			} catch (error) {
				console.error('Error handling file open:', error);
			}
		};
	}


	/**
	 * Handle reader ready event - restore file after UI is ready
	 */
	async onReaderReady() {
		// First try to restore a file
		const fileRestored = await this.tryRestoreLastFile();
		
		// If no file was restored, check folder state
		if (!fileRestored) {
			await this.checkFolderState();
		}
	}

	/**
	 * Check the current folder state and dispatch appropriate app state
	 */
	async checkFolderState() {
		try {
			alert('Checking folder state...');
			const result = await this.folderService.getFiles();
			alert(`Folder check result: ${result.error || 'success'}, files: ${result.files?.length || 0}`);
			
			if (result.error === 'no folder selected') {
				alert('No folder selected, showing folder picker');
				dispatchEvent('app:state', { state: 'noFolder' });
				return;
			} else if (result.error) {
				alert(`Folder error: ${result.error}`);
				dispatchEvent('app:state', { 
					state: 'fileError', 
					error: result.error,
					data: { action: 'checking folder' }
				});
				return;
			}

			// Folder exists, show file selection
			const files = result.files || [];
			const folderName = await this.folderService.getFolderName();
			alert(`Folder found: ${folderName}, files: ${files.length}`);
			dispatchEvent('app:state', { 
				state: 'noFile',
				data: { files: files, folderName: folderName }
			});
		} catch (error) {
			alert(`Folder check error: ${error.message}`);
			dispatchEvent('app:state', { 
				state: 'fileError', 
				error: error.message,
				data: { action: 'checking folder' }
			});
		}
	}

	/**
	 * Try to restore the last opened file
	 * @returns {Promise<boolean>} True if a file was restored, false otherwise
	 */
	async tryRestoreLastFile() {
		// Try to restore from app storage first (works on all platforms)
		const restored = await this.persistenceService.restoreFile();
		if (restored && restored.success) {
			// Handle the restored file using the file handler
			await this.fileHandlers.handleOpenFile({ detail: { file: restored.file } });
			return true;
		}

		// Fallback to web file handle restoration (web only)
		const platform = this.capacitorService.getPlatform();
		
		if (platform !== 'web') {
			return false;
		}

		try {
			const serialized = localStorage.getItem('lastFileHandle');
			if (!serialized) {
				return false;
			}

			const handleData = JSON.parse(serialized);
			const fileHandle = await window.showOpenFilePicker.restore(handleData);
			
			// Verify the handle is still valid
			const file = await fileHandle.getFile();
			
			// Set the file handle in the service
			this.fileService.fileHandle = fileHandle;
			this.fileService.fileData = file;
			
			
			// Dispatch file open event to load the file
			dispatchEvent('ui:openFile', { file });
			return true;
		} catch (error) {
			// Clear invalid handle
			localStorage.removeItem('lastFileHandle');
			return false;
		}
	}

	/**
	 * Handle folder selection
	 */
	async handleSelectFolder() {
		try {
			dispatchEvent('app:state', { state: 'loading', message: 'Loading folder...' });
			
			const result = await this.folderService.selectFolder();
			
			if (result.success) {
				// Folder selected successfully - now check for files and saved file
				await this.checkFolderState();
			} else {
				// Folder selection was canceled - go back to noFile state with current folder data
				try {
					const filesResult = await this.folderService.getFiles();
					const folderName = await this.folderService.getFolderName();
					
					// Extract files array from the result object
					const files = filesResult.files || [];
					
					dispatchEvent('app:state', {
						state: 'noFile',
						data: { files: files, folderName: folderName || '', currentFileName: this.currentFileName || '' }
					});
				} catch (error) {
					// If we can't get files, show noFile state without files
					dispatchEvent('app:state', {
						state: 'noFile',
						data: { files: [], folderName: '', currentFileName: this.currentFileName || '' }
					});
				}
			}
		} catch (error) {
			dispatchEvent('app:state', { 
				state: 'fileError', 
				error: error.message,
				data: { action: 'selecting folder' }
			});
		}
	}

	/**
	 * Handle getting files from selected folder
	 */
	async handleGetFiles() {
		try {
			dispatchEvent('app:state', { state: 'loading', message: 'Loading files...' });
			
			const result = await this.folderService.getFiles();
			
			if (result.error) {
				if (result.error === 'no folder selected') {
					dispatchEvent('app:state', { state: 'noFolder' });
				} else {
					dispatchEvent('app:state', { 
						state: 'fileError', 
						error: result.error,
						data: { action: 'loading files' }
					});
				}
		} else {
			const folderName = await this.folderService.getFolderName();
			dispatchEvent('app:state', { 
				state: 'noFile',
				data: { files: result.files, folderName: folderName, currentFileName: this.currentFileName || '' }
			});
		}
		} catch (error) {
			dispatchEvent('app:state', { 
				state: 'fileError', 
				error: error.message,
				data: { action: 'loading files' }
			});
		}
	}

	/**
	 * Handle opening a file from the folder (SelectFile component)
	 */
	async handleOpenFileFromFolder(event) {
		try {
			const { fileName } = event.detail;
			if (!fileName) {
				throw new Error('No file name provided');
			}

			dispatchEvent('app:state', { state: 'loading', message: 'Opening file...' });
			
		// Read the file from the folder
		alert(`Attempting to read file: ${fileName}`);
		const fileData = await this.folderService.readFile(fileName);
		alert(`File data received: ${typeof fileData}, isArrayBuffer: ${fileData instanceof ArrayBuffer}, isUint8Array: ${fileData instanceof Uint8Array}`);
		
		// Handle different data formats that the plugin might return
		let arrayBufferData;
		if (fileData instanceof ArrayBuffer) {
			arrayBufferData = fileData;
		} else if (fileData instanceof Uint8Array) {
			arrayBufferData = fileData.buffer;
		} else if (typeof fileData === 'string') {
			// If it's a base64 string, decode it
			try {
				const binaryString = atob(fileData);
				const bytes = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				arrayBufferData = bytes.buffer;
			} catch (base64Error) {
				// If base64 decoding fails, try treating it as raw binary data
				alert(`Base64 decode failed, trying raw binary. Error: ${base64Error.message}`);
				const bytes = new Uint8Array(fileData.length);
				for (let i = 0; i < fileData.length; i++) {
					bytes[i] = fileData.charCodeAt(i);
				}
				arrayBufferData = bytes.buffer;
			}
		} else {
			alert(`Unexpected file data format: ${typeof fileData}`);
			throw new Error(`Unexpected file data format: ${typeof fileData}`);
		}
		
		alert(`Converted to ArrayBuffer, size: ${arrayBufferData.byteLength} bytes`);
		
		// Create a file-like object that the file handler expects
		const file = {
			name: fileName,
			type: 'application/octet-stream',
			arrayBuffer: async () => arrayBufferData
		};
		
		// Load the file using the existing file handler
		await this.fileHandlers.handleOpenFile({ detail: { file } });
		} catch (error) {
			console.error('Error opening file from folder:', error);
			dispatchEvent('app:state', { 
				state: 'fileError', 
				error: error.message,
				data: { action: 'opening file' }
			});
		}
	}
}
