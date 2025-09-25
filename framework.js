// Framework.js - Module for loading web components and fragments
import { BaseUIComponent } from './framework.utils.js';

// Import existing web components
import { registerAllWebComponents } from './src/web-components.js';

// Define x-flow web component
class XFlow extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		// x-flow should not render any DOM content
		// It's like a script tag that executes automatically
		// Styling is handled by framework.css

		// Store the flow for later execution by key (if needed)
		const key = this.getAttribute('key');
		if (key) {
			// Store flow in a global registry for execution
			if (!window.flowRegistry) {
				window.flowRegistry = new Map();
			}
			window.flowRegistry.set(key, this);
		}

		// Auto-execute the flow when it connects
		// Flows can check their own attributes to determine if they should run
		this.execute();
	}

	/**
	 * Execute the flow as JavaScript code
	 *
	 * This method takes the text content inside the <x-flow> element and executes it
	 * as JavaScript code within a controlled execution context. The flow can access
	 * global state variables and use helper functions for common operations.
	 *
	 * Flow execution context provides:
	 * - Access to global state variables (global_pathData, global_activePath, etc.)
	 * - Helper functions for data manipulation (setData, navigate, query)
	 * - Safe execution environment with controlled scope
	 *
	 * Example flow content:
	 * ```javascript
	 * if (global_user === undefined) {
	 *   setData('loginError', 'Please log in first');
	 *   navigate('/login');
	 * } else {
	 *   query('sp_GetUserData');
	 *   navigate('/dashboard');
	 * }
	 * ```
	 */
	execute() {
		// FLOW EXECUTION IS CURRENTLY COMMENTED OUT
		// Uncomment the code below when ready to implement flow execution

		/*
    try {
      // Extract the JavaScript code from the flow element's text content
      // This is the code written between <x-flow> and </x-flow> tags
      const jsCode = this.textContent.trim();

      // Create a controlled execution context that provides:
      // 1. Access to global state variables
      // 2. Helper functions for common flow operations
      // 3. Safe scope isolation to prevent access to window/document
      const flowContext = {
        // Global state access - these getters provide read-only access to global state
        // Variables prefixed with 'global_' in the flow code map to these getters
        get global_pathData() {
          // Returns the current path data from global state
          return window.state?.pathData || {};
        },
        get global_activePath() {
          // Returns the currently active page path
          return window.state?.activePath || '';
        },
        get global_user() {
          // Returns the current user data
          return window.state?.user;
        },

        // Flow helper functions - these provide controlled ways to modify state and trigger actions
        setData: (name, value) => {
          // Sets a value in the global state
          // This is the flow equivalent of: window.state[name] = value
          if (!window.state) window.state = {};
          window.state[name] = value;
        },

        navigate: (path) => {
          // Triggers navigation to a new path
          // Updates global state and dispatches a navigation event
          window.state.currentPath = path;
          // Other components can listen for this event to react to navigation
          window.dispatchEvent(
            new CustomEvent('navigate', { detail: { path } })
          );
        },

        query: (exec, params = {}, outputVar = null) => {
          // Executes a database query or API call
          // exec: the query/function name to execute
          // params: parameters to pass to the query
          // outputVar: variable name to store the results in global state
          // 
          // This is a placeholder implementation - in a real app this would:
          // 1. Make an API call to the backend
          // 2. Process the response
          // 3. Store results in global state if outputVar is provided
          console.log(
            `Query: ${exec}`,
            params,
            outputVar ? `-> ${outputVar}` : ''
          );
        },

        // Early return function for flow control
        // Allows flows to exit early without executing remaining code
        return: () => {
          return;
        },
      };

      // Create a JavaScript function from the flow code
      // This uses the Function constructor to create a function that:
      // 1. Has access to all the flowContext variables as parameters
      // 2. Executes the flow code in strict mode
      // 3. Runs in the controlled context we defined
      const flowFunction = new Function(
        ...Object.keys(flowContext), // Parameter names from flowContext
        `"use strict"; ${jsCode}`    // The actual flow code to execute
      );

      // Execute the flow function with the controlled context
      // This gives the flow code access to all the helper functions and global variables
      // but prevents it from accessing the broader window/document scope
      flowFunction.apply(flowContext, Object.values(flowContext));
      
    } catch (error) {
      // If the flow code has syntax errors or runtime errors, log them
      // This prevents a single bad flow from crashing the entire application
      console.error('Flow execution error:', error);
    }
    */

		// Placeholder - flows are currently not executed
		console.log('Flow execution is currently disabled');
	}
}

