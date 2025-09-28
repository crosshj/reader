import { BaseUIComponent } from './BaseUIComponent.js';
import { getState, subscribeToState } from '../framework.core.js';
import './XVizBar.css';

// Define x-viz-bar web component
export class XVizBar extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		const dataPath = this.getAttribute('data');
		if (!dataPath) {
			console.warn('x-viz-bar: no data attribute provided');
			return;
		}

		// Remove global_ prefix if present
		const actualPath = dataPath.startsWith('global_')
			? dataPath.substring(7)
			: dataPath;

		// Subscribe to data changes
		this.unsubscribe = subscribeToState(actualPath, (newData) => {
			this.updateChart(newData);
		});

		// Set initial data
		const initialData = getState(actualPath);
		this.updateChart(initialData);

		// Apply sx: styles
		this.applySxStyles();
	}

	updateChart(data) {
		if (!data || !Array.isArray(data)) {
			this.innerHTML = '<div class="viz-error">No data available</div>';
			return;
		}

		// Find max value for scaling
		const maxValue = Math.max(...data.map((item) => item.value || 0));

		// Create HTML bars
		let barsHTML = '';
		data.forEach((item, index) => {
			const barHeight = (item.value / maxValue) * 100; // Percentage height

			barsHTML += `
				<div class="viz-bar-container">
					<div 
						class="viz-bar" 
						style="height: ${barHeight}%"
					>
						<div class="viz-value">
							<x-typography variant="caption">${item.value}</x-typography>
						</div>
					</div>
					<div class="viz-label">
						<x-typography variant="caption">${item.label || ''}</x-typography>
					</div>
				</div>
			`;
		});

		this.innerHTML = `
			<div class="viz-wrapper">
				<div class="viz-chart">
					${barsHTML}
				</div>
			</div>
		`;
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}
