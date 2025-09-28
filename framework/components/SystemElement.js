import { register } from '../framework.core.js';

// Base class for all system elements
export class SystemElement extends HTMLElement {
	constructor() {
		super();
		this.unregister = register({
			type: this.tagName.toLowerCase(),
			attributes: this.getAllAttributes(),
			body: this.textContent.trim(),
		});
	}

	getAllAttributes() {
		const attributes = {};
		for (let i = 0; i < this.attributes.length; i++) {
			const attr = this.attributes[i];
			attributes[attr.name] = attr.value;
		}
		return attributes;
	}

	disconnectedCallback() {
		if (this.unregister) {
			this.unregister();
		}
	}
}