// Define x-page web component
class XPage extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}

// Define x-navbar web component
class XNavbar extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		const label = this.getAttribute('label');

		// Create a simple navbar structure
		this.innerHTML = `
      <h2>${label || 'Navigation'}</h2>
      <div class="navbar-content">
        ${this.innerHTML}
      </div>
    `;

		// Apply sx: styles if any
		this.applySxStyles();
	}
}

// Define x-content web component
class XContent extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}

// Define x-box web component
class XBox extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Parse sx: attributes and apply them as CSS styles
		this.applySxStyles();
	}
}

// Define x-button web component
class XButton extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const label = this.getAttribute('label');
		const href = this.getAttribute('href');

		this.innerHTML = `
      <button ${href ? `onclick="window.location.href='${href}'"` : ''}>
        ${label || this.textContent}
      </button>
    `;
	}
}

// Define x-typography web component
class XTypography extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		const variant = this.getAttribute('variant');

		// Only create specific elements if variant is explicitly specified
		if (variant && variant !== 'span') {
			const element = document.createElement(variant);
			element.innerHTML = this.innerHTML;

			// Copy sx: attributes to the new element
			Array.from(this.attributes).forEach((attr) => {
				if (attr.name.startsWith('sx:')) {
					element.setAttribute(attr.name, attr.value);
				}
			});

			this.parentNode.replaceChild(element, this);

			// Apply sx: styles to the new element
			this.applySxStylesToElement(element);
		} else {
			// Default to span for inline text styling
			const element = document.createElement('span');
			element.innerHTML = this.innerHTML;

			// Copy sx: attributes to the new element
			Array.from(this.attributes).forEach((attr) => {
				if (attr.name.startsWith('sx:')) {
					element.setAttribute(attr.name, attr.value);
				}
			});

			this.parentNode.replaceChild(element, this);

			// Apply sx: styles to the new element
			this.applySxStylesToElement(element);
		}
	}

	applySxStylesToElement(element) {
		// Get all attributes that start with 'sx:'
		const attributes = Array.from(this.attributes);
		const sxStyles = {};

		attributes.forEach((attr) => {
			if (attr.name.startsWith('sx:')) {
				// Remove 'sx:' prefix and convert to CSS property
				const cssProperty = attr.name.substring(3);
				const cssValue = attr.value;

				// Handle shorthand properties for padding and margin
				const shorthandProperties = this.expandShorthandProperty(
					cssProperty,
					cssValue
				);
				Object.assign(sxStyles, shorthandProperties);
			}
		});

		// Apply the styles directly to the element
		Object.entries(sxStyles).forEach(([property, value]) => {
			element.style.setProperty(property, value);
		});
	}

	expandShorthandProperty(property, value) {
		const expanded = {};

		// Padding shorthand properties
		if (property === 'p') {
			expanded['padding'] = value;
		} else if (property === 'pt') {
			expanded['padding-top'] = value;
		} else if (property === 'pb') {
			expanded['padding-bottom'] = value;
		} else if (property === 'pl') {
			expanded['padding-left'] = value;
		} else if (property === 'pr') {
			expanded['padding-right'] = value;
		} else if (property === 'py') {
			expanded['padding-block'] = value;
		} else if (property === 'px') {
			expanded['padding-inline'] = value;
		}
		// Margin shorthand properties
		else if (property === 'm') {
			expanded['margin'] = value;
		} else if (property === 'mt') {
			expanded['margin-top'] = value;
		} else if (property === 'mb') {
			expanded['margin-bottom'] = value;
		} else if (property === 'ml') {
			expanded['margin-left'] = value;
		} else if (property === 'mr') {
			expanded['margin-right'] = value;
		} else if (property === 'my') {
			expanded['margin-block'] = value;
		} else if (property === 'mx') {
			expanded['margin-inline'] = value;
		}
		// Handle regular camelCase properties
		else {
			// Convert camelCase to kebab-case for CSS properties
			let kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();

			// Fix specific CSS properties that need proper hyphenation
			kebabProperty = this.fixCssPropertyName(kebabProperty);
			expanded[kebabProperty] = value;
		}

		return expanded;
	}
}

// Define x-data web component
class XData extends HTMLElement {
	constructor() {
		super();
		// Add instance tracking for debugging
		if (!XData.instanceCount) {
			XData.instanceCount = 0;
		}
		XData.instanceCount++;
		this.instanceId = XData.instanceCount;
	}

