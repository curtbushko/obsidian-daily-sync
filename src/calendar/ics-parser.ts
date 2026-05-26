import { App } from 'obsidian';
import * as icalImport from 'node-ical';

// Handle both CommonJS and ESM imports of node-ical
const ical = (icalImport as any).default || icalImport;

import { VEvent } from 'node-ical';
// eslint-disable-next-line import/no-nodejs-modules
import { readFile } from 'node:fs/promises';
import { fetchGoogleCalendar } from './google-calendar-fetcher';
import { debugLog } from '../utils/debug-logger';

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
 * Checks if a VEvent has a recurrence rule
 */
function hasRecurrenceRule(event: VEvent): boolean {
	return event.rrule !== undefined && event.rrule !== null;
}

/**
 * Expands a recurring event into individual occurrences within a date range.
 * Also handles recurrence exceptions (modified occurrences) stored in event.recurrences.
 *
 * @param event - The VEvent with an RRULE
 * @param rangeStart - Start of the date range to expand
 * @param rangeEnd - End of the date range to expand
 * @returns Array of IcsEvents for each occurrence
 */
function expandRecurringEvent(event: VEvent, rangeStart: Date, rangeEnd: Date): IcsEvent[] {
	const expandedEvents: IcsEvent[] = [];

	if (!event.rrule) {
		return expandedEvents;
	}

	// Get recurrence exceptions (modified occurrences) from node-ical
	// These are stored as event.recurrences keyed by original occurrence date
	const eventWithRecurrences = event as unknown as {
		recurrences?: Record<string, VEvent>;
		exdate?: Record<string, Date>;
	};
	const recurrences = eventWithRecurrences.recurrences || {};
	const exdates = eventWithRecurrences.exdate || {};

	// Build a set of dates that have been modified or excluded
	const modifiedDates = new Set<string>();
	for (const dateKey in recurrences) {
		modifiedDates.add(dateKey);
	}
	for (const dateKey in exdates) {
		modifiedDates.add(dateKey);
	}

	try {
		// Get occurrences within the date range
		const occurrences = event.rrule.between(rangeStart, rangeEnd, true);

		// Calculate the duration of the original event
		const originalStart = event.start;
		const originalEnd = event.end || new Date(originalStart.getTime() + 60 * 60 * 1000);
		const duration = originalEnd.getTime() - originalStart.getTime();

		const isAllDay = isAllDayEvent(event);
		const summary = event.summary || '';

		// Create an IcsEvent for each occurrence (excluding modified/excluded ones)
		for (const occurrence of occurrences) {
			// Generate date key in YYYY-MM-DD format to match node-ical's recurrences keys
			const isoString = occurrence.toISOString();
			const dateKey = isoString.split('T')[0] || isoString;

			// Skip if this occurrence has been modified (will be added from recurrences)
			// or excluded (EXDATE)
			if (modifiedDates.has(dateKey)) {
				continue;
			}

			const occurrenceEnd = new Date(occurrence.getTime() + duration);

			expandedEvents.push({
				summary,
				start: occurrence,
				end: occurrenceEnd,
				isAllDay
			});
		}

		// Add recurrence exceptions (modified occurrences)
		// These may have different start times or other modifications
		for (const dateKey in recurrences) {
			const recurrence = recurrences[dateKey];
			if (!recurrence) continue;

			const recStart = recurrence.start;
			const recEnd = recurrence.end || new Date(recStart.getTime() + duration);

			// Check if this recurrence falls within our date range
			if (recStart >= rangeStart && recStart <= rangeEnd) {
				const recIsAllDay = isAllDayEvent(recurrence);
				const recSummary = recurrence.summary || summary;

				expandedEvents.push({
					summary: recSummary,
					start: recStart,
					end: recEnd,
					isAllDay: recIsAllDay
				});

				debugLog('Added recurrence exception:', recSummary, 'on', recStart.toISOString());
			}
		}

		const recurrenceCount = Object.keys(recurrences).length;
		debugLog('Expanded recurring event:', summary, '- found', expandedEvents.length, 'occurrences in range',
			recurrenceCount > 0 ? `(including ${recurrenceCount} recurrence exceptions)` : '');
	} catch (error) {
		debugLog('Failed to expand recurring event:', event.summary, error);
	}

	return expandedEvents;
}

/**
 * Checks if an event is an all-day event
 */
