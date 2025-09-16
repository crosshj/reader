import { html } from '../../_lib/utils.js';

export class Menu {
	constructor(reader) {
		this.reader = reader;
	}

	render() {
		return html`
			<div class="sidebar-overlay">
				<div class="sidebar-menu">
					${this.generateSidebarContent()}
				</div>
			</div>
		`;
	}

	toggleHamburgerMenu() {
		const overlay = this.reader.container.querySelector('.sidebar-overlay');
		if (overlay) {
			overlay.classList.toggle('show');
		}
	}

	hideHamburgerMenu() {
		const overlay = this.reader.container.querySelector('.sidebar-overlay');
		if (overlay) {
			overlay.classList.remove('show');
		}
	}

	refreshSidebarContent() {
		const sidebar = this.reader.container.querySelector('.sidebar-menu');
		if (sidebar) {
			sidebar.innerHTML = this.generateSidebarContent();
		}
	}

	showDatabaseActions() {
		// Show database-specific menu items when a database is loaded
		this.refreshSidebarContent();
	}

	hideDatabaseActions() {
		// Hide database-specific menu items when no database is loaded
		this.refreshSidebarContent();
	}

	generateSidebarContent() {
		const hasDatabase = this.reader.currentSchema && this.reader.currentState;

		return html`
			<div class="sidebar-header">
				<!-- <button
					id="close-sidebar"
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
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button> -->
			</div>
			<div class="sidebar-content">
				<button
					id="menu-open-file"
					class="menu-item"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
						></path>
						<polyline points="14,2 14,8 20,8"></polyline>
						<line x1="16" y1="13" x2="8" y2="13"></line>
						<line x1="16" y1="17" x2="8" y2="17"></line>
						<polyline points="10,9 9,9 8,9"></polyline>
					</svg>
					<span>Open Database</span>
				</button>
				<button
					id="menu-create-file"
					class="menu-item"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
						></path>
						<polyline points="14,2 14,8 20,8"></polyline>
						<line x1="16" y1="13" x2="8" y2="13"></line>
						<line x1="16" y1="17" x2="8" y2="17"></line>
						<polyline points="10,9 9,9 8,9"></polyline>
					</svg>
					<span>Create Database</span>
				</button>
				${hasDatabase
					? html`
							<button
								id="menu-edit-metadata"
								class="menu-item"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
									></path>
									<path
										d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
									></path>
								</svg>
								<span>Edit Database Info</span>
							</button>
							<button
								id="menu-execute-query"
								class="menu-item"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10"></circle>
									<polyline points="12,6 12,12 16,14"></polyline>
								</svg>
								<span>Execute Query</span>
							</button>
							<button
								id="menu-save-file"
								class="menu-item"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
									></path>
									<polyline points="17,21 17,13 7,13 7,21"></polyline>
									<polyline points="7,3 7,8 15,8"></polyline>
								</svg>
								<span>Save File</span>
							</button>
							<button
								id="menu-close-file"
								class="menu-item"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="18" y1="6" x2="6" y2="18"></line>
									<line x1="6" y1="6" x2="18" y2="18"></line>
								</svg>
								<span>Close File</span>
							</button>
					  `
					: ''}
			</div>
		`;
	}
}
