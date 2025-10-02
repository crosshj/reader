import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import { cleanServerHTML } from './cleanServerHTML.js';
import { getState, subscribeToState } from '../framework.core.js';

// Define x-fragment web component
export class XFragment extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();
		
		const contents = this.getAttribute('contents');
		const showLoading = this.getAttribute('showLoading') !== 'false';

		if (!contents) {
			console.warn('x-fragment: no contents attribute provided');
			return;
		}

		// Remove global_ prefix if present
		const actualPath = contents.startsWith('global_')
			? contents.substring(7)
			: contents;

		// Subscribe to changes in the content
		this.unsubscribe = subscribeToState(actualPath, (eventDetail) => {
			this.updateContent(eventDetail.newValue, showLoading);
		});

		// Set initial content
		const initialContent = getState(actualPath);
		this.updateContent(initialContent, showLoading);
	}

	updateContent(content, showLoading) {
		if (!content) {
			if (showLoading) {
				this.innerHTML = html`
					<div
						style="display: flex; align-items: center; justify-content: center; height: 100%;"
					>
						<div
							style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"
						></div>
					</div>
				`;
			} else {
				this.innerHTML = '';
			}
			return;
		}

		// If content is a string, treat it as HTML
		if (typeof content === 'string') {
			// Use centralized cleaning function
			const cleanedContent = cleanServerHTML(content);
			this.innerHTML = cleanedContent;
		} else {
			// If content is an object or other type, stringify it
			this.innerHTML = html`<pre>${JSON.stringify(content, null, 2)}</pre>`;
		}
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}
