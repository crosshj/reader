import { html } from '../../_lib/utils.js';
import './shared.css';
import './BulkUpsert.css';

export class BulkUpsertModal {
	constructor(reader) {
		this.reader = reader;
	}

	show() {
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
					<form-field
						field='{"name": "bulk-upsert-data", "type": "textarea", "displayName": "Bulk Data", "placeholder": "Paste your data here...", "rows": 15}'
						value=""
						mode="edit">
					</form-field>
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

		// Add modal to DOM
		this.reader.container.appendChild(modal);

		// Add event listeners
		modal
			.querySelector('#close-bulk-upsert-modal')
			.addEventListener('click', () => {
				this.hide();
			});

		modal
			.querySelector('#cancel-bulk-upsert')
			.addEventListener('click', () => {
				this.hide();
			});

		modal
			.querySelector('#process-bulk-upsert')
			.addEventListener('click', () => {
				this.processBulkUpsert();
			});
	}

	hide() {
		const modal = this.reader.container.querySelector(
			'.bulk-upsert-modal-overlay'
		);
		if (modal) {
			modal.remove();
		}
	}

	processBulkUpsert() {
		const formField = this.reader.container.querySelector('form-field');
		const textarea = formField?.querySelector('textarea');
		const data = textarea?.value?.trim();

		if (!data) {
			alert('Please enter some data to process.');
			return;
		}

		// Parse the data using the same format as Reader.js
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
		this.reader.controller.dispatchBulkUpsert(items);
		this.hide();
	}
}
