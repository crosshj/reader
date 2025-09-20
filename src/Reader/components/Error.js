import { html } from '../../_lib/utils.js';
import './Error.css';

/**
 * Error component - returns appropriate HTML for different error states
 * @param {Object} options - Error configuration
 * @param {string} options.type - Error type: 'file', 'database', 'parsing', 'general'
 * @param {string} options.message - Error message to display
 * @param {string} options.action - Action that caused the error (e.g., 'opening', 'creating', 'saving')
 * @param {string} options.retryButtonId - ID for retry button (optional)
 * @param {string} options.backButtonId - ID for back button (optional)
 * @returns {string} HTML string for the error state
 */
export function renderError({ type = 'general', message, action, retryButtonId = 'retry-btn', backButtonId = 'back-btn' }) {
	const errorConfig = getErrorConfig(type, action);
	
	return html`
		<div class="error-modal-overlay" id="error-modal-overlay">
			<div class="error-modal" id="error-modal">
				<div class="modal-header">
					<h3>${errorConfig.title}</h3>
					<button class="close-btn" id="error-close-btn" title="Dismiss error">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
				<div class="modal-content">
					<div class="error-icon">
						${errorConfig.icon}
					</div>
					<p class="error-message">
						${errorConfig.messagePrefix}${message}
					</p>
				</div>
				<div class="modal-actions">
					<button
						id="error-dismiss-btn"
						class="btn btn-primary"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	`;
}

/**
 * Get error configuration based on type and action
 */
function getErrorConfig(type, action) {
	const configs = {
		file: {
			icon: html`
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
			`,
			title: 'File Error',
			messagePrefix: action ? `Error ${action} file: ` : 'Error with file: ',
			retryText: 'Try Again'
		},
		database: {
			icon: html`
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
			`,
			title: 'Database Error',
			messagePrefix: '',
			retryText: 'Try Again'
		},
		parsing: {
			icon: html`
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
			`,
			title: 'File Format Error',
			messagePrefix: 'Unable to parse file: ',
			retryText: 'Try Again'
		},
		general: {
			icon: html`
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
			`,
			title: 'Error',
			messagePrefix: '',
			retryText: 'Try Again'
		}
	};
	
	return configs[type] || configs.general;
}
