import {
	dispatchEvent,
	addEventListener,
	setupEventUtilities,
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
			'#menu-experiment': () => this.ui.showFilesPane(),
			'#close-files-pane': () => this.ui.showReaderPane(),
			'#select-folder-btn': () => this.ui.files.handleSelectFolder(),
			'#select-new-folder-btn': () => this.ui.files.handleSelectFolder(),
			'#retry-files-btn': () => this.ui.files.handleRetryFiles(),
			'#create-file-btn': () => this.ui.files.handleCreateFile(),
			'#open-file-btn': () => dispatchEvent('ui:openFile'),
			'#menu-edit-metadata': () => this.ui.modalMetadataEdit.show(),
			'#menu-save-file': this.handleMenuSaveFile,
			'#menu-close-file': this.handleMenuCloseFile,
			'#menu-execute-query': () => this.ui.showQueryModal(),
			'#add-item-btn': () => this.ui.showAddForm(),
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
				this.ui.modalMetadataEdit.hide(),
			'#close-bulk-upsert-modal, #cancel-bulk-upsert': () =>
				this.ui.hideBulkUpsertModal(),
			'#close-query-modal, #cancel-query': () =>
				this.ui.hideQueryModal(),
			'#execute-query': () => this.handleExecuteQuery(this.ui),
			'#retry-btn': () => this.ui.showContent(),
			'#retry-file-btn': () => this.ui.showContent(),
			'#back-to-splash-btn': () => this.ui.showContent(),
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
				this.ui.modalMetadataEdit.submit();
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
					this.ui.showFileError(error, data?.action);
					break;
				case 'noFolder':
					// Will be handled by new component
					break;
				case 'noFile':
					// Will be handled by new component
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
				this.ui.showDatabaseState({ action, state, metadata, message });
			}
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
		dispatchEvent('ui:openFile');
	};

	handleMenuCreateFile = () => {
		this.ui.menu.hideHamburgerMenu();
		dispatchEvent('ui:createFile');
	};

	handleMenuSaveFile = () => {
		this.ui.menu.hideHamburgerMenu();
		dispatchEvent('ui:saveFile');
	};

	handleMenuCloseFile = () => {
		this.ui.menu.hideHamburgerMenu();
		dispatchEvent('ui:closeFile');
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
	 * Handle reader ready event - check if there's a file to restore before showing splash
	 */
	handleReaderReady() {
		// Check if there's a persisted file to restore
		const hasPersistedFile = localStorage.getItem('persistedFileContent') && localStorage.getItem('persistedFileName');
		
		if (hasPersistedFile) {
			// Don't show splash screen - wait for file restoration
			// The ApplicationController will restore the file and trigger db:state event
		} else {
			this.ui.showContent();
		}
	}
}
