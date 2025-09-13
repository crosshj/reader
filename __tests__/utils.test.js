import { dispatchEvent } from '../src/_lib/utils.js';

describe('Utils', () => {
	test('dispatchEvent should create and dispatch a custom event', () => {
		const mockCallback = jest.fn();
		document.addEventListener('test:event', mockCallback);
		
		dispatchEvent('test:event', { test: 'data' });
		
		expect(mockCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				detail: { test: 'data' }
			})
		);
	});
});
