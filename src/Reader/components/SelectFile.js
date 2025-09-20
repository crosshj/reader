import { html } from '../../_lib/utils.js';
import './SelectFile.css';

export class SelectFile {
	constructor() {
		// Pure UI component - no controller knowledge
	}

	render(files = [], folderName = '', currentFileName = '') {
		// Ensure files is always an array
		const safeFiles = Array.isArray(files) ? files : [];
		
		// Filter files to only show .smartText files and sort alphabetically
		const smartTextFiles = safeFiles
			.filter(file => file.name.toLowerCase().endsWith('.smarttext'))
			.sort((a, b) => a.name.localeCompare(b.name));
		
		
		return html`
			<div class="files-list">
				<div class="files-header">
					<div class="files-header-left">
						<button
							id="hamburger-menu"
							class="hamburger-btn search-hamburger"
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
									x1="3"
									y1="6"
									x2="21"
									y2="6"
								></line>
								<line
									x1="3"
									y1="12"
									x2="21"
									y2="12"
								></line>
								<line
									x1="3"
									y1="18"
									x2="21"
									y2="18"
								></line>
							</svg>
						</button>
						<h3 class="files-folder-name">${folderName || 'Database Files'}</h3>
					</div>
					<div class="files-header-actions">
						<button class="header-action-btn" id="create-file-btn" title="Create New File">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
								<polyline points="14,2 14,8 20,8"></polyline>
								<line x1="14" y1="12" x2="14" y2="20" stroke="currentColor" stroke-width="2"></line>
								<line x1="10" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2"></line>
							</svg>
						</button>
						<button class="header-action-btn" id="change-folder-btn" title="Choose Different Folder">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
								<line x1="14" y1="10" x2="14" y2="18" stroke="currentColor" stroke-width="2"></line>
								<line x1="10" y1="14" x2="18" y2="14" stroke="currentColor" stroke-width="2"></line>
							</svg>
						</button>
					</div>
				</div>
				<div class="files-grid">
					${smartTextFiles.map(file => {
						const isCurrentFile = file.name === currentFileName;
						return html`
							<div class="file-item ${isCurrentFile ? 'current-file' : ''}" data-file-name="${file.name}">
								<div class="file-icon">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14,2 14,8 20,8"></polyline>
									</svg>
								</div>
								<div class="file-name">${file.name}</div>
								<div class="file-size">${this.formatFileSize(file.size)}</div>
								${isCurrentFile ? html`<div class="current-indicator">●</div>` : ''}
							</div>
						`;
					}).join('')}
				</div>
			</div>
		`;
	}

	formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}
