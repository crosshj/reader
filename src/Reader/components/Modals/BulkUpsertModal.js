import { html } from '../../../_lib/utils.js';
import './BulkUpsertModal.css';

export class BulkUpsertModal {
	constructor() {
		// Pure UI component - no controller knowledge
	}

	render() {
		return html`
			<div class="bulk-upsert-modal-overlay">
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
						></textarea>
					</div>
					<div class="modal-actions">
						<button
							id="cancel-bulk-upsert"
							class="btn btn-secondary"
						>
							Cancel
						</button>
						<button
							id="process-bulk-upsert"
							class="btn btn-primary"
						>
							Process Data
						</button>
					</div>
				</div>
			</div>
		`;
	}
}
