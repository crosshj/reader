import { html, dispatchEvent } from '../../_lib/utils.js';
import './shared.css';
import './Metadata.css';

export class MetadataModal {
	constructor(reader) {
		this.reader = reader;
	}

	render() {
		// Modal is rendered dynamically, so this returns empty
		// The modal is created when show() is called
		return '';
	}

	show(isNewFile = false) {
		// Hide hamburger menu first
		this.reader.menu.hideHamburgerMenu();

		// Get current schema (should be loaded from the temporary database)
		const currentSchema = this.reader.currentSchema;
		
		// Store the mode and schema for later use
		this.isNewFile = isNewFile;
		this.currentSchema = currentSchema;

		// Create modal overlay
		const modal = document.createElement('div');
		modal.className = 'metadata-modal-overlay';
		modal.innerHTML = html`
			<div class="metadata-modal">
				<div class="modal-header">
					<h3>${isNewFile ? 'Create New Database' : 'Edit Database'}</h3>
					<button
						id="close-metadata-modal"
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
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
				<form id="metadata-form" class="modal-content">
					<div class="section">
						<form-field
							field='{"name": "title", "type": "text", "displayName": "Title", "placeholder": "Enter database title"}'
							value="${currentSchema?.title || ''}"
							mode="edit">
						</form-field>
						<form-field
							field='{"name": "description", "type": "textarea", "displayName": "Description", "placeholder": "Enter database description", "rows": 3}'
							value="${currentSchema?.description || ''}"
							mode="edit">
						</form-field>
						<form-field
							field='{"name": "tableName", "type": "text", "displayName": "Table Name", "placeholder": "Enter table name"}'
							value="${currentSchema?.tableName || 'items'}"
							mode="edit">
						</form-field>
					</div>
					<div class="section">
						<h4>Controls</h4>
						<div class="field-config">
							<div class="field-config-body">
								<div class="field-config-row">
									<div class="field-config-col">
										<form-field
											field='{"name": "control-add", "type": "boolean", "displayName": "Add"}'
											value="${currentSchema?.controls?.includes('add') ? 'true' : 'false'}"
											mode="edit">
										</form-field>
									</div>
									<div class="field-config-col">
										<form-field
											field='{"name": "control-edit", "type": "boolean", "displayName": "Edit"}'
											value="${currentSchema?.controls?.includes('edit') ? 'true' : 'false'}"
											mode="edit">
										</form-field>
									</div>
									<div class="field-config-col">
										<form-field
											field='{"name": "control-delete", "type": "boolean", "displayName": "Delete"}'
											value="${currentSchema?.controls?.includes('delete') ? 'true' : 'false'}"
											mode="edit">
										</form-field>
									</div>
								</div>
								<div class="field-config-row">
									<div class="field-config-col">
										<form-field
											field='{"name": "control-selected-edit", "type": "boolean", "displayName": "Selected Edit"}'
											value="${currentSchema?.controls?.includes('selected-edit') ? 'true' : 'false'}"
											mode="edit">
										</form-field>
									</div>
									<div class="field-config-col">
										<form-field
											field='{"name": "control-bulk-upsert", "type": "boolean", "displayName": "Bulk Upsert"}'
											value="${currentSchema?.controls?.includes('bulk-upsert') ? 'true' : 'false'}"
											mode="edit">
										</form-field>
									</div>
									<div class="field-config-col">
										<form-field
											field='{"name": "showHeaders", "type": "boolean", "displayName": "Show Headers"}'
											value="${currentSchema?.showHeaders !== false ? 'true' : 'false'}"
											mode="edit">
										</form-field>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="section">
						<h4>Fields</h4>
						<div id="fields-container">
							${this.generateFieldsConfig()}
						</div>
						<button
							type="button"
							id="add-field-btn"
							class="btn btn-secondary"
						>
							Add Field
						</button>
					</div>
					<div class="modal-actions">
						<button
							type="button"
							id="cancel-metadata-btn"
							class="btn btn-secondary"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="btn btn-primary"
						>
							${isNewFile ? 'Create Database' : 'Save'}
						</button>
					</div>
				</form>
			</div>
		`;

		this.reader.container.appendChild(modal);

		// Add event listeners
		modal.addEventListener('click', (e) => {
			if (e.target.matches('#close-metadata-modal, #cancel-metadata-btn')) {
				this.hide();
			}
		});

		modal.addEventListener('click', (e) => {
			if (e.target.matches('#add-field-btn')) {
				this.addField();
			}
			if (e.target.matches('.remove-field-btn')) {
				const index = e.target.dataset.index;
				this.removeField(index);
			}
		});

		modal.addEventListener('submit', (e) => {
			e.preventDefault();
			this.submit();
		});

		// Show modal with animation
		setTimeout(() => {
			modal.classList.add('show');
			// Focus the first input field after modal is visible
			this.focusFirstInput(modal);
		}, 10);
	}

