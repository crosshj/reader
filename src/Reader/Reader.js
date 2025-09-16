import { html } from '../_lib/utils.js';
import './Reader.css';
import { Header } from './components/Header.js';
import { Menu } from './components/Menu.js';
import { List } from './components/List.js';
import { ModalMetadataEdit } from './components/ModalMetadataEdit.js';

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

		this.render();
	}

	render() {
		this.container.innerHTML = html`
			${this.header.render()}
			<div class="reader-content">
				<div class="reader-loading">
					<div class="loading-spinner"></div>
					<p>Loading...</p>
				</div>
			</div>
			${this.menu.render()}
		`;
	}

	showContent() {
		// Hide header actions when showing splash screen
		this.header.hideActions();

		// Hide database actions when showing splash screen
		this.menu.hideDatabaseActions();

		const content = this.container.querySelector('.reader-content');
		content.innerHTML = html`
			<div class="splash-container">
				<div class="splash-content">
					<div class="splash-icon">
						<svg
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<!-- White-filled document for visibility on dark backgrounds -->
							<path
								d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
								fill="white"
								stroke="#666666"
								stroke-width="1.5"
							/>
							<!-- Folded corner -->
							<polyline
								points="14,2 14,8 20,8"
								stroke="#666666"
								stroke-width="1.5"
								fill="none"
							/>
							<!-- Document content lines -->
							<line
								x1="16"
								y1="13"
								x2="8"
								y2="13"
								stroke="#666666"
								stroke-width="1.5"
							/>
							<line
								x1="16"
								y1="17"
								x2="8"
								y2="17"
								stroke="#666666"
								stroke-width="1.5"
							/>
							<polyline
								points="10,9 9,9 8,9"
								stroke="#666666"
								stroke-width="1.5"
								fill="none"
							/>
						</svg>
					</div>
					<h2 class="splash-title">Welcome to Reader</h2>
					<p class="splash-description">
						Create or open a .smartText database file to get started
						with your data management.
					</p>
					<div class="splash-actions">
						<button
							id="open-file-btn"
							class="splash-btn primary"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
								></path>
								<polyline points="14,2 14,8 20,8"></polyline>
							</svg>
							Open Existing File
						</button>
						<button
							id="create-file-btn"
							class="splash-btn secondary"
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
									x1="12"
									y1="5"
									x2="12"
									y2="19"
								></line>
								<line
									x1="5"
									y1="12"
									x2="19"
									y2="12"
								></line>
							</svg>
							Create New File
						</button>
					</div>
					<div class="splash-features">
						<div class="feature">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"
								></path>
								<rect
									x="9"
									y="11"
									width="6"
									height="11"
								></rect>
								<path d="M9 7h6v4H9z"></path>
							</svg>
							<span>Dynamic UI Generation</span>
						</div>
						<div class="feature">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect
									x="2"
									y="3"
									width="20"
									height="14"
									rx="2"
									ry="2"
								></rect>
								<line
									x1="8"
									y1="21"
									x2="16"
									y2="21"
								></line>
								<line
									x1="12"
									y1="17"
									x2="12"
									y2="21"
								></line>
							</svg>
							<span>SQLite Database</span>
						</div>
						<div class="feature">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
								></path>
								<polyline
									points="3.27,6.96 12,12.01 20.73,6.96"
								></polyline>
								<line
									x1="12"
									y1="22.08"
									x2="12"
									y2="12"
								></line>
							</svg>
							<span>Schema-Driven</span>
						</div>
					</div>
				</div>
			</div>
		`;
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
				// Clear loading state - restore previous content
				// This will be handled by the normal UI flow
				content.innerHTML = '';
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

		// Show header actions when database is loaded
		this.header.showActions();

		// Show database actions when database is loaded
		this.menu.showDatabaseActions();

		// Generate UI based on schema type
		let uiContent;
		if (schema.type === 'list') {
			uiContent = this.list.render(schema, state);
		} else {
			uiContent = html`<p>Unsupported schema type: ${schema.type}</p>`;
		}

		content.innerHTML = html`
			<div class="dynamic-ui-pane">
				<div
					id="dynamic-ui-content"
					class="dynamic-ui-content"
				>
					${uiContent}
				</div>
			</div>
		`;
	}

	setFilter(fieldName, value) {
		// Store in localStorage
		localStorage.setItem(`filter_${fieldName}`, value);

		if (this.currentSchema && this.currentState) {
			this.showDynamicUI(this.currentSchema, this.currentState);
		}
	}

	showSelectedEditModal(itemId = null) {
		// Hide hamburger menu first
		this.menu.hideHamburgerMenu();

		// Get the item to edit (either passed itemId or selected item)
		const selectedItem = itemId
			? this.list.getItemById(itemId)
			: this.controller.selectedRowId
			? this.list.getItemById(this.controller.selectedRowId)
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
		const row = this.container.querySelector(
			`.grid-row[data-row-id="${rowId}"]`
		);
		if (row) {
			this.clearRowSelection();
			row.querySelectorAll('.grid-cell').forEach((cell) =>
				cell.classList.add('row-selected')
			);
			// Show edit button if selectedEdit control is enabled
			this.header.showSelectedEditButton();
		}
	}

	clearRowSelection() {
		this.container
			.querySelectorAll('.row-selected')
			.forEach((cell) => cell.classList.remove('row-selected'));
		// Hide edit button when selection is cleared
		this.header.hideSelectedEditButton();
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
		const content = this.container.querySelector('.reader-content');
		if (content) {
			content.innerHTML = html`
				<div class="error-container">
					<div class="error-icon">
						<svg
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="15" y1="9" x2="9" y2="15" />
							<line x1="9" y1="9" x2="15" y2="15" />
						</svg>
					</div>
					<h3 class="error-title">Database Error</h3>
					<p class="error-message">${error}</p>
					<button
						id="retry-btn"
						class="action-btn primary"
					>
						Try Again
					</button>
				</div>
			`;
		}
	}

	showFileError(error, action) {
		const content = this.container.querySelector('.reader-content');
		if (content) {
			const actionText =
				action === 'open'
					? 'opening'
					: action === 'create'
					? 'creating'
					: 'saving';
			content.innerHTML = html`
				<div class="error-container">
					<div class="error-icon">
						<svg
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle
								cx="12"
								cy="12"
								r="10"
							/>
							<line
								x1="15"
								y1="9"
								x2="9"
								y2="15"
							/>
							<line
								x1="9"
								y1="9"
								x2="15"
								y2="15"
							/>
						</svg>
					</div>
					<h3 class="error-title">File Error</h3>
					<p class="error-message">
						Error ${actionText} file: ${error}
					</p>
					<div class="error-actions">
						<button
							id="retry-file-btn"
							class="action-btn primary"
						>
							Try Again
						</button>
						<button
							id="back-to-splash-btn"
							class="action-btn secondary"
						>
							Back to Home
						</button>
					</div>
				</div>
			`;
		}
	}
}
