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
		<div class="error-container">
			<div class="error-icon">
				${errorConfig.icon}
			</div>
			<h3 class="error-title">${errorConfig.title}</h3>
			<p class="error-message">
				${errorConfig.messagePrefix}${message}
			</p>
			<div class="error-actions">
				<button
					id="${retryButtonId}"
					class="error-btn primary"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="23,4 23,10 17,10"></polyline>
						<polyline points="1,20 1,14 7,14"></polyline>
						<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
					</svg>
					${errorConfig.retryText}
				</button>
				${backButtonId ? html`
					<button
						id="${backButtonId}"
						class="error-btn secondary"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M19 12H5"></path>
							<path d="M12 19l-7-7 7-7"></path>
						</svg>
						Back to Home
					</button>
				` : ''}
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
