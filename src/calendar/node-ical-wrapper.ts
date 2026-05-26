/**
 * Wrapper for node-ical to handle CommonJS/ESM import issues
 */

// Try to import node-ical correctly based on environment
let ical: any;

const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNodeJS) {
	// In Node.js CLI context, use dynamic import for CommonJS module
	try {
		// @ts-ignore
		ical = await import('node-ical');
		// Handle both default and named exports
		if (ical.default) {
			ical = ical.default;
		}
	} catch (e) {
		console.error('Failed to import node-ical:', e);
		throw e;
	}
} else {
	// In Obsidian context, use regular import
	ical = await import('node-ical');
}

export { ical };
export type { VEvent } from 'node-ical';
