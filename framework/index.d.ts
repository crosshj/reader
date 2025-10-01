// HTMLNext TypeScript Definitions

export interface FrameworkState {
	[key: string]: any;
}

export interface StateEventDetail {
	property: string;
	oldValue: any;
	newValue: any;
	state: FrameworkState;
}

// Main framework function
export function initializeFramework(): void;

// State management functions
export function setState(property: string, value: any): void;
export function getState(property: string): any;
export function subscribeToState(
	property: string,
	callback: (eventDetail: StateEventDetail) => void
): () => void;

// HTML template utility
export function html(strings: TemplateStringsArray, ...values: any[]): string;

// Base component class for custom components
export class BaseUIComponent extends HTMLElement {
	stateSubscriptions: Map<string, () => void>;
	initialState: FrameworkState | null;
	originalAttributes: Map<string, string>;

	constructor();
	connectedCallback(): void;
	disconnectedCallback(): void;
	getCurrentState(): FrameworkState;
	storeOriginalAttributes(): void;
	setupStateSubscriptions(): void;
	handleStateChange(newState: FrameworkState): void;
	applyConditionalAttributes(): void;
	applySxStyles(): void;
	expandShorthandProperty(
		property: string,
		value: string
	): Record<string, string>;
	fixCssPropertyName(property: string): string;
}

// Global declarations for browser environment
declare global {
	interface Window {
		state: FrameworkState;
		subscribeToState: (
			property: string,
			callback: (eventDetail: StateEventDetail) => void
		) => () => void;
	}
}
