import { html } from '../../_lib/utils.js';
import './List.css';

export class List {
	constructor(reader) {
		this.reader = reader;
	}

	getFilteredItems() {
		if (!this.reader.currentState || !this.reader.currentSchema) return [];

		const tableName = this.reader.currentSchema.tableName || 'items';
		let items = this.reader.currentState[tableName] || [];

		// Apply enum filters
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

		// Apply search filter
		const searchQuery = this.reader.header.getSearchQuery();
		if (searchQuery && searchQuery.trim()) {
			const searchTerm = searchQuery.toLowerCase().trim();
			items = items.filter((item) => {
				// Search across all text fields
				return this.reader.currentSchema.fields?.some((field) => {
					if (field.type === 'text' || field.type === 'string') {
						const value = item[field.name];
						return value && value.toString().toLowerCase().includes(searchTerm);
					}
					return false;
				});
			});
		}

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

	updateSearchFilter() {
		// Re-render only the data view to show current filtered results (enum + search filters)
		if (this.reader.currentSchema && this.reader.currentState) {
			const uiContent = this.reader.dataView.render(this.reader.currentSchema, this.reader.currentState);
			const content = this.reader.container.querySelector('.reader-content');
			if (content) {
				content.innerHTML = uiContent;
			}
		}
	}


	rowMatchesSearch(rowId, searchTerm) {
		// Find the actual item data for this row
		const item = this.getItemById(rowId);
		if (!item) return false;
		
		// Search across all text/string fields in the actual data
		const schema = this.reader.currentSchema;
		const searchableFields = schema.fields?.filter(
			(field) => field.type === 'text' || field.type === 'string'
		) || [];
		
		return searchableFields.some(field => {
			const value = item[field.name];
			return value && value.toString().toLowerCase().includes(searchTerm);
		});
	}

	updateResultsMessage(searchTerm, visibleCount, totalCount) {
		let resultsMsg = this.reader.container.querySelector('.search-results-message');
		
		if (searchTerm) {
			if (!resultsMsg) {
				// Create the results message container
				resultsMsg = document.createElement('div');
				resultsMsg.className = 'search-results-message';
				
				// Insert after the grid container
				const gridContainer = this.reader.container.querySelector('.list-ui .list-grid-container');
				if (gridContainer) {
					gridContainer.parentNode.insertBefore(resultsMsg, gridContainer.nextSibling);
				}
			}
			
			// Update message content based on results
			if (visibleCount === 0) {
				resultsMsg.innerHTML = html`
					<div class="search-results-content has-results">
						<span class="results-text">No results found</span>
					</div>
				`;
			} else {
				resultsMsg.innerHTML = html`
					<div class="search-results-content has-results">
						<span class="results-text">
							${visibleCount} of ${totalCount} ${totalCount === 1 ? 'item' : 'items'} found
						</span>
					</div>
				`;
			}
			
			resultsMsg.style.display = 'block';
		} else if (resultsMsg) {
			resultsMsg.style.display = 'none';
		}
	}

	updateItemCount(searchTerm, visibleCount, totalCount) {
		// Hide the old item count when searching, show it when not searching
		const oldCount = this.reader.container.querySelector('.list-count');
		if (oldCount) {
			oldCount.style.display = searchTerm ? 'none' : 'flex';
		}
	}

	render(schema, state) {
		const tableName = schema.tableName || 'items';
		const allItems = state?.[tableName] || [];
		// Use the original filtered items method that was working
		const items = this.getFilteredItems();
		
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
		const hasBulkUpsertControl =
			schema.controls?.includes('bulk-upsert') && items.length > 0;
		const hasAnyControls = hasBulkUpsertControl;

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
						? html` <p class="empty-state">No items</p> `
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
																				<span
																					class="action-icon edit-icon"
																					data-id="${item.id}"
																					title="Edit item"
																				>
																					<span class="action-icon-bg"></span>
																					<svg
																						width="16"
																						height="16"
																						viewBox="0 0 24 24"
																						fill="none"
																						stroke="currentColor"
																						stroke-width="2"
																					>
																						<path
																							d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
																						></path>
																						<path
																							d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
																						></path>
																					</svg>
																				</span>
																			`
																		: ''}
																	${schema.controls?.includes(
																		'delete'
																	)
																		? html`
																				<span
																					class="action-icon delete-icon"
																					data-id="${item.id}"
																					title="Delete item"
																				>
																					<span class="action-icon-bg"></span>
																					<svg
																						width="16"
																						height="16"
																						viewBox="0 0 24 24"
																						fill="none"
																						stroke="currentColor"
																						stroke-width="2"
																					>
																						<polyline points="3,6 5,6 21,6"></polyline>
																						<path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
																						<line x1="10" y1="11" x2="10" y2="17"></line>
																						<line x1="14" y1="11" x2="14" y2="17"></line>
																					</svg>
																				</span>
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
