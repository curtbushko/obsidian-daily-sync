import { requestUrl } from 'obsidian';

// Check if we're in a Node.js environment (CLI mode)
const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;

/**
 * Fetch wrapper that works in both Obsidian and Node.js environments
 */
async function universalFetch(url: string): Promise<{ text: string; status?: number }> {
	if (isNodeJS) {
		// Use Node.js fetch (available in Node 18+)
		const response = await fetch(url);
		if (!response.ok) {
			const error = new Error(`HTTP ${response.status}`) as Error & { status: number };
			error.status = response.status;
			throw error;
		}
		return { text: await response.text(), status: response.status };
	} else {
		// Use Obsidian's requestUrl
		const response = await requestUrl({ url, method: 'GET' });
		return { text: response.text, status: response.status };
	}
}

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
 * Extracts calendar ID from various Google Calendar URL formats
 * @param url - Google Calendar URL
 * @returns Calendar ID or null if not found
 */
function extractCalendarId(url: string): string | null {
	try {
		const urlObj = new URL(url);

		// Check if already an iCal URL (ends with .ics)
		if (url.endsWith('.ics')) {
			// Extract from path like /ical/CALENDAR_ID/public/basic.ics
			const match = url.match(/\/ical\/([^/]+)\/(public|private-[^/]+)\/basic\.ics/);
			if (match && match[1]) {
				return decodeURIComponent(match[1]);
			}
		}

		// Check URL parameters for calendar ID
		// Format: ?src=CALENDAR_ID (plain text)
		const srcParam = urlObj.searchParams.get('src');
		if (srcParam) {
			return decodeURIComponent(srcParam);
		}

		// Format: ?cid=BASE64_ENCODED_CALENDAR_ID (base64 encoded)
		const cidParam = urlObj.searchParams.get('cid');
		if (cidParam) {
			try {
				// cid is base64 encoded, need to decode it
				const decoded = atob(cidParam);
				return decoded;
			} catch {
				// If base64 decode fails, try using it as-is
				return decodeURIComponent(cidParam);
			}
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Converts any Google Calendar URL format to iCal export URL
 * @param url - Original Google Calendar URL
 * @returns iCal export URL
 */
function convertToICalUrl(url: string): string {
	// If already an iCal URL, return as-is
	if (url.endsWith('.ics')) {
		return url;
	}

	// Extract calendar ID
	const calendarId = extractCalendarId(url);
	if (!calendarId) {
		throw new GoogleCalendarFetchError(
			'Could not extract calendar ID from URL. Please provide a valid Google Calendar URL.',
			'INVALID_URL'
		);
	}

	// Convert to iCal export URL
	// Use public/basic.ics as the default path
	return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
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
 * @param url - Google Calendar URL (can be sharable link or direct iCal URL)
 * @returns Promise resolving to FetchCalendarResult with raw iCal content
 * @throws GoogleCalendarFetchError if fetch fails or URL is invalid
 *
 * @example
 * ```typescript
 * // Direct iCal URL
 * const url1 = 'https://calendar.google.com/calendar/ical/test@gmail.com/private-abc/basic.ics';
 * const result1 = await fetchGoogleCalendar(url1);
 *
 * // Sharable embed URL
 * const url2 = 'https://calendar.google.com/calendar/embed?src=test@gmail.com';
 * const result2 = await fetchGoogleCalendar(url2);
 * ```
 */
export async function fetchGoogleCalendar(url: string): Promise<FetchCalendarResult> {
	// Validate URL
	validateGoogleCalendarUrl(url);

	// Convert to iCal URL if needed
	const icalUrl = convertToICalUrl(url);
	const wasConverted = icalUrl !== url;

	try {
		// Fetch the calendar using universal fetch (works in both Obsidian and CLI)
		const response = await universalFetch(icalUrl);

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
			let message = 'Calendar not found or URL is incorrect';

			// Provide better guidance if we converted an embed URL
			if (wasConverted) {
				message = 'Calendar not found. If this is a private calendar, please use the "Secret address in iCal format" URL from Google Calendar Settings → Integrate calendar, not the sharable embed URL.';
			}

			throw new GoogleCalendarFetchError(message, 'NOT_FOUND');
		}

		if (error.status === 403) {
			let message = 'Calendar is not accessible - it may not be public or shared';

			// Provide better guidance if we converted an embed URL
			if (wasConverted) {
				message = 'Calendar is not accessible. For private calendars, please use the "Secret address in iCal format" URL from Google Calendar Settings → Integrate calendar.';
			}

			throw new GoogleCalendarFetchError(message, 'FORBIDDEN');
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
