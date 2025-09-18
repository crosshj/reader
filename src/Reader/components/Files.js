import { html } from '../../_lib/utils.js';
import './Files.css';
import { FolderService } from '../../_lib/folderService.js';

export class Files {
	constructor(reader) {
		this.reader = reader;
		this.folderService = new FolderService();
	}

	render() {
		return html`
			<div class="files-content">
				<button id="close-files-pane" class="close-files-btn">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
		`;
	}

	async onActivate() {
		alert('DEBUG: onActivate called');
		// Show loading spinner
		this.showLoading();

		alert('DEBUG: About to call folderService.getFiles()');
		// Try to get files from selected folder
		const { files, error } = await this.folderService.getFiles();
		alert(`DEBUG: getFiles returned - files: ${files ? files.length : 'null'}, error: ${error}`);

		if (error && error === 'no folder selected') {
			alert('DEBUG: No folder selected, showing no files dialog');
			this.showNoFilesDialog();
			return;
		}
		if (error) {
			alert(`DEBUG: Error getting files, showing error dialog: ${error}`);
			this.showErrorDialog(error);
			return;
		}

		alert(`DEBUG: Success! Showing ${files.length} files`);
		this.showFilesList(files);
	}

	showLoading() {
		const filesContent = this.reader.container.querySelector('.files-content');
		if (filesContent) {
			filesContent.innerHTML = html`
				<button id="close-files-pane" class="close-files-btn">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
				<div class="files-loading">
					<div class="loading-spinner"></div>
				</div>
			`;
		}
	}

	showFilesList(files) {
		const filesContent = this.reader.container.querySelector('.files-content');
		if (filesContent) {
			filesContent.innerHTML = html`
				<button id="close-files-pane" class="close-files-btn">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
				<div class="files-list">
					<div class="files-header">
						<h3>Files</h3>
					</div>
					<div class="files-grid">
						${files.map(file => html`
							<div class="file-item" data-file-name="${file.name}">
								<div class="file-icon">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14,2 14,8 20,8"></polyline>
									</svg>
								</div>
								<div class="file-name">${file.name}</div>
								<div class="file-size">${this.folderService.formatFileSize(file.size)}</div>
							</div>
						`).join('')}
						<div class="file-item create-file-item" id="create-file-btn">
							<div class="file-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<line x1="12" y1="5" x2="12" y2="19"></line>
									<line x1="5" y1="12" x2="19" y2="12"></line>
								</svg>
							</div>
							<div class="file-name">Create New File</div>
							<div class="file-size">Click to add</div>
						</div>
					</div>
					<div class="files-footer">
						<button id="select-new-folder-btn" class="choose-folder-link">
							Choose another folder
						</button>
					</div>
				</div>
			`;
		}
	}

	showNoFilesDialog() {
		const filesContent = this.reader.container.querySelector('.files-content');
		if (filesContent) {
			filesContent.innerHTML = html`
				<button id="close-files-pane" class="close-files-btn">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
				<div class="files-splash">
					<div class="files-splash-content">
						<div class="files-splash-icon">
							<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
								<polyline points="14,2 14,8 20,8"></polyline>
								<line x1="16" y1="13" x2="8" y2="13"></line>
								<line x1="16" y1="17" x2="8" y2="17"></line>
							</svg>
						</div>
						<h2 class="files-splash-title">Select Folder</h2>
						<p class="files-splash-description">
							Please select a folder to browse for .smartText files.
						</p>
						<div class="files-splash-actions">
							<button id="select-folder-btn" class="files-splash-btn primary">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
								</svg>
								Select Folder
							</button>
						</div>
					</div>
				</div>
			`;
		}
	}


	showErrorDialog(errorMessage) {
		const filesContent = this.reader.container.querySelector('.files-content');
		if (filesContent) {
			filesContent.innerHTML = html`
				<button id="close-files-pane" class="close-files-btn">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
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
			`;
		}
	}

	/**
	 * Handle select folder button click
	 */
	async handleSelectFolder() {
		alert('DEBUG: Starting folder selection...');
		const { success, error } = await this.folderService.selectFolder();
		alert(`DEBUG: Folder selection result - success: ${success}, error: ${error}`);
		
		if (success) {
			alert('DEBUG: Folder selection successful, calling onActivate...');
			// Refresh the files list after folder selection
			await this.onActivate();
		} else {
			alert(`DEBUG: Folder selection failed: ${error}`);
			// Show error dialog
			this.showErrorDialog(error);
		}
	}

	/**
	 * Handle retry files button click
	 */
	handleRetryFiles() {
		// Retry loading files
		this.onActivate();
	}

	/**
	 * Handle create file button click
	 */
	async handleCreateFile() {
		// Prompt for file name
		const fileName = prompt('Enter file name (without extension):');
		if (!fileName || fileName.trim() === '') {
			return;
		}

		// Add .smartText extension
		const fullFileName = fileName.trim() + '.smartText';

		try {
			// Create the file with sample content
			await this.folderService.writeFile(fullFileName, 'sample text file contents');
			
			// Refresh the file list
			await this.onActivate();
		} catch (error) {
			console.error('Error creating file:', error);
			alert(`Failed to create file: ${error.message}`);
		}
	}
}