	async hide() {
		const modal = this.reader.container.querySelector('.metadata-modal-overlay');
		if (modal) {
			modal.classList.remove('show');
			setTimeout(async () => {
				modal.remove();
				
				// Navigation depends on the mode:
				// - Create mode: go back to file selection (noFile) with updated file list
				// - Edit mode: stay in current database view (no state change)
				if (this.isNewFile) {
					// Create mode - go back to file selection with current file info
					try {
						const filesResult = await this.reader.folderService.getFiles();
						const folderName = await this.reader.folderService.getFolderName();
						
						// Extract files array from the result object
						const files = filesResult.files || [];
						
						// Get the current file name from the app controller
						const currentFileName = window.appController?.currentFileName || '';
						
						dispatchEvent('app:state', { 
							state: 'noFile',
							data: { 
								files: files, 
								folderName: folderName || '', 
								currentFileName: currentFileName 
							}
						});
					} catch (error) {
						// If we can't get files, still show noFile state but without files
						dispatchEvent('app:state', { 
							state: 'noFile',
							data: { 
								files: [], 
								folderName: '', 
								currentFileName: window.appController?.currentFileName || '' 
							}
						});
					}
				}
				// Edit mode - just close the modal and stay in current database view
			}, 300);
		}
	}

	submit() {
		const form = document.getElementById('metadata-form');
		const formData = new FormData(form);

		// Get basic metadata
		const controls = [];
		if (formData.has('control-add')) controls.push('add');
		if (formData.has('control-edit')) controls.push('edit');
		if (formData.has('control-delete')) controls.push('delete');
		if (formData.has('control-selected-edit')) controls.push('selected-edit');
		if (formData.has('control-bulk-upsert')) controls.push('bulk-upsert');

		// Process field property changes
		const updatedFields = this.processFieldPropertyChanges(formData);

		const metadata = {
			title: formData.get('title') || '',
			description: formData.get('description') || '',
			tableName: formData.get('tableName') || 'items',
			showHeaders: formData.has('showHeaders'),
			controls: controls,
			fields: updatedFields
		};

		// Log the transformed data being sent to backend
		console.log('Metadata form submit - data being sent to backend:', metadata);

		// Update current schema
		if (this.reader.currentSchema) {
			this.reader.currentSchema.title = metadata.title;
			this.reader.currentSchema.description = metadata.description;
			this.reader.currentSchema.tableName = metadata.tableName;
			this.reader.currentSchema.showHeaders = metadata.showHeaders;
			this.reader.currentSchema.controls = metadata.controls;
		}

		// Update the header title
		this.reader.header.updateTitle(metadata.title);

		// Check if this is a new file being created
		if (this.isNewFile) {
			// For new files, set up a listener for file creation completion
			this.setupFileCreationListener();
			
			// Dispatch the create file event
			this.reader.controller.dispatchCreateNewFile(metadata);
		} else {
			// For existing files, just update metadata
			this.reader.controller.dispatchUpdateMetadata(metadata);
			this.hide(); // Edit mode - just close the modal
		}
	}

