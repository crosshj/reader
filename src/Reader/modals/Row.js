import { html } from '../../_lib/utils.js';
import './shared.css';
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
							(field, index) => html`
								${this.generateFieldInput(field, selectedItem || {}, index === 0)}
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
							Save
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

	// Form submission handler moved from Reader.js
	handleFormSubmit(form) {
		const formData = new FormData(form);
		const data = {};

		for (const [key, value] of formData.entries()) {
			data[key] = value;
		}

		const itemId = data.id;

		if (itemId) {
			delete data.id;
			this.reader.controller.dispatchUpdateData(data, itemId);
		} else {
			this.reader.controller.dispatchInsertData(data);
		}

		this.hide();
		this.reader.controller.selectedRowId = null;
		this.reader.header.hideSelectedEditButton();
	}



	generateFieldInput(field, selectedItem, isFirstField = false) {
		// Use the FormField web component instead of manual field generation
		const fieldValue = selectedItem[field.name] || '';
		
		return html`
			<form-field
				field='${JSON.stringify(field)}'
				value="${fieldValue}"
				mode="edit"
				data-field-name="${field.name}"
				${isFirstField ? 'autofocus' : ''}>
			</form-field>
		`;
	}
}