	connectedCallback() {
		const name = this.getAttribute('name');
		const defaultValue = this.getAttribute('defaultValue');
		const route = this.getAttribute('route');

		if (!name) {
			return;
		}

		// Initialize global state if not already done
		if (!window.state) {
			window.state = {};
		}

		// Special handling for pathData with route pattern
		if (name === 'pathData' && route) {
			this.setupPathDataListener(route);
			return;
		}

		// Parse the default value (could be JSON, string, etc.)
		let parsedValue = defaultValue;
		if (defaultValue) {
			try {
				// Try to parse as JSON first
				parsedValue = JSON.parse(defaultValue);
			} catch (e) {
				// If not JSON, use as string
				parsedValue = defaultValue;
			}
		}

		// Store the data in global state
		window.state[name] = parsedValue;
	}

	setupPathDataListener(route) {
		// Create URLPattern for the route
		// "/framework.html#/:rest*" -> URLPattern with hash pattern
		let urlPattern;
		try {
			// URLPattern needs the full URL structure
			// Split the route to get the base path and hash pattern
			const [basePath, hashPattern] = route.split('#/');
			if (!hashPattern) {
				return;
			}

			// Get the full base URL (protocol + host + pathname)
			const baseUrl = `${window.location.protocol}//${window.location.host}${basePath}`;

			// Create URLPattern with full base URL and hash pattern
			urlPattern = new URLPattern({
				baseURL: baseUrl,
				hash: `#/${hashPattern}`,
			});
		} catch (e) {
			return;
		}

		// Function to extract path data from current URL using URLPattern
		const extractPathData = () => {
			const currentUrl = window.location.href;
			const match = urlPattern.exec(currentUrl);

			if (match && match.hash && match.hash.groups) {
				// Extract the groups from the hash match
				window.state.pathData = match.hash.groups;
			} else {
				// No match, set empty object
				window.state.pathData = {};
			}
		};

		// Set initial value
		extractPathData();

		// Listen for hash changes
		window.addEventListener('hashchange', extractPathData);

		// Also listen for our custom navigate event
		window.addEventListener('navigate', (event) => {
			// Small delay to ensure hash has been updated
			setTimeout(extractPathData, 0);
		});

		// Store cleanup function for potential future use
		this.cleanup = () => {
			window.removeEventListener('hashchange', extractPathData);
		};
	}
}

// Define x-page-fragment web component
class XPageFragment extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}

// Define x-link web component
class XLink extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const href = this.getAttribute('href');
		const underline = this.getAttribute('underline');

		// Create a link element
		const link = document.createElement('a');
		link.href = href ? `#${href}` : '#';
		link.innerHTML = this.innerHTML;

		// Apply underline styling
		if (underline === 'none') {
			link.style.textDecoration = 'none';
		}

		// Listen for hash changes to update global state
		link.addEventListener('click', () => {
			// Update global state when clicked
			if (href) {
				if (!window.state) window.state = {};
				window.state.currentPath = href;
				// Dispatch navigation event
				window.dispatchEvent(
					new CustomEvent('navigate', {
						detail: { path: href },
					})
				);
			}
		});

		this.innerHTML = '';
		this.appendChild(link);
	}
}

// Define x-map web component
class XMap extends HTMLElement {
	constructor() {
		super();
		// Add instance tracking for debugging
		if (!XMap.instanceCount) {
			XMap.instanceCount = 0;
		}
		XMap.instanceCount++;
		this.instanceId = XMap.instanceCount;
	}

	connectedCallback() {
		const items = this.getAttribute('items');

		// Check if already processed to prevent multiple renders
		if (this.hasAttribute('data-processed')) {
			console.log(
				`x-map #${this.instanceId}: already processed, skipping render`
			);
			return;
		}

		console.log(
			`x-map #${this.instanceId}: needs to render with items="${items}"`
		);

		// Mark as processed
		this.setAttribute('data-processed', 'true');

		// Hide the initial children (they are the template)
		this.style.display = 'none';

		// Store the template for later use
		this.template = this.innerHTML;

		// Clear the initial content since it's just a template
		this.innerHTML = '';

		// Process the data if available
		this.processData(items);
	}

