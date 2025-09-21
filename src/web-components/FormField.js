import { html } from '../_lib/utils.js';
import './FormField.css';

export class FormField extends HTMLElement {
	static get observedAttributes() {
		return ['field', 'value', 'mode', 'disabled', 'autofocus'];
	}

	constructor() {
		super();
		this.field = null;
		this.value = '';
		this.mode = 'edit';
		this.disabled = false;
		this.autofocus = false;
	}

	connectedCallback() {
		this.render();
		// No event binding - controller will handle events via delegation
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			switch (name) {
				case 'field':
					this.field = newValue ? JSON.parse(newValue) : null;
					break;
				case 'value':
					this.value = newValue || '';
					break;
				case 'mode':
					this.mode = newValue || 'edit';
					break;
				case 'disabled':
					this.disabled = newValue !== null;
					break;
				case 'autofocus':
					this.autofocus = newValue !== null;
					break;
			}
			this.render();
		}
	}

	render() {
		if (!this.field) return;

		const fieldHTML = this.generateFieldHTML();
		this.innerHTML = fieldHTML;
	}

	generateFieldHTML() {
		const { field, value, disabled, autofocus } = this;
		const inputId = `field-${field.name}`;

		switch (field.type) {
			case 'text':
				return html`
					<div class="form-field">
						<label for="${inputId}">${field.displayName || field.name}</label>
						<input
							type="text"
							id="${inputId}"
							name="${field.name}"
							value="${value || ''}"
							placeholder="${field.placeholder || ''}"
							spellcheck="false"
							${disabled ? 'disabled' : ''}
							${autofocus ? 'autofocus' : ''}
						/>
						${field.helpText ? html`<small class="form-field-help">${field.helpText}</small>` : ''}
					</div>
				`;

			case 'enum':
				const options = field.options || [];
				return html`
					<div class="form-field">
						<label for="${inputId}">${field.displayName || field.name}</label>
						<div class="select-wrapper">
							<select id="${inputId}" name="${field.name}" ${disabled ? 'disabled' : ''} ${autofocus ? 'autofocus' : ''}>
								<option value="">Select ${field.displayName || field.name}...</option>
								${options.map(option => html`
									<option value="${option}" ${value === option ? 'selected' : ''}>
										${option}
									</option>
								`).join('')}
							</select>
							<svg class="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="6,9 12,15 18,9"></polyline>
							</svg>
						</div>
						${field.helpText ? html`<small class="form-field-help">${field.helpText}</small>` : ''}
					</div>
				`;

			case 'datetime':
				if (this.mode === 'display') {
					// Display mode - show formatted date as text
					const formattedDate = this.formatDate(value);
					return html`
						<div class="form-field">
							<label for="${inputId}">${field.displayName || field.name}</label>
							<span class="form-field-display">${formattedDate}</span>
						</div>
					`;
				} else {
					// Edit mode - show datetime input
					const dateValue = value ? new Date(value).toISOString().slice(0, 16) : '';
					return html`
						<div class="form-field">
							<label for="${inputId}">${field.displayName || field.name}</label>
							<input
								type="datetime-local"
								id="${inputId}"
								name="${field.name}"
								value="${dateValue}"
								${disabled ? 'disabled' : ''}
								${autofocus ? 'autofocus' : ''}
							/>
						</div>
					`;
				}

			case 'number':
				return html`
					<div class="form-field">
						<label for="${inputId}">${field.displayName || field.name}</label>
						<input
							type="number"
							id="${inputId}"
							name="${field.name}"
							value="${value}"
							placeholder="${field.placeholder || ''}"
							${field.min !== undefined ? `min="${field.min}"` : ''}
							${field.max !== undefined ? `max="${field.max}"` : ''}
							${disabled ? 'disabled' : ''}
							${autofocus ? 'autofocus' : ''}
						/>
					</div>
				`;

			case 'boolean':
				// Handle both boolean and string boolean values
				const isChecked = value === true || value === 'true';
				return html`
					<label class="control-option">
						<input
							type="checkbox"
							id="${inputId}"
							name="${field.name}"
							${isChecked ? 'checked' : ''}
							${disabled ? 'disabled' : ''}
						/>
						${field.displayName || field.name}
					</label>
				`;

			case 'textarea':
				return html`
					<div class="form-field">
						<label for="${inputId}">${field.displayName || field.name}</label>
						<textarea
							id="${inputId}"
							name="${field.name}"
							placeholder="${field.placeholder || ''}"
							rows="${field.rows || 3}"
							spellcheck="false"
							${disabled ? 'disabled' : ''}
							${autofocus ? 'autofocus' : ''}
						>${value || ''}</textarea>
						${field.helpText ? html`<small class="form-field-help">${field.helpText}</small>` : ''}
					</div>
				`;

			default:
				return html`
					<div class="form-field">
						<label for="${inputId}">${field.displayName || field.name}</label>
						<input
							type="text"
							id="${inputId}"
							name="${field.name}"
							value="${value || ''}"
							placeholder="${field.placeholder || ''}"
							spellcheck="false"
							${disabled ? 'disabled' : ''}
							${autofocus ? 'autofocus' : ''}
						/>
						${field.helpText ? html`<small class="form-field-help">${field.helpText}</small>` : ''}
					</div>
				`;
		}
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
}