	setupFileCreationListener() {
		// Listen for the file creation completion
		const handleFileCreated = (e) => {
			if (e.detail.action === 'file_created') {
				// File creation completed successfully, now navigate back to file selection
				this.hide();
				// Remove this listener since we only need it once
				document.removeEventListener('db:state', handleFileCreated);
			}
		};

		// Listen for file creation errors too
		const handleFileError = (e) => {
			if (e.detail.action === 'error' && this.isNewFile) {
				// File creation failed, still navigate back to file selection
				this.hide();
				// Remove listeners
				document.removeEventListener('db:state', handleFileCreated);
				document.removeEventListener('db:state', handleFileError);
			}
		};

		document.addEventListener('db:state', handleFileCreated);
		document.addEventListener('db:state', handleFileError);
	}

	addField() {
		if (!this.reader.currentSchema) {
			this.reader.currentSchema = { fields: [] };
		}
		if (!this.reader.currentSchema.fields) {
			this.reader.currentSchema.fields = [];
		}

		// Add a new field with default values
		this.reader.currentSchema.fields.push({
			name: `field_${Date.now()}`,
			displayName: '',
			type: 'text',
			required: false,
			options: []
		});

		// Refresh the fields container
		const container = document.getElementById('fields-container');
		if (container) {
			container.innerHTML = this.generateFieldsConfig();
		}
	}

	removeField(index) {
		if (this.reader.currentSchema && this.reader.currentSchema.fields) {
			this.reader.currentSchema.fields.splice(index, 1);

			// Refresh the fields container
			const container = document.getElementById('fields-container');
			if (container) {
				container.innerHTML = this.generateFieldsConfig();
			}
		}
	}

	processFieldPropertyChanges(formData) {
		const fields = this.currentSchema?.fields || [];
		
		return fields.map((field, index) => {
			const updatedField = { ...field };
			
			// Process field properties from form data
			const fieldPrefix = `field-`;
			
			// Update field name
			const newName = formData.get(`${fieldPrefix}name-${index}`);
			if (newName) updatedField.name = newName;
			
			// Update display name
			const newDisplayName = formData.get(`${fieldPrefix}displayName-${index}`);
			if (newDisplayName) updatedField.displayName = newDisplayName;
			
			// Update field type
			const newType = formData.get(`${fieldPrefix}type-${index}`);
			if (newType) updatedField.type = newType;
			
			// Update boolean properties
			updatedField.required = formData.has(`${fieldPrefix}required-${index}`);
			updatedField.readOnly = formData.has(`${fieldPrefix}readOnly-${index}`);
			updatedField.primaryKey = formData.has(`${fieldPrefix}primaryKey-${index}`);
			updatedField.hidden = formData.has(`${fieldPrefix}hidden-${index}`);
			updatedField.filterable = formData.has(`${fieldPrefix}filterable-${index}`);
			updatedField.showAllOption = formData.has(`${fieldPrefix}showAllOption-${index}`);
			
			// Update enum options
			const newOptions = formData.get(`${fieldPrefix}options-${index}`);
			if (newOptions && field.type === 'enum') {
				updatedField.options = newOptions.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
			}
			
			return updatedField;
		});
	}

