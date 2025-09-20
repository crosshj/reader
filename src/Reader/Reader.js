import { html } from '../_lib/utils.js';
import './Reader.css';
import { Header } from './components/Header.js';
import { Menu } from './components/Menu.js';
import { List } from './components/List.js';
import { ModalMetadataEdit } from './components/ModalMetadataEdit.js';
import { Files } from './components/Files.js';
import { DataView } from './components/DataView.js';
import { renderError } from './components/Error.js';
import { SelectFolder } from './components/SelectFolder.js';
import { SelectFile } from './components/SelectFile.js';

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
		this.modalMetadataEdit = new ModalMetadataEdit(this);
		this.files = new Files(this);
		this.dataView = new DataView(this);
		this.selectFolder = new SelectFolder();
		this.selectFile = new SelectFile();

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
			${this.files.render()}
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
			const filesResult = await this.files.folderService.getFiles();
			const folderName = await this.files.folderService.getFolderName();
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
		// Hide hamburger menu first
		this.menu.hideHamburgerMenu();

		// Get the item to edit (either passed itemId or selected item)
		const selectedItem = itemId
			? this.dataView.getItemById(itemId)
			: this.controller.selectedRowId
			? this.dataView.getItemById(this.controller.selectedRowId)
			: null;

		// For add mode, we don't need an existing item
		const isAddMode = !itemId && !this.controller.selectedRowId;

		// Create modal overlay
		const modal = document.createElement('div');
		modal.className = 'selected-edit-modal-overlay';
		modal.innerHTML = html`
			<div class="selected-edit-modal">
				<div class="modal-header">
					<h3>${isAddMode ? 'Add Item' : 'Edit Item'}</h3>
					<button
						id="close-selected-edit-modal"
						class="close-btn"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line
								x1="18"
								y1="6"
								x2="6"
								y2="18"
							></line>
							<line
								x1="6"
								y1="6"
								x2="18"
								y2="18"
							></line>
						</svg>
					</button>
				</div>
				<form
					id="selected-edit-form"
					class="modal-content"
				>
					${!isAddMode
						? html`
								<input
									type="hidden"
									name="id"
									value="${selectedItem?.id || ''}"
								/>
						  `
						: ''}
					${this.currentSchema?.fields
						?.filter((field) => {
							// Exclude ID field from form
							if (field.name === 'id') return false;
							// Exclude timestamp fields from both add and edit modes
							if (field.name === 'created_at' || field.name === 'modified_at') return false;
							return true;
						})
						?.map(
							(field) => html`
								<div class="form-field">
									<label for="selected-edit-${field.name}"
										>${field.displayName ||
										field.name}</label
									>
									${this.generateFieldInputForModal(
										field,
										selectedItem || {}
									)}
								</div>
							`
						)
						.join('') || ''}
					<div class="modal-actions">
						<button
							type="button"
							id="cancel-selected-edit"
							class="btn btn-secondary"
						>
							Cancel
						</button>
						<button
							type="submit"
							id="save-selected-edit"
							class="btn btn-primary"
						>
							Save Changes
						</button>
					</div>
				</form>
			</div>
		`;

		// Add modal to DOM
		this.container.appendChild(modal);

		// Show modal with animation
		requestAnimationFrame(() => {
			modal.style.opacity = '1';
			modal.style.visibility = 'visible';
		});
	}

	hideSelectedEditModal() {
		const modal = this.container.querySelector(
			'.selected-edit-modal-overlay'
		);
		if (modal) {
			modal.style.opacity = '0';
			modal.style.visibility = 'hidden';
			setTimeout(() => {
				modal.remove();
			}, 300);
		}
	}

	showQueryModal() {
		// Hide hamburger menu first
		this.menu.hideHamburgerMenu();

		// Create modal overlay
		const modal = document.createElement('div');
		modal.className = 'query-modal-overlay';
		modal.innerHTML = html`
			<div class="query-modal">
				<div class="modal-header">
					<h3>Execute Query</h3>
					<button
						id="close-query-modal"
						class="close-btn"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line
								x1="18"
								y1="6"
								x2="6"
								y2="18"
							></line>
							<line
								x1="6"
								y1="6"
								x2="18"
								y2="18"
							></line>
						</svg>
					</button>
				</div>
				<div class="modal-content">
					<div class="form-field">
						<label for="query-textarea">SQL Query</label>
						<textarea
							id="query-textarea"
							placeholder="Enter your SQL query here..."
							rows="10"
						></textarea>
					</div>
				</div>
				<div class="modal-actions">
					<button
						id="cancel-query"
						class="action-btn secondary"
					>
						Cancel
					</button>
					<button
						id="execute-query"
						class="action-btn primary"
					>
						Execute
					</button>
				</div>
			</div>
		`;

		// Add modal to container
		this.container.appendChild(modal);

		// Animate in
		requestAnimationFrame(() => {
			modal.style.opacity = '1';
			modal.style.visibility = 'visible';
		});
	}

	hideQueryModal() {
		const modal = this.container.querySelector('.query-modal-overlay');
		if (modal) {
			modal.style.opacity = '0';
			modal.style.visibility = 'hidden';
			setTimeout(() => {
				modal.remove();
			}, 300);
		}
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
		const modal = document.createElement('div');
		modal.className = 'bulk-upsert-modal-overlay';
		modal.innerHTML = html`
			<div class="bulk-upsert-modal">
				<div class="modal-header">
					<h3>Bulk Upsert Data</h3>
					<button
						id="close-bulk-upsert-modal"
						class="close-btn"
					>
						&times;
					</button>
				</div>
				<div class="modal-content">
					<p>Paste your data in the format: <code>id - name</code></p>
					<textarea
						id="bulk-upsert-data"
						placeholder="Paste your data here..."
						rows="15"
						style="width: 100%; margin: 1rem 0; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 12px;"
					></textarea>
				</div>
				<div class="modal-actions">
					<button
						id="cancel-bulk-upsert"
						class="action-btn secondary"
					>
						Cancel
					</button>
					<button
						id="process-bulk-upsert"
						class="action-btn primary"
					>
						Process Data
					</button>
				</div>
			</div>
		`;

		this.container.appendChild(modal);

		// Add event listeners
		modal
			.querySelector('#close-bulk-upsert-modal')
			.addEventListener('click', () => {
				this.hideBulkUpsertModal();
			});

		modal
			.querySelector('#cancel-bulk-upsert')
			.addEventListener('click', () => {
				this.hideBulkUpsertModal();
			});

		modal
			.querySelector('#process-bulk-upsert')
			.addEventListener('click', () => {
				this.handleBulkUpsertSubmit();
			});
	}

	hideBulkUpsertModal() {
		const modal = this.container.querySelector(
			'.bulk-upsert-modal-overlay'
		);
		if (modal) {
			modal.remove();
		}
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

	generateFieldInputForModal(field, selectedItem) {
		const fieldName = field.name;
		const fieldValue = selectedItem[fieldName] || '';
		const inputId = `selected-edit-${fieldName}`;

		switch (field.type) {
			case 'text':
				return html`
					<input
						type="text"
						id="${inputId}"
						name="${fieldName}"
						value="${fieldValue}"
						placeholder="${field.placeholder || ''}"
					/>
				`;

			case 'enum':
				const options = field.options || [];
				return html`
					<select id="${inputId}" name="${fieldName}">
						<option value="">Select ${field.displayName || fieldName}...</option>
						${options.map(option => html`
							<option value="${option}" ${fieldValue === option ? 'selected' : ''}>
								${option}
							</option>
						`).join('')}
					</select>
				`;

			case 'datetime':
				return html`
					<input
						type="datetime-local"
						id="${inputId}"
						name="${fieldName}"
						value="${fieldValue ? new Date(fieldValue).toISOString().slice(0, 16) : ''}"
					/>
				`;

			case 'number':
				return html`
					<input
						type="number"
						id="${inputId}"
						name="${fieldName}"
						value="${fieldValue}"
						placeholder="${field.placeholder || ''}"
						${field.min !== undefined ? `min="${field.min}"` : ''}
						${field.max !== undefined ? `max="${field.max}"` : ''}
					/>
				`;

			case 'boolean':
				return html`
					<input
						type="checkbox"
						id="${inputId}"
						name="${fieldName}"
						${fieldValue ? 'checked' : ''}
					/>
				`;

			default:
				return html`
					<input
						type="text"
						id="${inputId}"
						name="${fieldName}"
						value="${fieldValue}"
						placeholder="${field.placeholder || ''}"
					/>
				`;
		}
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
		// Show error as a modal overlay
		console.log('showDatabaseError called with:', error);
		const errorHTML = renderError({
			type: 'database',
			message: error,
			retryButtonId: 'retry-btn'
		});
		
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = errorHTML;
		const errorElement = tempDiv.firstElementChild;
		this.container.appendChild(errorElement);
		
		// Add direct event listeners for the error modal
		const closeBtn = errorElement.querySelector('#error-close-btn');
		const dismissBtn = errorElement.querySelector('#error-dismiss-btn');
		
		if (closeBtn) {
			closeBtn.addEventListener('click', () => this.hideError());
		}
		if (dismissBtn) {
			dismissBtn.addEventListener('click', () => this.hideError());
		}
	}

	hideError() {
		// Simply remove the error modal overlay
		const errorOverlay = this.container.querySelector('#error-modal-overlay');
		if (errorOverlay) {
			errorOverlay.remove();
		}
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
			// Trigger async events when files pane becomes active
			this.files.onActivate();
		}
	}

}
