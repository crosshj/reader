import { html } from '../../_lib/utils.js';
import { List } from './List.js';
import './DataView.css';

export class DataView {
	constructor(reader) {
		// Pure UI component - just needs reader reference for List component
		this.reader = reader;
		this.list = new List(reader);
	}

	render(schema, state) {
		// Generate UI based on schema type
		let uiContent;
		if (schema.type === 'list') {
			uiContent = this.list.render(schema, state);
		} else {
			uiContent = html`<p>Unsupported schema type: ${schema.type}</p>`;
		}

		return html`
			<div class="data-view-container">
				<div class="data-view-content">
					${uiContent}
				</div>
			</div>
		`;
	}

	// Simple delegation methods - no state management
	selectRow(rowId) {
		const row = document.querySelector(`.grid-row[data-row-id="${rowId}"]`);
		if (row) {
			this.clearRowSelection();
			row.querySelectorAll('.grid-cell').forEach((cell) =>
				cell.classList.add('row-selected')
			);
		}
	}

	clearRowSelection() {
		document
			.querySelectorAll('.row-selected')
			.forEach((cell) => cell.classList.remove('row-selected'));
	}

	getItemById(itemId) {
		return this.list.getItemById(itemId);
	}
}
