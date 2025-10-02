import { BaseUIComponent } from './BaseUIComponent.js';
import { getState } from '../framework.core.js';

// Define x-map web component
export class XMap extends BaseUIComponent {
	constructor() {
		super();
		// Add instance tracking for debugging
		if (!XMap.instanceCount) {
			XMap.instanceCount = 0;
		}
		XMap.instanceCount++;
		this.instanceId = XMap.instanceCount;
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles and subscriptions
		super.connectedCallback();
		
		const items = this.getAttribute('items');

		// Check if already processed to prevent multiple renders
		if (this.hasAttribute('data-processed')) {
			return;
		}

		// Mark as processed
		this.setAttribute('data-processed', 'true');

		// Hide the initial children (they are the template)
		this.style.display = 'none';

		// Store the template for later use
		this.template = this.innerHTML;

		// Clear the initial content since it's just a template
		this.innerHTML = '';

		// Process the data if available
		this.processData(items);
	}

	handleStateChange(newState) {
		// Call parent method first
		super.handleStateChange(newState);
		
		// Re-process data when state changes
		const items = this.getAttribute('items');
		if (items) {
			this.processData(items);
		}
	}

	processData(dataPath) {
		if (!dataPath) {
			console.warn(`x-map #${this.instanceId}: no items attribute provided`);
			return;
		}

		// Get the data from state (BaseUIComponent provides this)
		let actualPath = dataPath;
		if (dataPath.startsWith('global_')) {
			actualPath = dataPath.substring(7); // Remove 'global_' prefix
		}

		const data = getState(actualPath);

		if (!data) {
			console.warn(
				`x-map #${this.instanceId}: data not found for path: ${dataPath} (tried: ${actualPath})`
			);
			return;
		}

		if (!Array.isArray(data)) {
			console.warn(
				`x-map #${this.instanceId}: data is not an array: ${dataPath}`
			);
			return;
		}

		// Clear any previous content (idempotent behavior)
		this.innerHTML = '';

		// Create actual web component instances instead of HTML strings
		data.forEach((item, index) => {
			const processedTemplate = this.processTemplate(
				this.template,
				item,
				index
			);

			// Create a temporary container to parse the HTML
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = processedTemplate;

			// Move all child nodes to the x-map element
			while (tempDiv.firstChild) {
				this.appendChild(tempDiv.firstChild);
			}
		});

		// Show the component now that it has content
		this.style.removeProperty('display');
	}

	processTemplate(template, item, index) {
		let processedTemplate = template;

		// Replace template variables with item data
		// Handle {{item_property}} and {{ item_property }} syntax (with or without spaces)
		processedTemplate = processedTemplate.replace(
			/\{\{\s*item_([^}]+)\s*\}\}/g,
			(match, property) => {
				// Trim any whitespace from the property name
				const cleanProperty = property.trim();
				const value = item[cleanProperty] || '';
				return value;
			}
		);

		// Handle {{index}} for array index
		processedTemplate = processedTemplate.replace(/\{\{index\}\}/g, index);

		// Process {{#if}} conditionals
		processedTemplate = processedTemplate.replace(
			/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
			(match, condition, content) => {
				// Evaluate the condition
				const conditionValue = this.evaluateCondition(condition.trim(), item);
				return conditionValue ? content : '';
			}
		);

		// Process {{#each}} loops
		processedTemplate = processedTemplate.replace(
			/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
			(match, arrayProperty, content) => {
				const property = arrayProperty.trim();
				let arrayValue;

				// Handle item_property syntax
				if (property.startsWith('item_')) {
					const prop = property.substring(5);
					arrayValue = item[prop];
				} else {
					arrayValue = item[property];
				}

				if (!Array.isArray(arrayValue)) {
					return '';
				}

				// Process each item in the array
				return arrayValue
					.map((arrayItem, index) => {
						// Replace {{ this }} with the current array item
						let processedContent = content.replace(
							/\{\{\s*this\s*\}\}/g,
							arrayItem
						);
						// Process any other template variables in the content
						return this.processTemplate(processedContent, arrayItem, index);
					})
					.join('');
			}
		);

		// Process conditional classes after template variables are replaced
		// This is handled by BaseUIComponent's conditional attribute processing
		// but we need to process it here since we're creating HTML strings
		processedTemplate = processedTemplate.replace(
			/class="WHEN\s+(.+?)\s+IS\s+(.+?)\s+THEN\s+(.+?)\s+ELSE\s+(.+?)"/g,
			(match, leftSide, rightSide, thenValue, elseValue) => {
				// Use the current state from BaseUIComponent
				const state = this.initialState || {};

				// Evaluate the comparison
				const leftValue = leftSide.trim().startsWith('global_')
					? state[leftSide.trim().substring(7)]
					: leftSide.trim();

				let rightValue = rightSide.trim();

				const result = leftValue === rightValue;
				// Strip quotes from the values and use the result
				const cleanThenValue = thenValue.replace(/^['"]|['"]$/g, '');
				const cleanElseValue = elseValue.replace(/^['"]|['"]$/g, '');
				const className = result ? cleanThenValue : cleanElseValue;

				return `class="${className}"`;
			}
		);

		return processedTemplate;
	}

	evaluateCondition(condition, item) {
		// Handle simple property checks like "item_listItems"
		if (condition.startsWith('item_')) {
			const property = condition.substring(5); // Remove "item_" prefix
			const value = item[property];

			// Check if it's truthy (exists and not empty)
			if (Array.isArray(value)) {
				return value.length > 0;
			}
			return !!value;
		}

		// Handle direct property checks
		const value = item[condition];
		if (Array.isArray(value)) {
			return value.length > 0;
		}
		return !!value;
	}
}
