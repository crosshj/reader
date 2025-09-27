// Framework Core - Centralized system management
class FrameworkCore {
	constructor() {
		this.state = {};
		this.listeners = new Map(); // Map of property -> Set of listeners
		this.dataSources = new Map(); // Map of name -> data source config
		this.subscriptions = new Map(); // Map of path -> subscription config
		this.flows = new Map(); // Map of key -> flow definition
		this.initialized = false;
	}

	// Initialize the state manager
	initialize() {
		if (this.initialized) return;

		this.initialized = true;
		console.log('StateManager initialized');
	}

	// Set a state value and notify listeners
	set(property, value) {
		const oldValue = this.state[property];

		// Only update if value actually changed
		if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
			this.state[property] = value;

			// Notify listeners for this property
			this.notifyListeners(property, {
				property,
				oldValue,
				newValue: value,
				state: { ...this.state },
			});
		}
	}

	// Get a state value
	get(property) {
		return this.state[property];
	}

	// Get the entire state object (read-only copy)
	getState() {
		return { ...this.state };
	}

	// Subscribe to changes on a specific property
	subscribe(property, callback) {
		if (!this.listeners.has(property)) {
			this.listeners.set(property, new Set());
		}
		this.listeners.get(property).add(callback);

		// Return unsubscribe function
		return () => {
			const propertyListeners = this.listeners.get(property);
			if (propertyListeners) {
				propertyListeners.delete(callback);
			}
		};
	}

	// Notify all listeners for a property
	notifyListeners(property, eventDetail) {
		const propertyListeners = this.listeners.get(property);
		if (propertyListeners) {
			propertyListeners.forEach((callback) => {
				try {
					callback(eventDetail);
				} catch (error) {
					console.error(`Error in state listener for ${property}:`, error);
				}
			});
		}
	}

	// Initialize a property with a default value (only if not already set)
	initializeProperty(property, defaultValue) {
		if (this.state[property] === undefined) {
			this.set(property, defaultValue);
		}
	}

	// Check if a property exists
	has(property) {
		return property in this.state;
	}

	// Get all property names
	getProperties() {
		return Object.keys(this.state);
	}

	// Register a data source
	registerDataSource(attributes) {
		const { name, defaultValue, route } = attributes;

		if (!name) return;

		// Store data source configuration
		this.dataSources.set(name, { defaultValue, route });

		// Handle route-based data sources
		if (name === 'pathData' && route) {
			this.setupPathDataListener(route);
			return;
		}

		// Handle simple data sources
		if (defaultValue !== undefined) {
			let parsedValue = defaultValue;
			try {
				parsedValue = JSON.parse(defaultValue);
			} catch (e) {
				// Keep as string if not JSON
			}
			this.set(name, parsedValue);
		}
	}

	// Unregister a data source
	unregisterDataSource(name) {
		this.dataSources.delete(name);
		// Note: We don't clear the state value, just the registration
	}

	// Register a subscription
	registerSubscription(attributes) {
		const { path, handler } = attributes;

		if (!path || !handler) return;

		// Store subscription configuration
		this.subscriptions.set(path, { handler });

		// Set up listener
		const unsubscribe = this.subscribe(path, (eventDetail) => {
			this.triggerFlow(handler, eventDetail);
		});

		return unsubscribe;
	}

	// Unregister a subscription
	unregisterSubscription(path) {
		this.subscriptions.delete(path);
	}

	// Register a flow
	registerFlow(attributes) {
		const { key, code } = attributes;

		if (!key || !code) return;

		// Store flow definition
		this.flows.set(key, code);
	}

	// Unregister a flow
	unregisterFlow(key) {
		this.flows.delete(key);
	}

	// Trigger a flow by key
	triggerFlow(flowKey, eventDetail) {
		const code = this.flows.get(flowKey);
		if (code) {
			this.executeFlow(code, eventDetail);
		} else {
			console.warn(`Flow not found: ${flowKey}`);
		}
	}

	// Execute flow code
	executeFlow(code, eventDetail) {
		// Store event detail for flow access
		window.lastFlowEvent = eventDetail;

		try {
			// Create execution context
			const flowContext = {
				get global_pathData() {
					return this.get('pathData') || {};
				},
				get global_activePath() {
					return this.get('activePath') || '';
				},
				get global_user() {
					return this.get('user');
				},
				get global_pageContent() {
					return this.get('pageContent') || '';
				},
				get state() {
					return this.getState();
				},
				get event() {
					return window.lastFlowEvent || {};
				},

				setData: (name, value) => this.set(name, value),
				navigate: (path) => {
					this.set('currentPath', path);
					window.dispatchEvent(
						new CustomEvent('navigate', { detail: { path } })
					);
				},
				query: (exec, params = {}, outputVar = null) => {
					console.log(
						`Query: ${exec}`,
						params,
						outputVar ? `-> ${outputVar}` : ''
					);
				},
			};

			// Execute the flow
			const flowFunction = new Function(
				...Object.keys(flowContext),
				`"use strict"; ${code}`
			);

			flowFunction.apply(flowContext, Object.values(flowContext));
		} catch (error) {
			console.error('Flow execution error:', error);
		}
	}

	// Setup path data listener (moved from x-data)
	setupPathDataListener(route) {
		let urlPattern;
		try {
			const [basePath, hashPattern] = route.split('#/');
			if (!hashPattern) return;

			const baseUrl = `${window.location.protocol}//${window.location.host}${basePath}`;
			urlPattern = new URLPattern({
				baseURL: baseUrl,
				hash: `#/${hashPattern}`,
			});
		} catch (e) {
			return;
		}

		const extractPathData = () => {
			const currentUrl = window.location.href;
			const match = urlPattern.exec(currentUrl);

			let newValue;
			if (match && match.hash && match.hash.groups) {
				newValue = match.hash.groups;
			} else {
				// If no hash is present, redirect to #/
				if (!window.location.hash) {
					window.location.hash = '#/';
					return; // Let the hashchange event handle the redirect
				}
				newValue = {};
			}

			this.set('pathData', newValue);
		};

		// Set initial value
		extractPathData();

		// Listen for hash changes
		window.addEventListener('hashchange', extractPathData);
		window.addEventListener('navigate', () => {
			setTimeout(extractPathData, 0);
		});
	}

	// Clear all state (useful for testing)
	clear() {
		this.state = {};
		this.listeners.clear();
		this.dataSources.clear();
		this.subscriptions.clear();
		this.flows.clear();
	}
}

// Create singleton instance
const frameworkCore = new FrameworkCore();

// Export functions that components can use
export function initializeCore() {
	frameworkCore.initialize();
}

export function setState(property, value) {
	frameworkCore.set(property, value);
}

export function getState(property) {
	return frameworkCore.get(property);
}

export function getFullState() {
	return frameworkCore.getState();
}

export function subscribeToState(property, callback) {
	return frameworkCore.subscribe(property, callback);
}

// Registration functions
export function registerDataSource(attributes) {
	return frameworkCore.registerDataSource(attributes);
}

export function unregisterDataSource(name) {
	return frameworkCore.unregisterDataSource(name);
}

export function registerSubscription(attributes) {
	return frameworkCore.registerSubscription(attributes);
}

export function unregisterSubscription(path) {
	return frameworkCore.unregisterSubscription(path);
}

export function registerFlow(attributes) {
	return frameworkCore.registerFlow(attributes);
}

export function unregisterFlow(key) {
	return frameworkCore.unregisterFlow(key);
}

// Export the core instance for advanced usage
export { frameworkCore };
