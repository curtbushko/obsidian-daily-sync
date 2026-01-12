import { App } from 'obsidian';
import * as ical from 'node-ical';
import { VEvent } from 'node-ical';
// eslint-disable-next-line import/no-nodejs-modules
import { readFile } from 'node:fs/promises';
import { fetchGoogleCalendar } from './google-calendar-fetcher';

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
 * Checks if two dates are on the same day (ignoring time)
 */
function isSameDay(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear() &&
	       date1.getMonth() === date2.getMonth() &&
	       date1.getDate() === date2.getDate();
}

/**
 * Filters events to only those occurring on a specific date
 *
 * @param events - Array of ICS events to filter
 * @param targetDate - Date to filter for (defaults to today)
 * @returns Filtered events sorted by start time (all-day events first)
 *
 * @example
 * ```typescript
 * const allEvents = await parseIcsFile('/path/to/calendar.ics', app);
 * const todaysMeetings = getTodaysMeetings(allEvents.events);
 * for (const meeting of todaysMeetings) {
 *   console.log(`${meeting.summary} at ${meeting.start.toLocaleTimeString()}`);
 * }
 * ```
 */
export function getTodaysMeetings(events: IcsEvent[], targetDate?: Date): IcsEvent[] {
	// Default to today if no target date provided
	const target = targetDate || new Date();

	// Filter events that occur on the target date
	const filteredEvents = events.filter(event => {
		// For all-day events, check if the target date falls within the event's range
		if (event.isAllDay) {
			// All-day events: check if target date is on the start date
			return isSameDay(event.start, target);
		}

		// For regular events, check if start time is on target date
		return isSameDay(event.start, target);
	});

	// Sort events: all-day events first, then by start time
	return filteredEvents.sort((a, b) => {
		// All-day events come before regular events
		if (a.isAllDay && !b.isAllDay) {
			return -1;
		}
		if (!a.isAllDay && b.isAllDay) {
			return 1;
		}

		// Otherwise, sort by start time
		return a.start.getTime() - b.start.getTime();
	});
}

/**
 * Parses iCal content string and extracts calendar events
 *
 * @param content - Raw iCal content as string
 * @returns IcsParseResult with events and optional errors
 * @throws IcsParseError if content is invalid or cannot be parsed
 *
 * @example
 * ```typescript
 * const icalContent = 'BEGIN:VCALENDAR...END:VCALENDAR';
 * const result = parseIcsContent(icalContent);
 * for (const event of result.events) {
 *   console.log(`${event.summary}: ${event.start} - ${event.end}`);
 * }
 * ```
 */
export function parseIcsContent(content: string): IcsParseResult {
	// Basic validation - check if it looks like an ICS file
	if (!content || content.trim() === '' || !content.includes('BEGIN:VCALENDAR')) {
		throw new IcsParseError(
			'Content is malformed or not a valid ICS format',
			'INVALID_FORMAT'
		);
	}

	try {
		// Parse the ICS content
		const parsed = ical.parseICS(content);

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

		const error = err as Error;

		// Generic parsing error
		throw new IcsParseError(
			`Failed to parse ICS content: ${error.message}`,
			'PARSE_ERROR'
		);
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

		// Parse using the core parsing function
		return parseIcsContent(fileContent);
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

/**
 * Fetches and parses a Google Calendar from a shareable iCal link
 *
 * @param url - Google Calendar shareable link (must be .ics format)
 * @returns Promise resolving to IcsParseResult with events
 * @throws GoogleCalendarFetchError if fetch fails
 * @throws IcsParseError if parsing fails
 *
 * @example
 * ```typescript
 * const url = 'https://calendar.google.com/calendar/ical/test@gmail.com/private-abc/basic.ics';
 * const result = await fetchAndParseGoogleCalendar(url);
 * console.log(`Found ${result.events.length} events`);
 * ```
 */
export async function fetchAndParseGoogleCalendar(url: string): Promise<IcsParseResult> {
	// Fetch the Google Calendar iCal content
	const fetchResult = await fetchGoogleCalendar(url);

	// Parse the iCal content
	return parseIcsContent(fetchResult.content);
}
