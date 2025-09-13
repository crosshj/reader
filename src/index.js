import './index.css';
import { dispatchEvent } from './_lib/utils.js';

import { ApplicationController } from './Application/ApplicationController.js';
import { ReaderController } from './Reader/ReaderController.js';

async function startReader() {
	const applicationController = new ApplicationController();
	const readerController = new ReaderController();
	dispatchEvent('app:init');
}

// Start the reader when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startReader);
} else {
	startReader();
}
