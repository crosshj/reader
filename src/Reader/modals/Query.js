import { html } from '../../_lib/utils.js';
import './shared.css';
import './Query.css';

export class QueryModal {
	constructor(reader) {
		this.reader = reader;
	}

	show() {
		// Hide hamburger menu first
		this.reader.menu.hideHamburgerMenu();

		// Create modal overlay
		const modal = document.createElement('div');
		modal.className = 'query-modal-overlay';
		modal.innerHTML = html`
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
					<form-field
						field='{"name": "query", "type": "textarea", "displayName": "SQL Query", "placeholder": "Enter your SQL query here...", "rows": 10}'
						value="SELECT 
    status,
    COUNT(*) as count
FROM items 
GROUP BY status;"
						mode="edit">
					</form-field>
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
		const modal = this.reader.container.querySelector('.query-modal-overlay');
		if (modal) {
			modal.style.opacity = '0';
			modal.style.visibility = 'hidden';
			setTimeout(() => {
				modal.remove();
			}, 300);
		}
	}
}
