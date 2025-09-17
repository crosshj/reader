// Copy of utils from gun page for consistency
export function dispatchEvent(eventName, detail = null) {
	const event = new CustomEvent(eventName, { detail });
	document.dispatchEvent(event);
}

export function addEventListener(eventName, handler) {
	document.addEventListener(eventName, handler);
}

/**
 * Tagged template literal for HTML generation.
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {string}
 */
export const html = (strings, ...values) => {
	let result = '';
	for (let i = 0; i < strings.length; i++) {
		result += strings[i];
		if (i < values.length) {
			result += values[i];
		}
	}
	return result;
};

/**
 * Smart debounce with request cancellation - best of all worlds
 * - Immediate visual feedback (input updates instantly)
 * - Performance protection (prevents expensive operations from running too frequently)
 * - Cancellation of stale requests (if user types again before previous operation completes)
 * - Configurable behavior for different scenarios
 * 
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Configuration options
 * @param {boolean} options.leading - Execute on leading edge (immediate execution)
 * @param {boolean} options.trailing - Execute on trailing edge (after delay)
 * @param {number} options.maxWait - Maximum time to wait before forcing execution
 * @returns {Function} Debounced function with cancellation support
 */
export function smartDebounce(fn, delay, options = {}) {
	const {
		leading = false,
		trailing = true,
		maxWait = null
	} = options;

	let timeoutId = null;
	let maxTimeoutId = null;
	let lastCallTime = 0;
	let lastInvokeTime = 0;
	let lastArgs = null;
	let lastThis = null;
	let result = null;

	function invokeFunc(time) {
		const args = lastArgs;
		const thisArg = lastThis;

		lastArgs = lastThis = null;
		lastInvokeTime = time;
		result = fn.apply(thisArg, args);
		return result;
	}

	function leadingEdge(time) {
		lastInvokeTime = time;
		timeoutId = setTimeout(timerExpired, delay);
		return leading ? invokeFunc(time) : result;
	}

	function remainingWait(time) {
		const timeSinceLastCall = time - lastCallTime;
		const timeSinceLastInvoke = time - lastInvokeTime;
		const timeWaiting = delay - timeSinceLastCall;

		return maxWait === null
			? timeWaiting
			: Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
	}

	function shouldInvoke(time) {
		const timeSinceLastCall = time - lastCallTime;
		const timeSinceLastInvoke = time - lastInvokeTime;

		return (
			lastCallTime === 0 ||
			timeSinceLastCall >= delay ||
			timeSinceLastCall < 0 ||
			(maxWait !== null && timeSinceLastInvoke >= maxWait)
		);
	}

	function timerExpired() {
		const time = Date.now();
		if (shouldInvoke(time)) {
			return trailingEdge(time);
		}
		timeoutId = setTimeout(timerExpired, remainingWait(time));
	}

	function trailingEdge(time) {
		timeoutId = null;

		if (trailing && lastArgs) {
			return invokeFunc(time);
		}
		lastArgs = lastThis = null;
		return result;
	}

	function cancel() {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}
		if (maxTimeoutId !== null) {
			clearTimeout(maxTimeoutId);
		}
		lastCallTime = 0;
		lastInvokeTime = 0;
		lastArgs = lastCallTime = lastThis = timeoutId = null;
	}

	function flush() {
		return timeoutId === null ? result : trailingEdge(Date.now());
	}

	function pending() {
		return timeoutId !== null;
	}

	function debounced(...args) {
		const time = Date.now();
		const isInvoking = shouldInvoke(time);

		lastArgs = args;
		lastThis = this;
		lastCallTime = time;

		if (isInvoking) {
			if (timeoutId === null) {
				return leadingEdge(lastCallTime);
			}
			if (maxWait) {
				timeoutId = setTimeout(timerExpired, delay);
				return invokeFunc(lastCallTime);
			}
		}
		if (timeoutId === null) {
			timeoutId = setTimeout(timerExpired, delay);
		}
		return result;
	}

	debounced.cancel = cancel;
	debounced.flush = flush;
	debounced.pending = pending;

	return debounced;
}

/**
 * Sets up event binding utilities on a UI component
 * @param {Object} ui - UI component instance
 */
export function setupEventUtilities(ui) {
	// Core binding method
	ui.bind = (eventType, handlers) => {
		ui.container.addEventListener(eventType, (e) => {
			const is = (selector) =>
				e.target.matches(selector) || e.target.closest(selector);
			for (const [selector, handlerOrHandlers] of Object.entries(
				handlers
			)) {
				if (is(selector)) {
					// Support both single handler and array of handlers
					const handlersToCall = Array.isArray(handlerOrHandlers)
						? handlerOrHandlers
						: [handlerOrHandlers];

					// Call all handlers in order
					handlersToCall.forEach((handler) => handler(e));
					break;
				}
			}
		});
	};
}
