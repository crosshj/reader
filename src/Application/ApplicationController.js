import { dispatchEvent, addEventListener } from '../_lib/utils.js';
import { FileService } from '../_lib/fileService.js';
import { DatabaseService } from '../_lib/databaseService.js';
import { CapacitorService } from '../_lib/capacitorService.js';
import { PersistenceService } from '../_lib/persistenceService.js';
import { getHandlers as getFileHandlers } from './handlersFiles.js';
import { getHandlers as getDatabaseHandlers } from './handlersDatabase.js';

export class ApplicationController {
	constructor() {
		this.fileService = new FileService();
		this.databaseService = new DatabaseService();
		this.capacitorService = new CapacitorService();
		this.persistenceService = new PersistenceService(this.databaseService);
		this.fileHandlers = getFileHandlers(this);
		this.databaseHandlers = getDatabaseHandlers(this);
		this.currentState = null;
		this.currentSchema = null;
		this.setupEventListeners();
	}

	setupEventListeners() {
		addEventListener('app:init', this.onAppInit.bind(this));
		addEventListener('reader:ready', this.onReaderReady.bind(this));

		// File operation event handlers
		addEventListener('ui:openFile', this.fileHandlers.handleOpenFile);
		addEventListener('ui:createFile', this.fileHandlers.handleCreateFile);
		addEventListener('ui:saveFile', this.fileHandlers.handleSaveFile);
		addEventListener('ui:closeFile', this.handleCloseFile.bind(this));

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
			'ui:bulkUpsert',
			this.databaseHandlers.handleBulkUpsert
		);
		addEventListener(
			'ui:executeQuery',
			this.databaseHandlers.handleExecuteQuery
		);

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
	 * Handle close file request
	 */
	async handleCloseFile() {
		const result = await this.persistenceService.closeFile();
		if (result && result.showSplash) {
			// Dispatch event to show splash screen
			dispatchEvent('ui:showSplash');
		} else if (result && result.needsSave) {
			// Dispatch event to save file first
			dispatchEvent('ui:saveFile');
		}
	}

	/**
	 * Handle reader ready event - restore file after UI is ready
	 */
	async onReaderReady() {
		await this.tryRestoreLastFile();
	}

	/**
	 * Try to restore the last opened file
	 */
	async tryRestoreLastFile() {
		// Try to restore from app storage first (works on all platforms)
		const restored = await this.persistenceService.restoreFile();
		if (restored && restored.success) {
			// Handle the restored file using the file handler
			await this.fileHandlers.handleOpenFile({ detail: { file: restored.file } });
			return;
		}

		// Fallback to web file handle restoration (web only)
		const platform = this.capacitorService.getPlatform();
		
		if (platform !== 'web') {
			return;
		}

		try {
			const serialized = localStorage.getItem('lastFileHandle');
			if (!serialized) {
				return;
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
		} catch (error) {
			// Clear invalid handle
			localStorage.removeItem('lastFileHandle');
		}
	}
}
