import { html } from '../../../_lib/utils.js';
import './QueryModal.css';

export class QueryModal {
	constructor() {
		// Pure UI component - no controller knowledge
	}

	render() {
		return html`
			<div class="query-modal-overlay">
				<div class="query-modal">
					<div class="modal-header">
						<h3>Execute Query</h3>
						<button
							id="close-query-modal"
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
					<div class="modal-content">
						<div class="form-field">
							<label for="query-textarea">SQL Query</label>
							<textarea
								id="query-textarea"
								placeholder="Enter your SQL query here..."
								rows="10"
							></textarea>
						</div>
					</div>
					<div class="modal-actions">
						<button
							id="cancel-query"
							class="btn btn-secondary"
						>
							Cancel
						</button>
						<button
							id="execute-query"
							class="btn btn-primary"
						>
							Execute
						</button>
					</div>
				</div>
			</div>
		`;
	}
}
