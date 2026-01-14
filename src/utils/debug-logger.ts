/**
 * Debug Logger Utility
 * Provides conditional logging functions that respect the debug setting
 */

const LOG_PREFIX = 'Daily Sync -';

/** Internal state for debug logging */
let debugEnabled = false;

/**
 * Enable or disable debug logging
 * @param enabled - Whether debug logging should be enabled
 */
export function setDebugEnabled(enabled: boolean): void {
	debugEnabled = enabled;
}

/**
 * Check if debug logging is currently enabled
 * @returns Whether debug logging is enabled
 */
export function isDebugEnabled(): boolean {
	return debugEnabled;
}

/**
 * Log a debug message to the console
 * Only logs when debug mode is enabled
 * @param args - Arguments to log
 */
export function debugLog(...args: unknown[]): void {
	if (debugEnabled) {
		// eslint-disable-next-line no-console
		console.log(LOG_PREFIX, ...args);
	}
}

/**
 * Log a debug warning to the console
 * Only logs when debug mode is enabled
 * @param args - Arguments to log
 */
export function debugWarn(...args: unknown[]): void {
	if (debugEnabled) {
		console.warn(LOG_PREFIX, ...args);
	}
}

/**
 * Log a debug error to the console
 * Only logs when debug mode is enabled
 * @param args - Arguments to log
 */
export function debugError(...args: unknown[]): void {
	if (debugEnabled) {
		console.error(LOG_PREFIX, ...args);
	}
}
