import './index.css';
import { dispatchEvent } from './_lib/utils.js';

// Register all web components first
import './web-components.js';

import { ApplicationController } from './Application/ApplicationController.js';
import { ReaderController } from './Reader/ReaderController.js';

async function startReader() {
	const applicationController = new ApplicationController();
	const readerController = new ReaderController();
	
	// Make ApplicationController globally available
	window.appController = applicationController;
	
	dispatchEvent('app:init');
}

// Start the reader when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startReader);
} else {
	startReader();
}
