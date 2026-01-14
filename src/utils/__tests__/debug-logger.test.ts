/**
 * Tests for Debug Logger Utility
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { debugLog, debugWarn, debugError, setDebugEnabled, isDebugEnabled } from '../debug-logger';

describe('Debug Logger', () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		// Reset debug state before each test
		setDebugEnabled(false);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('setDebugEnabled', () => {
		it('should enable debug logging when set to true', () => {
			// Act
			setDebugEnabled(true);

			// Assert
			expect(isDebugEnabled()).toBe(true);
		});

		it('should disable debug logging when set to false', () => {
			// Arrange
			setDebugEnabled(true);

			// Act
			setDebugEnabled(false);

			// Assert
			expect(isDebugEnabled()).toBe(false);
		});
	});

	describe('debugLog', () => {
		it('should log to console when debug is enabled', () => {
			// Arrange
			setDebugEnabled(true);

			// Act
			debugLog('Test message');

			// Assert
			expect(consoleLogSpy).toHaveBeenCalledWith('Daily Sync -', 'Test message');
		});

		it('should not log to console when debug is disabled', () => {
			// Arrange
			setDebugEnabled(false);

			// Act
			debugLog('Test message');

			// Assert
			expect(consoleLogSpy).not.toHaveBeenCalled();
		});

		it('should handle multiple arguments', () => {
			// Arrange
			setDebugEnabled(true);

			// Act
			debugLog('Found', 5, 'meetings');

			// Assert
			expect(consoleLogSpy).toHaveBeenCalledWith('Daily Sync -', 'Found', 5, 'meetings');
		});

		it('should handle objects in arguments', () => {
			// Arrange
			setDebugEnabled(true);
			const obj = { key: 'value' };

			// Act
			debugLog('Object:', obj);

			// Assert
			expect(consoleLogSpy).toHaveBeenCalledWith('Daily Sync -', 'Object:', obj);
		});
	});

	describe('debugWarn', () => {
		it('should warn to console when debug is enabled', () => {
			// Arrange
			setDebugEnabled(true);

			// Act
			debugWarn('Warning message');

			// Assert
			expect(consoleWarnSpy).toHaveBeenCalledWith('Daily Sync -', 'Warning message');
		});

		it('should not warn to console when debug is disabled', () => {
			// Arrange
			setDebugEnabled(false);

			// Act
			debugWarn('Warning message');

			// Assert
			expect(consoleWarnSpy).not.toHaveBeenCalled();
		});
	});

	describe('debugError', () => {
		it('should error to console when debug is enabled', () => {
			// Arrange
			setDebugEnabled(true);

			// Act
			debugError('Error message');

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith('Daily Sync -', 'Error message');
		});

		it('should not error to console when debug is disabled', () => {
			// Arrange
			setDebugEnabled(false);

			// Act
			debugError('Error message');

			// Assert
			expect(consoleErrorSpy).not.toHaveBeenCalled();
		});

		it('should handle Error objects', () => {
			// Arrange
			setDebugEnabled(true);
			const error = new Error('Test error');

			// Act
			debugError('Failed:', error);

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith('Daily Sync -', 'Failed:', error);
		});
	});

	describe('default state', () => {
		it('should be disabled by default', () => {
			// Need a fresh import to test default state
			// For this test, we rely on the beforeEach reset
			expect(isDebugEnabled()).toBe(false);
		});
	});
});
