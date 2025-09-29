import { SystemElement } from './SystemElement.js';

// Individual class for XData component type
export class XData extends SystemElement {
	constructor() {
		super();
		// Additional initialization for XData
		this.removeAttribute('defaultValue');
	}
}
