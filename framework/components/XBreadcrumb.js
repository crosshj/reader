import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import { getState, subscribeToState } from '../framework.core.js';

// Define x-breadcrumb web component
export class XBreadcrumb extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		// Subscribe to activePath changes to update the breadcrumb
		this.unsubscribe = subscribeToState('activePath', () => {
			this.updateBreadcrumb();
		});

		// Set initial breadcrumb
		this.updateBreadcrumb();

		// Apply sx: styles if any
		this.applySxStyles();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	updateBreadcrumb() {
		const activePath = getState('activePath') || '';

		// Don't show breadcrumb on home page
		if (activePath === '/' || activePath === '') {
			this.innerHTML = '';
			return;
		}

		// Split path into segments and filter out empty ones
		const segments = activePath.split('/').filter((segment) => segment !== '');

		// Create breadcrumb items
		const breadcrumbItems = segments.map((segment, index) => {
			const isLast = index === segments.length - 1;
			const path = '/' + segments.slice(0, index + 1).join('/');
			const displayName = this.formatSegmentName(segment);

			if (isLast) {
				// Last item is not clickable
				return html`
					<span class="breadcrumb-item current">${displayName}</span>
				`;
			} else {
				// Other items are clickable links
				return html`
					<x-link href="${path}" class="breadcrumb-item">${displayName}</x-link>
				`;
			}
		});

		// Add home link at the beginning
		const homeLink = html`
			<x-link href="/" class="breadcrumb-item home">
				<x-icon icon="Home" sx:color="var(--paletteTextSecondary)"></x-icon>
			</x-link>
		`;

		this.innerHTML = html`
			<nav class="breadcrumb" aria-label="Breadcrumb">
				${homeLink} ${breadcrumbItems.join('')}
			</nav>
		`;
	}

	formatSegmentName(segment) {
		// Convert kebab-case to Title Case
		return segment
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
}
