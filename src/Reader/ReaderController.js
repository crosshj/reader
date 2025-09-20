import {
	dispatchEvent,
	addEventListener,
	setupEventUtilities,
	isMobile,
} from '../_lib/utils.js';
import { Reader } from './Reader.js';

export class ReaderController {
	constructor() {
		this.ui = new Reader(this);
		this.selectedRowId = null;
		setupEventUtilities(this.ui);
		this.setupEventListeners();
	}

	setupEventListeners() {
		addEventListener('reader:ready', () => this.handleReaderReady());

		const uiClickHandlers = {
			'#hamburger-menu': () => this.ui.menu.toggleHamburgerMenu(),
			'#hamburger-menu-desktop': () => this.ui.menu.toggleHamburgerMenu(),
			'#menu-open-file': this.handleMenuOpenFile,
			'#menu-create-file': this.handleMenuCreateFile,
			'#close-files-pane': () => this.ui.showReaderPane(),
			'#select-folder-btn': () => dispatchEvent('ui:selectFolder'),
			'#select-new-folder-btn': () => dispatchEvent('ui:selectFolder'),
			'#change-folder-btn': () => dispatchEvent('ui:selectFolder'),
			'#retry-files-btn': () => this.handleRetryFiles(),
			'#create-file-btn': () => dispatchEvent('ui:createFile'),
			'#open-file-btn': () => dispatchEvent('ui:openFile'),
			'#menu-edit-metadata': () => this.ui.metadataModal.show(false),
			'#menu-execute-query': () => this.ui.showQueryModal(),
			'#add-item-btn': () => this.ui.showAddForm(),
			'#add-item-btn-mobile': () => this.ui.showAddForm(),
			'.edit-btn': (e) => this.ui.showEditForm(e.target.dataset.id),
			'.delete-btn': (e) =>
				this.ui.handleDeleteClick(e.target.dataset.id),
			'#bulk-upsert-btn': () => this.ui.showBulkUpsertModal(),
			'#selected-edit-btn': () => this.ui.showSelectedEditModal(),
			'#selected-edit-btn-mobile': () => this.ui.showSelectedEditModal(),
			'.filter-icon-btn': (e) =>
				this.ui.header.toggleFilterDropdown(e.target.dataset.field),
			'#close-selected-edit-modal, #cancel-selected-edit': () =>
				this.ui.hideSelectedEditModal(),
			'#close-metadata-modal, #cancel-metadata': () =>
				this.ui.metadataModal.hide(),
			'#close-bulk-upsert-modal, #cancel-bulk-upsert': () =>
				this.ui.hideBulkUpsertModal(),
			'#close-query-modal, #cancel-query': () =>
				this.ui.hideQueryModal(),
			'#error-close-btn': () => this.ui.hideError(),
			'#error-dismiss-btn': () => this.ui.hideError(),
			'#execute-query': () => this.handleExecuteQuery(this.ui),
			'#select-folder-btn': () => dispatchEvent('ui:selectFolder'),
			'#open-file-btn': () => dispatchEvent('ui:openFile'),
			'#create-file-btn': () => dispatchEvent('ui:createFile'),
			'.file-item': (e) => this.handleFileItemClick(e),
			'.sidebar-overlay': () => this.ui.menu.hideHamburgerMenu(),
			'.grid-row': (e) => {
				if (e.target.matches('.action-btn')) return;
				// Only handle actual user clicks, not programmatic events
				if (!e.isTrusted) return;
				const row = e.target.closest('.grid-row');
				if (row) {
					const rowId = row.dataset.rowId;
					if (this.selectedRowId === rowId) {
						// If already selected, deselect it
						this.deselectRow();
					} else {
						// Otherwise, select it
						this.selectRow(rowId);
					}
				}
			},
		};
		this.ui.bind('click', uiClickHandlers);

		this.ui.bind('submit', {
			'#selected-edit-form': (e) => {
				e.preventDefault();
				this.ui.handleSelectedEditFormSubmit(e.target);
			},
			'#metadata-form': (e) => {
				e.preventDefault();
				this.ui.metadataModal.submit();
			},
		});

		addEventListener('app:state', (e) => {
			const { state, data, error, message } = e.detail;

			switch (state) {
				case 'splash':
					this.ui.showContent();
					break;
				case 'loading':
					this.ui.showLoadingState(message || 'Loading...');
					break;
				case 'fileError':
					// Handle file errors by showing noFile state
					this.ui.showSelectFile(data?.files || [], data?.folderName || '', data?.currentFileName || '');
					break;
				case 'noFolder':
					this.ui.showSelectFolder();
					break;
				case 'noFile':
					// Clear loading state first
					dispatchEvent('app:state', { state: 'loading', message: '' });
					this.ui.showSelectFile(data?.files || [], data?.folderName || '', data?.currentFileName || '');
					break;
				default:
					console.warn('Unknown app state:', state);
			}
		});


		addEventListener('db:state', (e) => {
			const { action, state, metadata, message, error } = e.detail;

			if (error) {
				this.ui.showDatabaseError(error);
			} else {
				// Clear loading state when database is successfully loaded
				if (action === 'loaded' || action === 'file_opened' || action === 'file_created') {
					dispatchEvent('app:state', { state: 'loading', message: '' });
				}
				this.ui.showDatabaseState({ action, state, metadata, message });
			}
		});

		addEventListener('ui:showMetadataEdit', (e) => {
			const isNewFile = e.detail?.isNewFile || false;
			this.ui.metadataModal.show(isNewFile);
		});
	}

