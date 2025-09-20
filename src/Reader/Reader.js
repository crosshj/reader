import { html } from '../_lib/utils.js';
import './Reader.css';
import { Header } from './components/Header.js';
import { Menu } from './components/Menu.js';
import { List } from './components/List.js';
import { MetadataModal } from './components/modal/Metadata.js';
import { DataView } from './components/DataView.js';
import { renderError } from './components/Error.js';
import { SelectFolder } from './components/SelectFolder.js';
import { SelectFile } from './components/SelectFile.js';
import { RowModal } from './components/modal/Row.js';
import { QueryModal } from './components/modal/Query.js';
import { BulkUpsertModal } from './components/modal/BulkUpsert.js';
import { ErrorModal } from './components/modal/Error.js';
import { FolderService } from '../_lib/folderService.js';

export class Reader {
	constructor(controller) {
		this.controller = controller;
		this.container = document.createElement('div');
		this.container.classList.add('reader-container');
		document.body.appendChild(this.container);
		this.currentState = null;
		this.currentSchema = null;

		this.header = new Header(this);
		this.menu = new Menu(this);
		this.list = new List(this);
		this.metadataModal = new MetadataModal(this);
		this.dataView = new DataView(this);
		this.selectFolder = new SelectFolder();
		this.selectFile = new SelectFile();
		this.rowModal = new RowModal(this);
		this.queryModal = new QueryModal(this);
		this.bulkUpsertModal = new BulkUpsertModal(this);
		this.errorModal = new ErrorModal(this);
		this.folderService = new FolderService();

		this.render();
	}

	render() {
		this.container.innerHTML = html`
			<div class="reader-content active">
				<div class="reader-loading">
					<div class="loading-spinner"></div>
					<p>Loading...</p>
				</div>
			</div>
            ${this.menu.render()}
		`;
	}


	async showContent() {
		// This method is now deprecated - use showSelectFile() instead
		// Keeping for backward compatibility but should be replaced
		// Get current file name from app controller if available
		const currentFileName = window.appController?.currentFileName || '';
		
		// Try to get files from folder service
		try {
			const filesResult = await this.folderService.getFiles();
			const folderName = await this.folderService.getFolderName();
			const files = filesResult.files || [];
			this.showSelectFile(files, folderName || '', currentFileName);
		} catch (error) {
			// If we can't get files, show empty list
			this.showSelectFile([], '', currentFileName);
		}
	}

	showLoadingState(message = 'Loading...') {
		const content = this.container.querySelector('.reader-content');
		if (content) {
			if (message && message.trim() !== '') {
				content.innerHTML = html`
					<div class="loading-state">
						<div class="loading-spinner"></div>
						<p>${message}</p>
					</div>
				`;
			} else {
				// Clear loading state - don't clear content, let the normal UI flow handle it
				// The database state will be shown by showDatabaseState()
			}
		}
	}

	showDatabaseState({ action, state, metadata, message }) {
		// Store current state and schema for editing
		this.currentState = state;
		this.currentSchema = metadata?.schema;

		// Update header title if we have a schema with title
		if (metadata?.schema?.title) {
			this.header.updateTitle(metadata.schema.title);
		}

		// Generate dynamic UI if we have metadata
		if (metadata && metadata.schema) {
			this.showDynamicUI(metadata.schema, state);
			// Update header title again after showDynamicUI might have re-rendered the header
			if (metadata?.schema?.title) {
				this.header.updateTitle(metadata.schema.title);
			}
			// Update filter icons
			this.header.updateFilterIcons();
		}
	}

	showDynamicUI(schema, state) {
		const content = this.container.querySelector('.reader-content');

		// Insert header at the beginning of the container when database is loaded
		const existingHeader = this.container.querySelector('.reader-header');
		if (!existingHeader) {
			// Create a temporary div to hold the header HTML
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = this.header.render();
			const headerElement = tempDiv.firstElementChild;
			this.container.insertBefore(headerElement, this.container.firstChild);
		}

		// Show header when database is loaded
		this.header.show();

		// Show header actions when database is loaded
		this.header.showActions();
		
		// Show Add Item button if add control is enabled - use setTimeout to ensure DOM is ready
		setTimeout(() => {
			this.header.showAddItemButton();
		}, 0);

		// Show database actions when database is loaded
		this.menu.showDatabaseActions();

		// Generate UI using DataView component
		const uiContent = this.dataView.render(schema, state);

		content.innerHTML = uiContent;
	}

	setFilter(fieldName, value) {
		// Store in localStorage
		localStorage.setItem(`filter_${fieldName}`, value);

		// Always clear selection when filter changes
		this.controller.deselectRow();

		if (this.currentSchema && this.currentState) {
			// Re-render with new filter
			this.showDynamicUI(this.currentSchema, this.currentState);
			// Update filter icons and search placeholders
			this.header.updateFilterIcons();
			// Update title with current filter information
			if (this.currentSchema.title) {
				this.header.updateTitle(this.currentSchema.title);
			}
		}
	}

