import { html } from '../../../_lib/utils.js';
import { renderError } from '../Error.js';
import './Error.css';

export class ErrorModal {
	constructor(reader) {
		this.reader = reader;
	}

	showDatabaseError(error) {
		// Show error as a modal overlay
		console.log('showDatabaseError called with:', error);
		const errorHTML = renderError({
			type: 'database',
			message: error,
			retryButtonId: 'retry-btn'
		});
		
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = errorHTML;
		const errorElement = tempDiv.firstElementChild;
		this.reader.container.appendChild(errorElement);
		
		// Add direct event listeners for the error modal
		const closeBtn = errorElement.querySelector('#error-close-btn');
		const dismissBtn = errorElement.querySelector('#error-dismiss-btn');
		
		if (closeBtn) {
			closeBtn.addEventListener('click', () => this.hide());
		}
		if (dismissBtn) {
			dismissBtn.addEventListener('click', () => this.hide());
		}
	}

	showFileError(errorMessage) {
		// Show file error in the files pane
		const filesContent = this.reader.container.querySelector('.files-content');
		if (filesContent) {
			filesContent.innerHTML = html`
				<div class="files-list">
					<div class="files-header">
						<h3>Files</h3>
						<button id="close-files-pane" class="close-files-btn">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
					<div class="files-splash">
					<div class="files-splash-content">
						<div class="files-splash-icon">
							<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="15" y1="9" x2="9" y2="15"></line>
								<line x1="9" y1="9" x2="15" y2="15"></line>
							</svg>
						</div>
						<h2 class="files-splash-title">Error</h2>
						<p class="files-splash-description">
							${errorMessage}
						</p>
						<div class="files-splash-actions">
							<button id="retry-files-btn" class="files-splash-btn primary">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="23,4 23,10 17,10"></polyline>
									<polyline points="1,20 1,14 7,14"></polyline>
									<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
								</svg>
								Try Again
							</button>
						</div>
					</div>
				</div>
				</div>
			`;
		}
	}

	hide() {
		// Simply remove the error modal overlay
		const errorOverlay = this.reader.container.querySelector('#error-modal-overlay');
		if (errorOverlay) {
			errorOverlay.remove();
		}
	}
}
