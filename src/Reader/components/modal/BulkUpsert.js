import { html } from '../../../_lib/utils.js';
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
		const textarea = this.reader.container.querySelector('#bulk-upsert-data');
		const data = textarea.value.trim();

		if (!data) {
			alert('Please enter some data to process.');
			return;
		}

		// Parse the data
		const lines = data.split('\n').filter(line => line.trim());
		const items = [];

		for (const line of lines) {
			const parts = line.split(' - ');
			if (parts.length >= 2) {
				const id = parts[0].trim();
				const name = parts[1].trim();
				if (id && name) {
					items.push({ id, name });
				}
			}
		}

		if (items.length === 0) {
			alert('No valid data found. Please check your format.');
			return;
		}

		// Dispatch the bulk upsert event
		this.reader.controller.dispatchBulkUpsert(items);
		this.hide();
	}
}
