// Framework.js - Module for loading web components and fragments
import { html } from './framework.utils.js';
import { BaseUIComponent } from './components/BaseUIComponent.js';
import {
	initializeCore,
	setState,
	getState,
	subscribeToState,
} from './framework.core.js';

// Import all framework components
import { SystemElement } from './components/SystemElement.js';
import { XData } from './components/XData.js';
import { XSubscribe } from './components/XSubscribe.js';
import { XFlow } from './components/XFlow.js';
import { XPage } from './components/XPage.js';
import { XNavbar } from './components/XNavbar.js';
import { XContent } from './components/XContent.js';
import { XBox } from './components/XBox.js';
import { XButton } from './components/XButton.js';
import { XTypography } from './components/XTypography.js';
import { XLink } from './components/XLink.js';
import { XMap } from './components/XMap.js';
import { XIcon } from './components/XIcon.js';
import { XFragment } from './components/XFragment.js';
import { XInclude } from './components/XInclude.js';
import { XVizBar } from './components/XVizBar.js';
import { XVizPie } from './components/XVizPie.js';
import { XMarkdown } from './components/XMarkdown.js';
import { XTable } from './components/XTable.js';
import { cleanServerHTML } from './components/cleanServerHTML.js';

// Register all web components
function registerFrameworkComponents() {
	const components = [
		{ name: 'x-flow', class: XFlow },
		{ name: 'x-page', class: XPage },
		{ name: 'x-navbar', class: XNavbar },
		{ name: 'x-content', class: XContent },
		{ name: 'x-box', class: XBox },
		{ name: 'x-button', class: XButton },
		{ name: 'x-typography', class: XTypography },
		{ name: 'x-include', class: XInclude },
		{ name: 'x-link', class: XLink },
		{ name: 'x-map', class: XMap },
		{ name: 'x-icon', class: XIcon },
		{ name: 'x-data', class: XData },
		{ name: 'x-subscribe', class: XSubscribe },
		{ name: 'x-fragment', class: XFragment },
		{ name: 'x-viz-bar', class: XVizBar },
		{ name: 'x-viz-pie', class: XVizPie },
		{ name: 'x-markdown', class: XMarkdown },
		{ name: 'x-table', class: XTable },
	];

	for (const { name, class: ComponentClass } of components) {
		if (customElements.get(name)) continue;
		customElements.define(name, ComponentClass);
	}
}

// Function to load and replace body content
export async function loadFragment(fragmentPath) {
	try {
		// Initialize core if not already done
		initializeCore();

		// Set the current page path for relative path resolution
		setState('currentPath', fragmentPath);

		const response = await fetch(fragmentPath);
		if (!response.ok) {
			throw new Error(`Failed to load fragment: ${response.status}`);
		}
		const content = await response.text();
		console.log({ content });
		const cleanedContent = cleanServerHTML(content);
		document.body.innerHTML = cleanedContent;

		// Flows will execute themselves based on their own attributes and state
		// No manual execution needed - they handle their own lifecycle
	} catch (error) {
		console.error('Error loading fragment:', error);
		document.body.innerHTML = html`<div style="padding: 20px; color: red;">
			Error loading fragment: ${error.message}
		</div>`;
	}
}

// Initialize framework
export function initializeFramework() {
	// Initialize core first
	initializeCore();

	// Register all components first
	registerFrameworkComponents();

	// Framework initialized with all web components registered
}

// Re-export state management functions for convenience
export { setState, getState, subscribeToState };

// Components will be initialized explicitly when needed
