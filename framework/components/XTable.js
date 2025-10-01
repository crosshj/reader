import { BaseUIComponent } from './BaseUIComponent.js';
import { getState, subscribeToState } from '../framework.core.js';

// Define x-table web component
export class XTable extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		// Check if this is a data-driven table
		const dataPath = this.getAttribute('data');

		if (dataPath) {
			this.renderHybridTable(dataPath);
		} else {
			this.renderInlineTable();
		}

		// Apply sx: styles if any
		this.applySxStyles();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	renderInlineTable() {
		// Get content from the content attribute or fallback to innerHTML
		let content = this.getAttribute('content') || this.innerHTML;

		// If content came from attribute, decode the escaped characters
		if (this.getAttribute('content')) {
			content = content
				.replace(/&quot;/g, '"')
				.replace(/'/g, '&#39;')
				.replace(/&#10;/g, '\n')
				.replace(/&#13;/g, '\r')
				.replace(/&#9;/g, '\t');
		}

		if (!content.trim()) {
			this.innerHTML = '';
			return;
		}

		// Create a real table element to ensure proper thead/tbody instantiation
		const table = document.createElement('table');
		table.innerHTML = content;
		this.appendChild(table);

		// Clear the content attribute after processing
		if (this.getAttribute('content')) {
			this.removeAttribute('content');
		}
	}

	renderHybridTable(dataPath) {
		// Get content from the content attribute or fallback to innerHTML
		let content = this.getAttribute('content') || this.innerHTML;

		// If content came from attribute, decode the escaped characters
		if (this.getAttribute('content')) {
			content = content
				.replace(/&quot;/g, '"')
				.replace(/'/g, '&#39;')
				.replace(/&#10;/g, '\n')
				.replace(/&#13;/g, '\r')
				.replace(/&#9;/g, '\t');
		}

		if (!content.trim()) {
			this.innerHTML = '';
			return;
		}

		// Store the template for data binding
		this.template = content;

		// Create the initial table structure
		const table = document.createElement('table');
		table.innerHTML = content;
		this.appendChild(table);

		// Clear the content attribute after processing
		if (this.getAttribute('content')) {
			this.removeAttribute('content');
		}

		// Process the data with a small delay to ensure data is registered
		setTimeout(() => {
			this.updateTableBody(dataPath);
		}, 10);

		// Subscribe to state changes to re-render
		this.unsubscribe = subscribeToState(dataPath, () => {
			this.updateTableBody(dataPath);
		});
	}

	updateTableBody(dataPath) {
		if (!dataPath) {
			console.warn('x-table: no data attribute provided');
			return;
		}

		// Get the data from global state
		let data = null;
		let actualPath = dataPath;

		// Remove global_ prefix if present
		if (dataPath.startsWith('global_')) {
			actualPath = dataPath.substring(7);
		}

		// Try to get data from the centralized state management
		data = getState(actualPath);

		// Fallback to old method for backward compatibility
		if (!data && window.state && window.state[actualPath]) {
			data = window.state[actualPath];
		} else if (!data && window[actualPath]) {
			data = window[actualPath];
		}

		if (!data) {
			console.warn(`x-table: data not found for path: ${dataPath}`);
			return;
		}

		if (!Array.isArray(data)) {
			console.warn(`x-table: data is not an array: ${dataPath}`);
			return;
		}

		// Find the table element and tbody
		const table = this.querySelector('table');
		if (!table) {
			console.warn('x-table: no table element found');
			return;
		}

		let tbody = table.querySelector('tbody');
		if (!tbody) {
			// Create tbody if it doesn't exist
			tbody = document.createElement('tbody');
			table.appendChild(tbody);
		}

		// Generate tbody rows from data
		const tbodyRows = this.generateTableRows(data);
		tbody.innerHTML = tbodyRows;
	}

	generateTableRows(data) {
		// Find the thead to extract property mappings
		const table = this.querySelector('table');
		const thead = table.querySelector('thead');

		if (!thead) {
			console.warn('x-table: no thead found for property mapping');
			return '';
		}

		// Extract property mappings from th elements
		const thElements = thead.querySelectorAll('th[property]');
		const properties = Array.from(thElements).map((th) =>
			th.getAttribute('property')
		);

		if (properties.length === 0) {
			console.warn('x-table: no property attributes found in thead');
			return '';
		}

		// Generate tbody rows from data
		return data
			.map((item, index) => {
				const tds = properties
					.map((prop) => `<td>${item[prop] || ''}</td>`)
					.join('');
				return `<tr>${tds}</tr>`;
			})
			.join('');
	}

	processTemplate(template, data) {
		let processedTemplate = template;

		// Find the thead and tbody sections
		const theadMatch = processedTemplate.match(/<thead>([\s\S]*?)<\/thead>/);
		const tbodyMatch = processedTemplate.match(/<tbody>([\s\S]*?)<\/tbody>/);

		if (!theadMatch || !tbodyMatch) {
			console.warn(
				'x-table: template must contain both <thead> and <tbody> sections'
			);
			return processedTemplate;
		}

		const theadContent = theadMatch[1];
		const tbodyTemplate = tbodyMatch[1];

		// Extract property mappings from th elements
		const thMatches = theadContent.matchAll(
			/<th[^>]*property="([^"]*)"[^>]*>([^<]*)<\/th>/g
		);
		const properties = [];
		for (const match of thMatches) {
			properties.push(match[1]);
		}

		// Generate tbody rows from data
		const tbodyRows = data
			.map((item, index) => {
				let row = tbodyTemplate;

				// Replace {{item_property}} with actual values
				row = row.replace(/\{\{\s*item_([^}]+)\s*\}\}/g, (match, property) => {
					const value = item[property] || '';
					return value;
				});

				// Replace {{index}} with array index
				row = row.replace(/\{\{index\}\}/g, index);

				// If no template variables, auto-generate tds based on properties
				if (!row.includes('{{') && !row.includes('<td>')) {
					const tds = properties
						.map((prop) => `<td>${item[prop] || ''}</td>`)
						.join('');
					row = `<tr>${tds}</tr>`;
				}

				return row;
			})
			.join('');

		// Replace the tbody content
		processedTemplate = processedTemplate.replace(
			/<tbody>[\s\S]*?<\/tbody>/,
			`<tbody>${tbodyRows}</tbody>`
		);

		return processedTemplate;
	}
}
