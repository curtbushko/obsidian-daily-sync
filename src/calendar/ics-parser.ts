import { App } from 'obsidian';
import * as ical from 'node-ical';
import { VEvent } from 'node-ical';
// eslint-disable-next-line import/no-nodejs-modules
import { readFile } from 'node:fs/promises';

/**
 * Represents a single calendar event from an ICS file
 */
export interface IcsEvent {
	/** Event title/summary */
	summary: string;
	/** Event start date/time */
	start: Date;
	/** Event end date/time */
	end: Date;
	/** Whether this is an all-day event */
	isAllDay: boolean;
}

/**
 * Result of parsing an ICS file
 */
export interface IcsParseResult {
	/** Array of parsed events */
	events: IcsEvent[];
	/** Optional array of parsing errors */
	errors?: string[];
}

/**
 * Custom error class for ICS parsing errors
 */
export class IcsParseError extends Error {
	/** Error code for programmatic handling */
	public code: string;

	constructor(message: string, code: string) {
		super(message);
		this.name = 'IcsParseError';
		this.code = code;
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Type guard to check if a calendar component is a VEvent
 */
function isVEvent(component: ical.CalendarComponent): component is VEvent {
	return component.type === 'VEVENT';
}

/**
 * Checks if an event is an all-day event
 */
function isAllDayEvent(event: VEvent): boolean {
	// All-day events have dates without time components
	// They are typically marked with VALUE=DATE in the ICS file
	// node-ical might preserve datetype metadata
	const eventWithMetadata = event as unknown as { datetype?: string };
	const startWithMetadata = event.start as unknown as { tz?: string };

	return eventWithMetadata.datetype === 'date' ||
	       startWithMetadata.tz === undefined;
}

/**
 * Converts a VEvent to an IcsEvent
 */
function convertToIcsEvent(event: VEvent): IcsEvent | null {
	try {
		// Extract summary (event title)
		const summary = event.summary || '';

		// Extract start and end times
		const start: Date = event.start;
		const end: Date = event.end || new Date(start.getTime() + 60 * 60 * 1000);

		const isAllDay = isAllDayEvent(event);

		return {
			summary,
			start,
			end,
			isAllDay
		};
	} catch {
		// If conversion fails for any reason, skip this event
		return null;
	}
}

/**
 * Parses an ICS file and extracts calendar events
 *
 * @param filePath - Absolute path to the ICS file
 * @param app - Obsidian App instance (for future vault integration)
 * @returns Promise resolving to IcsParseResult with events and optional errors
 * @throws IcsParseError if file cannot be read or parsed
 *
 * @example
 * ```typescript
 * const result = await parseIcsFile('/path/to/calendar.ics', app);
 * for (const event of result.events) {
 *   console.log(`${event.summary}: ${event.start} - ${event.end}`);
 * }
 * ```
 */
export async function parseIcsFile(filePath: string, app: App): Promise<IcsParseResult> {
	// Validate file path
	if (!filePath || filePath.trim() === '') {
		throw new IcsParseError('File path is required', 'INVALID_PATH');
	}

	try {
		// Read the file contents
		const fileContent = await readFile(filePath, 'utf-8');

		// Basic validation - check if it looks like an ICS file
		if (!fileContent.includes('BEGIN:VCALENDAR')) {
			throw new IcsParseError(
				'File is malformed or not a valid ICS file',
				'INVALID_FORMAT'
			);
		}

		// Parse the ICS content
		const parsed = ical.parseICS(fileContent);

		// Extract events
		const events: IcsEvent[] = [];

		for (const key in parsed) {
			const component = parsed[key];

			// Only process VEVENT components
			if (component && isVEvent(component)) {
				const icsEvent = convertToIcsEvent(component);
				if (icsEvent) {
					events.push(icsEvent);
				}
			}
		}

		return {
			events
		};
	} catch (err) {
		// Handle specific error types
		if (err instanceof IcsParseError) {
			throw err;
		}

		const error = err as Error & { code?: string };

		// File system errors
		if (error.code === 'ENOENT') {
			throw new IcsParseError(
				`File not found: ${filePath}`,
				'FILE_NOT_FOUND'
			);
		}

		if (error.code === 'EACCES') {
			throw new IcsParseError(
				`Permission denied: ${filePath}`,
				'PERMISSION_DENIED'
			);
		}

		// Generic parsing error
		throw new IcsParseError(
			`Failed to parse ICS file: ${error.message}`,
			'PARSE_ERROR'
		);
	}
}
