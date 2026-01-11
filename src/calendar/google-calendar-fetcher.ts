import { requestUrl } from 'obsidian';

/**
 * Result of fetching a Google Calendar
 */
export interface FetchCalendarResult {
	/** Raw iCal content as string */
	content: string;
	/** Whether the fetch was successful */
	success: boolean;
}

/**
 * Custom error class for Google Calendar fetch errors
 */
export class GoogleCalendarFetchError extends Error {
	/** Error code for programmatic handling */
	public code: string;

	constructor(message: string, code: string) {
		super(message);
		this.name = 'GoogleCalendarFetchError';
		this.code = code;
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Validates a Google Calendar URL
 * @param url - URL to validate
 * @throws GoogleCalendarFetchError if URL is invalid
 */
function validateGoogleCalendarUrl(url: string): void {
	// Check if URL is empty or whitespace
	if (!url || url.trim() === '') {
		throw new GoogleCalendarFetchError(
			'URL is required and cannot be empty',
			'INVALID_URL'
		);
	}

	// Check if URL is a Google Calendar URL
	if (!url.includes('calendar.google.com') && !url.includes('google.com/calendar')) {
		throw new GoogleCalendarFetchError(
			'URL must be a Google Calendar URL',
			'INVALID_URL'
		);
	}

	// Check if URL ends with .ics
	if (!url.endsWith('.ics')) {
		throw new GoogleCalendarFetchError(
			'URL must end with .ics',
			'INVALID_URL'
		);
	}
}

/**
 * Validates the iCal response content
 * @param content - Content to validate
 * @throws GoogleCalendarFetchError if content is invalid
 */
function validateICalContent(content: string): void {
	// Check if content is empty
	if (!content || content.trim() === '') {
		throw new GoogleCalendarFetchError(
			'Response is empty',
			'INVALID_RESPONSE'
		);
	}

	// Check if content contains VCALENDAR
	if (!content.includes('BEGIN:VCALENDAR')) {
		throw new GoogleCalendarFetchError(
			'Response is not a valid iCal format (missing BEGIN:VCALENDAR)',
			'INVALID_RESPONSE'
		);
	}
}

/**
 * Fetches iCal content from a Google Calendar shareable link
 *
 * @param url - Google Calendar shareable link (must be .ics format)
 * @returns Promise resolving to FetchCalendarResult with raw iCal content
 * @throws GoogleCalendarFetchError if fetch fails or URL is invalid
 *
 * @example
 * ```typescript
 * const url = 'https://calendar.google.com/calendar/ical/test@gmail.com/private-abc/basic.ics';
 * const result = await fetchGoogleCalendar(url);
 * console.log(result.content); // Raw iCal content
 * ```
 */
export async function fetchGoogleCalendar(url: string): Promise<FetchCalendarResult> {
	// Validate URL
	validateGoogleCalendarUrl(url);

	try {
		// Fetch the calendar using Obsidian's requestUrl
		const response = await requestUrl({
			url,
			method: 'GET'
		});

		// Get the text content
		const content = response.text;

		// Validate the response content
		validateICalContent(content);

		return {
			content,
			success: true
		};
	} catch (err) {
		// Handle specific error types
		if (err instanceof GoogleCalendarFetchError) {
			throw err;
		}

		const error = err as Error & { status?: number };

		// Handle HTTP status errors
		if (error.status === 404) {
			throw new GoogleCalendarFetchError(
				'Calendar not found or URL is incorrect',
				'NOT_FOUND'
			);
		}

		if (error.status === 403) {
			throw new GoogleCalendarFetchError(
				'Calendar is not accessible - it may not be public or shared',
				'FORBIDDEN'
			);
		}

		if (error.status && error.status >= 500) {
			throw new GoogleCalendarFetchError(
				'Google Calendar server error - please try again later',
				'SERVER_ERROR'
			);
		}

		// Generic network error
		throw new GoogleCalendarFetchError(
			`Network error: ${error.message}`,
			'NETWORK_ERROR'
		);
	}
}
