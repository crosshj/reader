import { FormField } from './web-components/FormField.js';

export function registerAllWebComponents() {
	if (!customElements.get('form-field')) {
		customElements.define('form-field', FormField);
		// console.log('✅ FormField web component registered');
	}
}

registerAllWebComponents();