	processData(dataPath) {
		if (!dataPath) {
			console.warn(`x-map #${this.instanceId}: no items attribute provided`);
			return;
		}

		// Get the data from global state or window
		// Handle both direct paths and global_ prefixed paths
		let data = null;
		let actualPath = dataPath;

		// Remove global_ prefix if present
		if (dataPath.startsWith('global_')) {
			actualPath = dataPath.substring(7); // Remove 'global_' prefix
		}

		if (window.state && window.state[actualPath]) {
			data = window.state[actualPath];
		} else if (window[actualPath]) {
			data = window[actualPath];
		} else {
			console.warn(
				`x-map #${this.instanceId}: data not found for path: ${dataPath} (tried: ${actualPath})`
			);
			return;
		}

		if (!Array.isArray(data)) {
			console.warn(
				`x-map #${this.instanceId}: data is not an array: ${dataPath}`
			);
			return;
		}

		console.log(
			`x-map #${this.instanceId}: rendering ${data.length} items from ${actualPath}`
		);

		// Clear any previous content (idempotent behavior)
		this.innerHTML = '';

		// Render the template for each item
		data.forEach((item, index) => {
			const itemElement = this.renderItem(item, index);
			this.appendChild(itemElement);
		});

		// Show the component now that it has content
		this.style.display = 'block';
	}

	renderItem(item, index) {
		// Create a container for this item
		const itemContainer = document.createElement('div');
		itemContainer.setAttribute('data-item-index', index);

		// Process the template with item data
		let processedTemplate = this.template;

		// Replace template variables with item data
		// Handle {{item_property}} and {{ item_property }} syntax (with or without spaces)
		processedTemplate = processedTemplate.replace(
			/\{\{\s*item_([^}]+)\s*\}\}/g,
			(match, property) => {
				// Trim any whitespace from the property name
				const cleanProperty = property.trim();
				const value = item[cleanProperty] || '';
				return value;
			}
		);

		// Handle {{index}} for array index
		processedTemplate = processedTemplate.replace(/\{\{index\}\}/g, index);

		itemContainer.innerHTML = processedTemplate;

		return itemContainer;
	}
}

// Define x-icon web component
class XIcon extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		const icon = this.getAttribute('icon');
		const color = this.getAttribute('color');

		// Convert PascalCase to snake_case for Material Icons
		const materialIconName = this.convertToMaterialIconName(icon);

		// Create a Material Icon element
		const iconElement = document.createElement('span');
		iconElement.className = 'material-icons';
		iconElement.textContent = materialIconName;

		// Set color attribute for CSS to use
		if (color) {
			iconElement.setAttribute('data-color', color);
		}

		this.innerHTML = '';
		this.appendChild(iconElement);

		// Apply sx: styles if any
		this.applySxStyles();
	}

	convertToMaterialIconName(pascalCaseName) {
		if (!pascalCaseName) return 'help_outline';

		// Convert PascalCase to snake_case
		// Home -> home
		// ListAlt -> list_alt
		// ViewKanban -> view_kanban
		// DriveFolderUpload -> drive_folder_upload
		return pascalCaseName
			.replace(/([A-Z])/g, '_$1') // Add underscore before capital letters
			.toLowerCase() // Convert to lowercase
			.replace(/^_/, ''); // Remove leading underscore
	}
}

// Define x-include web component
class XInclude extends BaseUIComponent {
	constructor() {
		super();
		// Add a static counter to track instances
		if (!XInclude.instanceCount) {
			XInclude.instanceCount = 0;
		}
		XInclude.instanceCount++;
		this.instanceId = XInclude.instanceCount;
	}

	// Helper function to resolve relative paths
	resolvePath(href, basePath) {
		if (
			href.startsWith('http://') ||
			href.startsWith('https://') ||
			href.startsWith('/')
		) {
			// Absolute URL or absolute path - use as is
			return href;
		}

		// Relative path - resolve against base path
		const baseDir = basePath.substring(0, basePath.lastIndexOf('/') + 1);
		return baseDir + href;
	}

	// Helper function to get the current page path
	getCurrentPagePath() {
		// Check if we have a global state with current page path
		if (window.state && window.state.currentPath) {
			return window.state.currentPath;
		}

		// Fallback: try to get from the URL or default to fragments root
		const url = new URL(window.location.href);
		const pathname = url.pathname;
		if (pathname.includes('fragments/')) {
			return pathname.substring(pathname.indexOf('fragments/'));
		}

		return 'fragments/';
	}

