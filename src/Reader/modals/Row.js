import { html } from '../../_lib/utils.js';
import './Row.css';

export class RowModal {
	constructor(reader) {
		this.reader = reader;
	}

	show(itemId = null) {
		// Hide hamburger menu first
		this.reader.menu.hideHamburgerMenu();

		// Get the item to edit (either passed itemId or selected item)
		const selectedItem = itemId
			? this.reader.dataView.getItemById(itemId)
			: this.reader.controller.selectedRowId
			? this.reader.dataView.getItemById(this.reader.controller.selectedRowId)
			: null;

		// For add mode, we don't need an existing item
		const isAddMode = !itemId && !this.reader.controller.selectedRowId;

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
					${this.reader.currentSchema?.fields
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
									${this.generateFieldInput(field, selectedItem || {})}
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
		this.reader.container.appendChild(modal);

		// Show modal with animation
		requestAnimationFrame(() => {
			modal.style.opacity = '1';
			modal.style.visibility = 'visible';
		});
	}

	hide() {
		const modal = this.reader.container.querySelector(
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

	generateFieldInput(field, selectedItem) {
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
}