	generateFieldsConfig() {
		const fields = this.reader.currentSchema?.fields || [];

		return fields
			.map(
				(field, index) => html`
					<div class="field-config" data-index="${index}">
						<div class="field-config-header">
							<span class="field-name">${field.displayName || field.name}</span>
							<button
								type="button"
								class="remove-field-btn"
								data-index="${index}"
							>
								×
							</button>
						</div>
						<div class="field-config-body">
							<div class="field-config-row">
								<div class="field-config-col">
									<form-field
										field='{"name": "field-name-${index}", "type": "text", "displayName": "Name"}'
										value="${field.name}"
										mode="edit">
									</form-field>
								</div>
								<div class="field-config-col">
									<form-field
										field='{"name": "field-displayName-${index}", "type": "text", "displayName": "Display Name"}'
										value="${field.displayName || field.name}"
										mode="edit">
									</form-field>
								</div>
								<div class="field-config-col">
									<form-field
										field='{"name": "field-type-${index}", "type": "enum", "displayName": "Type", "options": ["text", "integer", "datetime", "enum"]}'
										value="${field.type}"
										mode="edit">
									</form-field>
								</div>
							</div>
							<div class="field-config-row">
								<div class="field-config-col">
									<form-field
										field='{"name": "field-required-${index}", "type": "boolean", "displayName": "Required"}'
										value="${field.required ? 'true' : 'false'}"
										mode="edit">
									</form-field>
								</div>
								<div class="field-config-col">
									<form-field
										field='{"name": "field-readOnly-${index}", "type": "boolean", "displayName": "Read Only"}'
										value="${field.readOnly ? 'true' : 'false'}"
										mode="edit">
									</form-field>
								</div>
								<div class="field-config-col">
									<form-field
										field='{"name": "field-primaryKey-${index}", "type": "boolean", "displayName": "Primary Key"}'
										value="${field.primaryKey ? 'true' : 'false'}"
										mode="edit">
									</form-field>
								</div>
							</div>
							<div class="field-config-row">
								<div class="field-config-col">
									<form-field
										field='{"name": "field-hidden-${index}", "type": "boolean", "displayName": "Hidden from View"}'
										value="${field.hidden ? 'true' : 'false'}"
										mode="edit">
									</form-field>
								</div>
								<div class="field-config-col">
									<form-field
										field='{"name": "field-filterable-${index}", "type": "boolean", "displayName": "Enable Filter Icon"}'
										value="${field.filterable ? 'true' : 'false'}"
										mode="edit">
									</form-field>
								</div>
								${field.filterable
									? html`
										<div class="field-config-col">
											<form-field
												field='{"name": "field-showAllOption-${index}", "type": "boolean", "displayName": "Show All Option"}'
												value="${field.showAllOption !== false ? 'true' : 'false'}"
												mode="edit">
											</form-field>
										</div>
									`
									: ''}
							</div>
							${field.type === 'enum'
								? html`
										<div class="field-config-row">
											<div class="field-config-col full-width">
												<form-field
													field='{"name": "field-options-${index}", "type": "text", "displayName": "Options (comma-separated)", "placeholder": "Option1, Option2, Option3", "helpText": "First option will be the default filter value"}'
													value="${field.options?.join(', ') || ''}"
													mode="edit">
												</form-field>
											</div>
										</div>
								  `
								: ''}
						</div>
					</div>
				`
			)
			.join('');
	}

	updateFieldName(index, value) {
		if (this.reader.currentSchema?.fields?.[index]) {
			this.reader.currentSchema.fields[index].name = value;
		}
	}

	updateFieldDisplayName(index, value) {
		if (this.reader.currentSchema?.fields?.[index]) {
			this.reader.currentSchema.fields[index].displayName = value;
		}
	}

	updateFieldType(index, value) {
		if (this.reader.currentSchema?.fields?.[index]) {
			this.reader.currentSchema.fields[index].type = value;
			// Refresh the fields container to show/hide options field
			const container = document.getElementById('fields-container');
			if (container) {
				container.innerHTML = this.generateFieldsConfig();
			}
		}
	}

	updateFieldRequired(index, value) {
		if (this.reader.currentSchema?.fields?.[index]) {
			this.reader.currentSchema.fields[index].required = value;
		}
	}

	updateFieldOptions(index, value) {
		if (this.reader.currentSchema?.fields?.[index]) {
			this.reader.currentSchema.fields[index].options = value
				.split(',')
				.map(opt => opt.trim())
				.filter(opt => opt.length > 0);
		}
	}

	getDefaultSchema() {
		return {
			version: '1.0',
			title: 'My Database',
			type: 'list',
			tableName: 'items',
			description: '',
			showHeaders: true,
			controls: ['add', 'edit', 'delete', 'bulk-upsert', 'selected-edit'],
			fields: [
				{
					name: 'id',
					displayName: 'ID',
					type: 'integer',
					primaryKey: true,
					autoIncrement: true,
					required: false
				},
				{
					name: 'text',
					displayName: 'Text',
					type: 'text',
					primaryKey: false,
					autoIncrement: false,
					required: false
				}
			]
		};
	}

	focusFirstInput(modal) {
		// Find the first focusable input element in the modal
		const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
		if (firstInput) {
			// Use setTimeout to ensure the modal is fully rendered
			setTimeout(() => {
				firstInput.focus();
			}, 50);
		}
	}
}
