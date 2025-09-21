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
			'#menu-execute-query': () => this.ui.queryModal.show(),
			'#add-item-btn': () => this.ui.rowModal.show(null),
			'#add-item-btn-mobile': () => this.ui.rowModal.show(null),
			'.edit-icon': (e) => this.ui.rowModal.show(e.target.dataset.id),
			'.delete-icon': (e) =>
				this.ui.handleDeleteClick(e.target.dataset.id),
			'#bulk-upsert-btn': () => this.ui.bulkUpsertModal.show(),
			'#selected-edit-btn': () => this.ui.rowModal.show(),
			'#selected-edit-btn-mobile': () => this.ui.rowModal.show(),
			'.filter-icon-btn': (e) =>
				this.ui.header.toggleFilterDropdown(e.target.dataset.field),
			'#close-selected-edit-modal, #cancel-selected-edit': () =>
				this.ui.rowModal.hide(),
			'#close-metadata-modal, #cancel-metadata': () =>
				this.ui.metadataModal.hide(),
			'#close-bulk-upsert-modal, #cancel-bulk-upsert': () =>
				this.ui.bulkUpsertModal.hide(),
			'#close-query-modal, #cancel-query': () =>
				this.ui.queryModal.hide(),
			'#error-close-btn': () => this.ui.hideError(),
			'#error-dismiss-btn': () => this.ui.hideError(),
			'#execute-query': () => this.handleExecuteQuery(this.ui),
			'#select-folder-btn': () => dispatchEvent('ui:selectFolder'),
			'#open-file-btn': () => dispatchEvent('ui:openFile'),
			'#create-file-btn': () => dispatchEvent('ui:createFile'),
			'.file-item': (e) => this.handleFileItemClick(e),
			'.sidebar-overlay': () => this.ui.menu.hideHamburgerMenu(),
			'.grid-row': (e) => {
				if (e.target.matches('.action-icon')) return;
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
				this.ui.rowModal.handleFormSubmit(e.target);
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
            console.log('db:state', e.detail);
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

		// Add keyboard navigation for row selection
		document.addEventListener('keydown', (e) => {
			this.handleKeyboardNavigation(e);
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
		this.ui.dataView.selectRow(rowId);

		// On mobile, show edit modal immediately when row is selected
		if (isMobile() && this.ui.currentSchema?.controls?.includes('selected-edit')) {
			this.ui.rowModal.show(rowId);
		}

		// Fire selection event
		dispatchEvent('reader:itemSelected', {
			itemId: rowId,
			item: this.ui.dataView.getItemById(rowId),
		});
	}

	deselectRow() {
		// Clear selection
		this.selectedRowId = null;
		this.ui.dataView.clearRowSelection();
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
		const formField = ui.container.querySelector('form-field');
		const textarea = formField?.querySelector('textarea');
		const query = textarea?.value?.trim();
		
		if (!query) {
			alert('Please enter a query');
			return;
		}
		
		// Dispatch event with query string
		dispatchEvent('ui:executeQuery', { query });
		
		// Hide modal
		ui.queryModal.hide();
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

	/**
	 * Handle keyboard navigation for row selection
	 */
	handleKeyboardNavigation(e) {
		// Only handle arrow keys when a row is selected and no modal is open
		if (!this.selectedRowId || this.isModalOpen()) {
			return;
		}

		// Only handle up/down arrow keys
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
			return;
		}

		// Prevent default scrolling behavior
		e.preventDefault();

		// Get all visible rows
		const rows = this.ui.dataView.getVisibleRows();
		if (!rows || rows.length === 0) {
			return;
		}

		// Find current row index
		const currentIndex = rows.findIndex(row => row.dataset.rowId === this.selectedRowId);
		if (currentIndex === -1) {
			return;
		}

		let newIndex;
		if (e.key === 'ArrowUp') {
			newIndex = currentIndex - 1;
		} else { // ArrowDown
			newIndex = currentIndex + 1;
		}

		// Check bounds
		if (newIndex >= 0 && newIndex < rows.length) {
			const newRowId = rows[newIndex].dataset.rowId;
			this.selectRow(newRowId);
		}
	}

	/**
	 * Check if any modal is currently open
	 */
	isModalOpen() {
		return this.ui.container.querySelector('.query-modal-overlay') ||
			   this.ui.container.querySelector('.row-modal-overlay') ||
			   this.ui.container.querySelector('.metadata-modal-overlay') ||
			   this.ui.container.querySelector('.bulk-upsert-modal-overlay') ||
			   this.ui.container.querySelector('.error-modal-overlay');
	}

}
