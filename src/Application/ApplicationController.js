import { dispatchEvent, addEventListener } from '../_lib/utils.js';
import { FileService } from '../_lib/fileService.js';
import { DatabaseService } from '../_lib/databaseService.js';
import { CapacitorService } from '../_lib/capacitorService.js';
import { getHandlers as getFileHandlers } from './handlersFiles.js';
import { getHandlers as getDatabaseHandlers } from './handlersDatabase.js';

export class ApplicationController {
	constructor() {
		this.fileService = new FileService();
		this.databaseService = new DatabaseService();
		this.capacitorService = new CapacitorService();
		this.fileHandlers = getFileHandlers(this);
		this.databaseHandlers = getDatabaseHandlers(this);
		this.setupEventListeners();
	}

	setupEventListeners() {
		addEventListener('app:init', this.onAppInit.bind(this));

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
			'ui:bulkUpsert',
			this.databaseHandlers.handleBulkUpsert
		);
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
}