	// Controller methods for UI to call
	dispatchInsertData(data) {
		dispatchEvent('ui:insertData', { data });
	}

	dispatchUpdateData(data, itemId) {
		dispatchEvent('ui:updateData', {
			data,
			whereClause: `id = ${itemId}`,
		});
	}

	dispatchDeleteData(itemId) {
		dispatchEvent('ui:deleteData', {
			tableName: 'items',
			whereClause: `id = ${itemId}`,
		});
	}

	dispatchUpdateMetadata(metadata) {
		dispatchEvent('ui:updateMetadata', { metadata });
	}

	dispatchCreateNewFile(metadata) {
		dispatchEvent('ui:createNewFile', { metadata });
	}

	dispatchBulkUpsert(items) {
		dispatchEvent('ui:bulkUpsert', {
			items: items,
			tableName: 'items',
		});
	}

	selectRow(rowId) {
		// Set new selection
		this.selectedRowId = rowId;
		this.ui.selectRow(rowId);

		// On mobile, show edit modal immediately when row is selected
		if (isMobile() && this.ui.currentSchema?.controls?.includes('selected-edit')) {
			this.ui.showSelectedEditModal(rowId);
		}

		// Fire selection event
		dispatchEvent('reader:itemSelected', {
			itemId: rowId,
			item: this.ui.list.getItemById(rowId),
		});
	}

	deselectRow() {
		// Clear selection
		this.selectedRowId = null;
		this.ui.clearRowSelection();
	}

	// Menu handlers that coordinate UI + events
	handleMenuOpenFile = () => {
		this.ui.menu.hideHamburgerMenu();
		dispatchEvent('ui:getFiles');
	};

	handleMenuCreateFile = () => {
		this.ui.menu.hideHamburgerMenu();
		dispatchEvent('ui:createFile');
	};


	/**
	 * Handle execute query button click
	 */
	handleExecuteQuery(ui) {
		const textarea = ui.container.querySelector('#query-textarea');
		const query = textarea?.value?.trim();
		
		if (!query) {
			alert('Please enter a query');
			return;
		}
		
		// Dispatch event with query string
		dispatchEvent('ui:executeQuery', { query });
		
		// Hide modal
		ui.hideQueryModal();
	}

	/**
	 * Handle file item click in SelectFile component
	 */
	handleFileItemClick(e) {
		const fileItem = e.target.closest('.file-item');
		if (!fileItem) return;

		// Check if it's the change folder item
		if (fileItem.classList.contains('change-folder-item')) {
			dispatchEvent('ui:selectFolder');
			return;
		}

		// Check if it's the create file item
		if (fileItem.classList.contains('create-file-item')) {
			dispatchEvent('ui:createFile');
			return;
		}

		// Get the file name from data attribute
		const fileName = fileItem.dataset.fileName;
		if (!fileName) return;

		// Dispatch event to open the file
		dispatchEvent('ui:openFileFromFolder', { fileName });
	}

	/**
	 * Handle reader ready event - let ApplicationController handle initial state
	 */
	handleReaderReady() {
		// The ApplicationController will handle the initial state through app:state events
		// No need to call showContent() here as it bypasses the proper state flow
	}


	async handleRetryFiles() {
		// Retry getting files from current folder
		try {
			const filesResult = await this.ui.folderService.getFiles();
			const folderName = await this.ui.folderService.getFolderName();
			
			// Extract files array from the result object
			const files = filesResult.files || [];
			
			dispatchEvent('app:state', { 
				state: 'noFile',
				data: { files: files, folderName: folderName || '', currentFileName: '' }
			});
		} catch (error) {
			// If we can't get files, still show noFile state but without files
			dispatchEvent('app:state', { 
				state: 'noFile',
				data: { files: [], folderName: '', currentFileName: '' }
			});
		}
	}

}
