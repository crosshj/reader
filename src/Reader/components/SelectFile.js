import { html } from '../../_lib/utils.js';
import './SelectFile.css';

export class SelectFile {
	constructor() {
		// Pure UI component - no controller knowledge
	}

	render() {
		return html`
			<div class="select-file-container">
				<div class="select-file-content">
					<div class="select-file-icon">
						<svg
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<!-- Document icon for file selection -->
							<path
								d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
								fill="white"
								stroke="#666666"
								stroke-width="1.5"
							/>
							<!-- Folded corner -->
							<polyline
								points="14,2 14,8 20,8"
								stroke="#666666"
								stroke-width="1.5"
								fill="none"
							/>
							<!-- Document content lines -->
							<line
								x1="16"
								y1="13"
								x2="8"
								y2="13"
								stroke="#666666"
								stroke-width="1.5"
							/>
							<line
								x1="16"
								y1="17"
								x2="8"
								y2="17"
								stroke="#666666"
								stroke-width="1.5"
							/>
							<polyline
								points="10,9 9,9 8,9"
								stroke="#666666"
								stroke-width="1.5"
								fill="none"
							/>
						</svg>
					</div>
					<h2 class="select-file-title">Select File</h2>
					<p class="select-file-description">
						Choose a .smartText database file to open, or create a new one.
					</p>
					<div class="select-file-actions">
						<button
							id="open-file-btn"
							class="select-file-btn primary"
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
							</svg>
							Open Existing File
						</button>
						<button
							id="create-file-btn"
							class="select-file-btn secondary"
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
									x1="12"
									y1="5"
									x2="12"
									y2="19"
								></line>
								<line
									x1="5"
									y1="12"
									x2="19"
									y2="12"
								></line>
							</svg>
							Create New File
						</button>
					</div>
					<div class="select-file-features">
						<div class="feature">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"
								></path>
								<rect
									x="9"
									y="11"
									width="6"
									height="11"
								></rect>
								<path d="M9 7h6v4H9z"></path>
							</svg>
							<span>Dynamic UI Generation</span>
						</div>
						<div class="feature">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect
									x="2"
									y="3"
									width="20"
									height="14"
									rx="2"
									ry="2"
								></rect>
								<line
									x1="8"
									y1="21"
									x2="16"
									y2="21"
								></line>
								<line
									x1="12"
									y1="17"
									x2="12"
									y2="21"
								></line>
							</svg>
							<span>SQLite Database</span>
						</div>
						<div class="feature">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
								></path>
								<polyline
									points="3.27,6.96 12,12.01 20.73,6.96"
								></polyline>
								<line
									x1="12"
									y1="22.08"
									x2="12"
									y2="12"
								></line>
							</svg>
							<span>Schema-Driven</span>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}
