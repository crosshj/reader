// HTMLNext - Main Entry Point
// A lightweight web component framework with state management and conditional rendering

// Export main framework function
export { initializeFramework } from './framework.js';

// Export state management functions
export {
	setState,
	SetState,
	getState,
	subscribeToState,
} from './framework.core.js';

// Export html utility for templates
export { html } from './framework.utils.js';

// Export base component class for custom components
export { BaseUIComponent } from './components/BaseUIComponent.js';

// Import CSS for bundling
import './framework.css';
import './components/XMarkdown.css';
import './components/XVizBar.css';
import './components/XVizPie.css';
