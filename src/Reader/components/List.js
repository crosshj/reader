import { html } from '../../_lib/utils.js';

export class List {
	constructor(reader) {
		this.reader = reader;
	}

	getFilteredItems() {
		if (!this.reader.currentState || !this.reader.currentSchema) return [];

		const tableName = this.reader.currentSchema.tableName || 'items';
		let items = this.reader.currentState[tableName] || [];

		// Apply filters
		const filterableFields =
			this.reader.currentSchema.fields?.filter(
				(field) => field.type === 'enum' && field.filterable
			) || [];

		filterableFields.forEach((field) => {
			const currentFilter = this.reader.header.getCurrentFilter(field.name);
			if (currentFilter && currentFilter !== 'all') {
				items = items.filter(
					(item) => item[field.name] === currentFilter
				);
			}
		});

		return items;
	}

	getHiddenFieldsForFiltering(schema) {
		const hiddenFields = new Set();

		if (!schema?.fields) return hiddenFields;

		const filterableFields = schema.fields.filter(
			(field) => field.type === 'enum' && field.filterable
		);

		filterableFields.forEach((field) => {
			const currentFilter = this.reader.header.getCurrentFilter(field.name);
			// Hide the column if it's filtered to a specific value (not "All")
			if (currentFilter && currentFilter !== 'all') {
				hiddenFields.add(field.name);
			}
		});

		return hiddenFields;
	}

	formatDate(dateString) {
		if (!dateString) return '';

		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return dateString;

			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch (error) {
			return dateString;
		}
	}

	getItemById(itemId) {
		if (!this.reader.currentState || !this.reader.currentSchema) return null;

		const tableName = this.reader.currentSchema.tableName || 'items';
		const items = this.reader.currentState[tableName] || [];
		return items.find((item) => item.id == itemId);
	}

	render(schema, state) {
		const tableName = schema.tableName || 'items';
		const allItems = state?.[tableName] || [];
		const items = this.getFilteredItems(); // Use filtered items instead of all items
		
		// Safety check: ensure items is an array
		if (!Array.isArray(items)) {
			console.error('Items is not an array:', items);
			return html`<p class="error-state">Error: Invalid data format</p>`;
		}
		const fields = schema.fields || [];

		// Filter out read-only and auto-increment fields for the form
		const editableFields = fields.filter(
			(field) => !field.readOnly && !field.autoIncrement
		);

		// Calculate grid template columns
		const hasActions =
			schema.controls?.includes('edit') ||
			schema.controls?.includes('delete');
		const totalColumns = fields.length + (hasActions ? 1 : 0);
		const textColumns = fields.filter(
			(field) => field.type === 'text'
		).length;
		const nonTextColumns =
			fields.length - textColumns + (hasActions ? 1 : 0);

		// Check if headers should be shown (default to true for backward compatibility)
		const showHeaders = schema.showHeaders !== false;

		// Check if any controls will actually be rendered
		const hasAddControl = schema.controls?.includes('add');
		const hasBulkUpsertControl =
			schema.controls?.includes('bulk-upsert') && items.length > 0;
		const hasAnyControls = hasAddControl || hasBulkUpsertControl;

		// Get fields that should be hidden because they're filtered to a specific value
		const hiddenFields = this.getHiddenFieldsForFiltering(schema);

		// Create grid template: text columns get more space, others get fixed width
		// Only include visible fields in the grid template
		const visibleFields = fields.filter(
			(field) => !hiddenFields.has(field.name)
		);
		const gridTemplate = visibleFields
			.map((field) => (field.type === 'text' ? '1fr' : 'auto'))
			.concat(hasActions ? ['auto'] : [])
			.join(' ');

		return html`
			<div class="list-ui">
				${hasAnyControls
					? html`
							<div class="list-controls">
								${hasAddControl
									? html`
											<button
												id="add-item-btn"
												class="action-btn primary"
											>
												Add Item
											</button>
									  `
									: ''}
								${hasBulkUpsertControl
									? html`
											<button
												id="bulk-upsert-btn"
												class="action-btn secondary"
											>
												Bulk Upsert
											</button>
									  `
									: ''}
								<!-- TEMPORARY: Bulk Status Edit -->
								<!-- <button
									id="bulk-status-edit-btn"
									class="action-btn secondary"
								>
									Bulk Status Edit
								</button> -->
							</div>
					  `
					: ''}

				<div class="list-grid-container">
					${items.length === 0
						? html` <p class="empty-state">No items yet</p> `
						: html`
								<div
									class="list-grid"
									style="grid-template-columns: ${gridTemplate}"
								>
									${showHeaders
										? html`
												<!-- Header row -->
												${visibleFields
													.map(
														(field) => html`
															<div
																class="grid-header ${field.type ===
																'text'
																	? 'text-column'
																	: ''}"
															>
																${field.displayName ||
																field.name}
															</div>
														`
													)
													.join('')}
												${schema.controls?.includes(
													'edit'
												) ||
												schema.controls?.includes(
													'delete'
												)
													? html`<div
															class="grid-header actions-header"
													  >
															Actions
													  </div>`
													: ''}
										  `
										: ''}

									<!-- Data rows -->
									${items
										.map(
											(item) => html`
												<div
													class="grid-row"
													data-row-id="${item.id}"
												>
													${visibleFields
														.map(
															(field) => html`
																<div
																	class="grid-cell ${field.name}-column"
																>
																	${field.type ===
																	'datetime'
																		? this.formatDate(
																				item[
																					field
																						.name
																				]
																		  )
																		: item[
																				field
																					.name
																		  ] ||
																		  ''}
																</div>
															`
														)
														.join('')}
													${schema.controls?.includes(
														'edit'
													) ||
													schema.controls?.includes(
														'delete'
													)
														? html`
																<div
																	class="grid-cell actions-cell"
																>
																	${schema.controls?.includes(
																		'edit'
																	)
																		? html`
																				<button
																					class="action-btn secondary edit-btn"
																					data-id="${item.id}"
																				>
																					Edit
																				</button>
																		  `
																		: ''}
																	${schema.controls?.includes(
																		'delete'
																	)
																		? html`
																				<button
																					class="action-btn danger delete-btn"
																					data-id="${item.id}"
																				>
																					Delete
																				</button>
																		  `
																		: ''}
																</div>
														  `
														: ''}
												</div>
											`
										)
										.join('')}
								</div>
						  `}
					${items.length > 0
						? html`
								<div class="list-count">
									<span class="count-text">
										${items.length}
										${items.length === 1 ? 'item' : 'items'}
									</span>
								</div>
						  `
						: ''}
				</div>
			</div>
		`;
	}
}