function isAllDayEvent(event: VEvent): boolean {
	// All-day events have dates without time components
	// They are typically marked with VALUE=DATE in the ICS file
	// node-ical sets datetype to 'date' for all-day events
	const eventWithMetadata = event as unknown as { datetype?: string };

	// The datetype property is the reliable indicator from node-ical
	// 'date' = all-day event (no time component in ICS)
	// 'date-time' = timed event
	// Note: We should NOT fall back to checking tz === undefined,
	// as many local calendar apps export timed events without timezone info
	return eventWithMetadata.datetype === 'date';
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
 * Checks if two dates are on the same calendar day in LOCAL timezone.
 *
 * We use local timezone because:
 * - The target date comes from the user's daily note (local context)
 * - Users expect events to match their local calendar view
 */
function isSameDay(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear() &&
	       date1.getMonth() === date2.getMonth() &&
	       date1.getDate() === date2.getDate();
}

/**
 * Checks if an event date falls on the same calendar day as the target date.
 *
 * This handles the common case where calendar events are stored in UTC
 * but we want to match them to a local date. We compare the LOCAL date
 * components since that's what users see in their calendar apps.
 *
 * For all-day events (which have no time component), we need to be careful
 * because they're often stored as midnight UTC which can shift days.
 */
function eventMatchesTargetDate(event: IcsEvent, target: Date): boolean {
	const eventStart = event.start;

	// For all-day events, compare using UTC to avoid timezone shifts
	// All-day events are typically stored as DATE values (no time) which
	// get parsed as midnight UTC - we don't want timezone conversion
	if (event.isAllDay) {
		return eventStart.getUTCFullYear() === target.getFullYear() &&
		       eventStart.getUTCMonth() === target.getMonth() &&
		       eventStart.getUTCDate() === target.getDate();
	}

	// For timed events, use local time comparison since users expect
	// events to appear on their local calendar day
	return isSameDay(eventStart, target);
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

	// Debug: Log target date details
	debugLog('Target date for filtering:', {
		date: target.toISOString(),
		year: target.getFullYear(),
		month: target.getMonth() + 1,
		day: target.getDate(),
		localString: target.toLocaleDateString()
	});

	// Debug: Sample first few events to see their date formats
	if (events.length > 0) {
		const sampleEvents = events.slice(0, 5);
		debugLog('Sample events (first 5):', sampleEvents.map(e => ({
			summary: e.summary,
			start: e.start.toISOString(),
			startYear: e.start.getFullYear(),
			startMonth: e.start.getMonth() + 1,
			startDay: e.start.getDate(),
			isAllDay: e.isAllDay
		})));
	}

	// Debug: Find events near target date (within 2 days) to help diagnose
	const targetTime = target.getTime();
	const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
	const nearbyEvents = events.filter(e => {
		const diff = Math.abs(e.start.getTime() - targetTime);
		return diff < twoDaysMs;
	});
	if (nearbyEvents.length > 0) {
		debugLog('Events within 2 days of target:', nearbyEvents.slice(0, 10).map(e => ({
			summary: e.summary,
			startISO: e.start.toISOString(),
			startLocal: e.start.toLocaleString(),
			eventLocalDay: e.start.getDate(),
			eventUTCDay: e.start.getUTCDate(),
			targetDay: target.getDate(),
			wouldMatch: eventMatchesTargetDate(e, target),
			isAllDay: e.isAllDay
		})));
	}

	// Filter events that occur on the target date
	const filteredEvents = events.filter(event => {
		return eventMatchesTargetDate(event, target);
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
 * Sanitizes ICS content to fix common issues before parsing
 * @param content - Raw ICS content
 * @returns Sanitized ICS content
 */
function sanitizeIcsContent(content: string): string {
	// Fix RRULE UNTIL dates that are not in UTC format
	// The iCalendar spec (RFC 5545) requires UNTIL to be in UTC format (with Z suffix)
	// However, some calendar providers send UNTIL without Z, which causes parsing errors

	// Handle all variations of RRULE with UNTIL dates (DATE-TIME format: YYYYMMDDTHHmmss)
	// Must handle: middle of line, end of line, with/without other parameters
	let sanitized = content;

	// Pattern 1: UNTIL with DATE-TIME followed by semicolon or newline (allow optional whitespace)
	// Matches: UNTIL=20261231T235959; or UNTIL=20261231T235959 ; or UNTIL=20261231T235959\r\n
	// Ensures we don't add Z if it's already there
	sanitized = sanitized.replace(
		/UNTIL=(\d{8}T\d{6})(?!Z)\s*([;\r\n])/g,
		'UNTIL=$1Z$2'
	);

	// Pattern 2: UNTIL with DATE-TIME at end of line (with possible trailing whitespace)
	sanitized = sanitized.replace(
		/UNTIL=(\d{8}T\d{6})(?!Z)\s*$/gm,
		'UNTIL=$1Z'
	);

	// Pattern 3: UNTIL with DATE format (YYYYMMDD only, no time) followed by delimiter
	// Matches: UNTIL=20261231; or UNTIL=20261231\r\n
	sanitized = sanitized.replace(
		/UNTIL=(\d{8})(?![\dTZ])\s*([;\r\n])/g,
		'UNTIL=$1Z$2'
	);

	// Pattern 4: UNTIL with DATE at end of line
	sanitized = sanitized.replace(
		/UNTIL=(\d{8})(?![\dTZ])\s*$/gm,
		'UNTIL=$1Z'
	);

	return sanitized;
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
		// Sanitize the content to fix common issues
		const sanitized = sanitizeIcsContent(content);

		// Parse the ICS content
		const parsed = ical.parseICS(sanitized);

		// Define date range for expanding recurring events
		// Use 1 year before and after today to catch relevant recurrences
		const now = new Date();
		const rangeStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
		const rangeEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

		// Extract events
		const events: IcsEvent[] = [];
		let recurringCount = 0;

		for (const key in parsed) {
			const component = parsed[key];

			// Only process VEVENT components
			if (component && isVEvent(component)) {
				// Check if this is a recurring event
				if (hasRecurrenceRule(component)) {
					// Expand recurring event into individual occurrences
					const expandedEvents = expandRecurringEvent(component, rangeStart, rangeEnd);
					events.push(...expandedEvents);
					recurringCount++;
				} else {
					// Non-recurring event - convert directly
					const icsEvent = convertToIcsEvent(component);
					if (icsEvent) {
						events.push(icsEvent);
					}
				}
			}
		}

		if (recurringCount > 0) {
			debugLog('Processed', recurringCount, 'recurring event(s), total events after expansion:', events.length);
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