	showSelectedEditModal(itemId = null) {
		this.rowModal.show(itemId);
	}

	hideSelectedEditModal() {
		this.rowModal.hide();
	}

	showQueryModal() {
		this.queryModal.show();
	}

	hideQueryModal() {
		this.queryModal.hide();
	}

	handleSelectedEditFormSubmit(form) {
		const formData = new FormData(form);
		const data = {};

		// Extract form data
		for (const [key, value] of formData.entries()) {
			data[key] = value;
		}

		// Get the item ID (if present)
		const itemId = data.id;

		if (itemId) {
			// Edit mode: Remove ID from data object before sending to controller
			delete data.id;
			// Dispatch update event
			this.controller.dispatchUpdateData(data, itemId);
		} else {
			// Add mode: Insert new item
			this.controller.dispatchInsertData(data);
		}

		// Hide modal
		this.hideSelectedEditModal();

		// Clear selection
		this.controller.selectedRowId = null;
		this.header.hideSelectedEditButton();
	}

	showBulkUpsertModal() {
		this.bulkUpsertModal.show();
	}

	hideBulkUpsertModal() {
		this.bulkUpsertModal.hide();
	}

	handleBulkUpsertSubmit() {
		const textarea = document.querySelector('#bulk-upsert-data');
		const data = textarea.value.trim();

		if (!data) {
			alert('Please enter some data to process.');
			return;
		}

		// Parse the data into the format expected by bulkUpsert
		const items = data
			.split('\n')
			.filter((line) => line.trim())
			.map((line) => {
				const match = line.match(/^(\d+)\s*-\s*(.+)$/);
				if (match) {
					const [, id, name] = match;
					return {
						id: parseInt(id),
						text: name.trim(),
						status: 'Todo',
					};
				}
				return null;
			})
			.filter((item) => item !== null);

		if (items.length === 0) {
			alert('No valid data found. Please use the format: id - name');
			return;
		}

		// Dispatch the bulk upsert event
		this.controller.dispatchBulkUpsert(items);
		this.hideBulkUpsertModal();
	}

	selectRow(rowId) {
		// Delegate to DataView component
		this.dataView.selectRow(rowId);
		// Show edit button if selectedEdit control is enabled
		this.header.showSelectedEditButton();
	}

	clearRowSelection() {
		// Delegate to DataView component
		this.dataView.clearRowSelection();
		// Hide edit button when selection is cleared
		this.header.hideSelectedEditButton();
		// Note: Add Item button stays visible as it's not dependent on selection
	}


	showAddForm() {
		// Open the modal for adding a new item (no selected item)
		this.showSelectedEditModal(null);
	}

	showEditForm(itemId) {
		// Open the modal for editing an existing item
		this.showSelectedEditModal(itemId);
	}

	handleDeleteClick(itemId) {
		if (confirm('Are you sure you want to delete this item?')) {
			// Call controller method to dispatch event
			this.controller.dispatchDeleteData(itemId);
		}
	}




	showDatabaseError(error) {
		this.errorModal.showDatabaseError(error);
	}

	hideError() {
		this.errorModal.hide();
	}

	showSelectFolder() {
		// Remove header completely when showing folder selection
		const existingHeader = this.container.querySelector('.reader-header');
		if (existingHeader) {
			existingHeader.remove();
		}

		// Hide database actions when showing folder selection
		this.menu.hideDatabaseActions();

		const content = this.container.querySelector('.reader-content');
		if (content) {
			content.innerHTML = this.selectFolder.render();
		}
	}

	showSelectFile(files = [], folderName = '', currentFileName = '') {
		// Ensure files is always an array
		const safeFiles = Array.isArray(files) ? files : [];
		
		// Remove main header when showing file selection
		const existingHeader = this.container.querySelector('.reader-header');
		if (existingHeader) {
			existingHeader.remove();
		}

		// Hide database actions when showing file selection
		this.menu.hideDatabaseActions();

		const content = this.container.querySelector('.reader-content');
		if (content) {
			content.innerHTML = this.selectFile.render(safeFiles, folderName, currentFileName);
		}
	}

	// Pane swapping methods
	showReaderPane = () => {
		this.menu.hideHamburgerMenu();
		const readerPane = this.container.querySelector('.reader-content');
		const filesPane = this.container.querySelector('.files-content');
		
		if (readerPane && filesPane) {
			readerPane.classList.add('active');
			filesPane.classList.remove('active');
		}
	}

	showFilesPane = () => {
		this.menu.hideHamburgerMenu();
		const readerPane = this.container.querySelector('.reader-content');
		const filesPane = this.container.querySelector('.files-content');
		
		if (readerPane && filesPane) {
			readerPane.classList.remove('active');
			filesPane.classList.add('active');
			// Files pane is now active
		}
	}

}