	async connectedCallback() {
		const href = this.getAttribute('href');
		if (!href) {
			console.warn('x-include: no href attribute provided');
			return;
		}

		try {
			// Resolve the path relative to the current page
			const currentPagePath = this.getCurrentPagePath();
			const resolvedPath = this.resolvePath(href, currentPagePath);

			const response = await fetch(resolvedPath);
			if (!response.ok) {
				throw new Error(
					`Failed to load include: ${response.status} ${response.statusText}`
				);
			}
			const content = await response.text();
			const cleanedContent = cleanServerHTML(content);

			// Just update innerHTML - the browser handles the rest
			this.innerHTML = cleanedContent;
			console.log(`x-include #${this.instanceId}: set innerHTML for ${href}`);

			// Apply sx: styles if any
			this.applySxStyles();
		} catch (error) {
			console.error('Error loading include:', error);
			this.innerHTML = `<div style="padding: 20px; color: red;">Error loading include: ${error.message}</div>`;
		}
	}
}

// Register all web components
function registerFrameworkComponents() {
	// Register existing web components
	registerAllWebComponents();

	// Register x- prefixed components
	if (!customElements.get('x-flow')) {
		customElements.define('x-flow', XFlow);
	}

	if (!customElements.get('x-page')) {
		customElements.define('x-page', XPage);
	}

	if (!customElements.get('x-navbar')) {
		customElements.define('x-navbar', XNavbar);
	}

	if (!customElements.get('x-content')) {
		customElements.define('x-content', XContent);
	}

	if (!customElements.get('x-box')) {
		customElements.define('x-box', XBox);
	}

	if (!customElements.get('x-button')) {
		customElements.define('x-button', XButton);
	}

	if (!customElements.get('x-typography')) {
		customElements.define('x-typography', XTypography);
	}

	if (!customElements.get('x-include')) {
		customElements.define('x-include', XInclude);
	}

	if (!customElements.get('x-page-fragment')) {
		customElements.define('x-page-fragment', XPageFragment);
	}

	if (!customElements.get('x-link')) {
		customElements.define('x-link', XLink);
	}

	if (!customElements.get('x-map')) {
		customElements.define('x-map', XMap);
	}

	if (!customElements.get('x-icon')) {
		customElements.define('x-icon', XIcon);
	}

	if (!customElements.get('x-data')) {
		customElements.define('x-data', XData);
	}
}

// Function to execute a flow by key
export function executeFlow(key) {
	if (window.flowRegistry && window.flowRegistry.has(key)) {
		const flow = window.flowRegistry.get(key);
		flow.execute();
		return true;
	} else {
		console.warn('Flow not found:', key);
		return false;
	}
}

// Initialize global state
function initializeGlobalState() {
	if (!window.state) {
		window.state = {
			currentPath: null,
			// Add other global state properties here as needed
		};
	}
}

// Function to clean HTML content from server
function cleanServerHTML(htmlContent) {
	// Remove Vite's injected script tags
	let cleaned = htmlContent.replace(
		/<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any other Vite-related script injections
	cleaned = cleaned.replace(
		/<script[^>]*src="[^"]*vite[^"]*"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any script tags that might be injected by build tools
	cleaned = cleaned.replace(
		/<script[^>]*src="[^"]*\/src\/[^"]*"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any link tags that might be injected by build tools
	cleaned = cleaned.replace(/<link[^>]*rel="modulepreload"[^>]*>/gi, '');

	// Clean up any extra whitespace that might be left
	cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

	return cleaned;
}

// Function to load and replace body content
export async function loadFragment(fragmentPath) {
	try {
		// Initialize global state if not already done
		initializeGlobalState();

		// Set the current page path for relative path resolution
		window.state.currentPath = fragmentPath;

		const response = await fetch(fragmentPath);
		if (!response.ok) {
			throw new Error(`Failed to load fragment: ${response.status}`);
		}
		const content = await response.text();
		const cleanedContent = cleanServerHTML(content);
		document.body.innerHTML = cleanedContent;

		// Flows will execute themselves based on their own attributes and state
		// No manual execution needed - they handle their own lifecycle
	} catch (error) {
		console.error('Error loading fragment:', error);
		document.body.innerHTML = `<div style="padding: 20px; color: red;">Error loading fragment: ${error.message}</div>`;
	}
}

// Initialize framework
export function initializeFramework() {
	// Initialize global state first
	initializeGlobalState();

	// Register all components first
	registerFrameworkComponents();

	// Framework initialized with all web components registered
}

// Components will be initialized explicitly when needed
