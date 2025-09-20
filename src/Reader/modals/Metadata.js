import { html, dispatchEvent } from '../../_lib/utils.js';

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
					<div class="form-field">
						<label for="metadata-title">Title</label>
						<input
							type="text"
							id="metadata-title"
							name="title"
							value="${currentSchema?.title || ''}"
							placeholder="Enter database title"
						/>
					</div>
					<div class="form-field">
						<label for="metadata-description">Description</label>
						<textarea
							id="metadata-description"
							name="description"
							placeholder="Enter database description"
						>${currentSchema?.description || ''}</textarea>
					</div>
					<div class="form-field">
						<label for="metadata-table-name">Table Name</label>
						<input
							type="text"
							id="metadata-table-name"
							name="tableName"
							value="${currentSchema?.tableName || 'items'}"
							placeholder="Enter table name"
						/>
					</div>
					<div class="form-field">
						<label>Controls</label>
						<div class="controls-config">
							<label class="control-option">
								<input
									type="checkbox"
									name="showHeaders"
									${currentSchema?.showHeaders !== false ? 'checked' : ''}
								/>
								Show Headers
							</label>
							<label class="control-option">
								<input
									type="checkbox"
									name="controls"
									value="add"
									${currentSchema?.controls?.includes('add') ? 'checked' : ''}
								/>
								Add
							</label>
							<label class="control-option">
								<input
									type="checkbox"
									name="controls"
									value="edit"
									${currentSchema?.controls?.includes('edit') ? 'checked' : ''}
								/>
								Edit
							</label>
							<label class="control-option">
								<input
									type="checkbox"
									name="controls"
									value="delete"
									${currentSchema?.controls?.includes('delete') ? 'checked' : ''}
								/>
								Delete
							</label>
							<label class="control-option">
								<input
									type="checkbox"
									name="controls"
									value="bulk-upsert"
									${currentSchema?.controls?.includes('bulk-upsert') ? 'checked' : ''}
								/>
								Bulk Upsert
							</label>
							<label class="control-option">
								<input
									type="checkbox"
									name="controls"
									value="selected-edit"
									${currentSchema?.controls?.includes('selected-edit') ? 'checked' : ''}
								/>
								Selected Edit
							</label>
						</div>
					</div>
					<div class="form-field">
						<label>Fields</label>
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
		const metadata = {
			title: formData.get('title') || '',
			description: formData.get('description') || '',
			tableName: formData.get('tableName') || 'items',
			showHeaders: formData.has('showHeaders'),
			controls: formData.getAll('controls'),
			fields: this.currentSchema?.fields || []
		};

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
									<label>Name</label>
									<input
										type="text"
										name="field-name-${index}"
										value="${field.name}"
									/>
								</div>
								<div class="field-config-col">
									<label>Display Name</label>
									<input
										type="text"
										name="field-displayName-${index}"
										value="${field.displayName || field.name}"
									/>
								</div>
								<div class="field-config-col">
									<label>Type</label>
									<select name="field-type-${index}">
										<option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
										<option value="integer" ${field.type === 'integer' ? 'selected' : ''}>Integer</option>
										<option value="datetime" ${field.type === 'datetime' ? 'selected' : ''}>DateTime</option>
										<option value="enum" ${field.type === 'enum' ? 'selected' : ''}>Enum</option>
									</select>
								</div>
							</div>
							<div class="field-config-row">
								<div class="field-config-col">
									<label>
										<input
											type="checkbox"
											name="field-required-${index}"
											${field.required ? 'checked' : ''}
										/>
										Required
									</label>
								</div>
								<div class="field-config-col">
									<label>
										<input
											type="checkbox"
											name="field-readOnly-${index}"
											${field.readOnly ? 'checked' : ''}
										/>
										Read Only
									</label>
								</div>
								<div class="field-config-col">
									<label>
										<input
											type="checkbox"
											name="field-primaryKey-${index}"
											${field.primaryKey ? 'checked' : ''}
										/>
										Primary Key
									</label>
								</div>
							</div>
							${field.type === 'enum'
								? html`
										<div class="field-config-row">
											<div class="field-config-col full-width">
												<label>Options (comma-separated)</label>
												<input
													type="text"
													name="field-options-${index}"
													value="${field.options?.join(', ') || ''}"
													placeholder="Option1, Option2, Option3"
												/>
												<small class="field-help">
													First option will be the default filter value
												</small>
											</div>
										</div>
										<div class="field-config-row">
											<div class="field-config-col">
												<label>
													<input
														type="checkbox"
														name="field-filterable-${index}"
														${field.filterable ? 'checked' : ''}
													/>
													Enable Filter Icon
												</label>
											</div>
										</div>
										${field.filterable
											? html`
													<div class="field-config-row">
														<div class="field-config-col">
															<label>
													<input
														type="checkbox"
														name="field-showAllOption-${index}"
														${field.showAllOption !== false ? 'checked' : ''}
													/>
													Show "All" option in filter dropdown
															</label>
														</div>
													</div>
											  `
											: ''}
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
}
