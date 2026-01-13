/**
 * Error Handler
 *
 * Centralized error handling with user-friendly messages and actionable suggestions.
 * Converts technical errors into user-facing error information.
 */
import { IcsParseError } from '../calendar/ics-parser';
import { GoogleCalendarFetchError } from '../calendar/google-calendar-fetcher';
import { DailyNotesNotEnabledError, DailyNoteCreationError } from '../daily-note/daily-note-finder';
import { SectionNotFoundError, MeetingInsertionError } from '../daily-note/meeting-inserter';
import { SectionCreationError } from '../daily-note/section-creator';
import { SyncError } from '../sync/sync-orchestrator';

/**
 * Base error class with user-friendly properties
 */
export class DailySyncError extends Error {
	/** Error code for programmatic handling */
	public code: string;
	/** User-friendly error message */
	public userMessage: string;
	/** Actionable suggestions for the user */
	public suggestions: string[];
	/** Original error that caused this error */
	public cause?: unknown;

	constructor(
		code: string,
		message: string,
		userMessage: string,
		suggestions: string[],
		cause?: unknown
	) {
		super(message);
		this.name = 'DailySyncError';
		this.code = code;
		this.userMessage = userMessage;
		this.suggestions = suggestions;
		this.cause = cause;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, DailySyncError);
		}
	}
}

/**
 * User-facing error information
 */
export interface UserFacingError {
	/** Short error title */
	title: string;
	/** User-friendly error message */
	message: string;
	/** Actionable suggestions */
	suggestions: string[];
}

/**
 * Formats an error for display to the user
 *
 * Converts technical errors into user-friendly messages with actionable suggestions.
 * Handles all known error types and provides sensible defaults for unknown errors.
 *
 * @param error - Any error type (Error, string, or unknown)
 * @returns User-facing error information with title, message, and suggestions
 *
 * @example
 * ```typescript
 * try {
 *   await syncMeetingsToDaily(app, settings);
 * } catch (error) {
 *   const userError = formatErrorForUser(error);
 *   new Notice(`${userError.title}: ${userError.message}`);
 *   userError.suggestions.forEach(s => console.log(s));
 * }
 * ```
 */
export function formatErrorForUser(error: unknown): UserFacingError {
	// Handle IcsParseError
	if (error instanceof IcsParseError) {
		return formatIcsParseError(error);
	}

	// Handle GoogleCalendarFetchError
	if (error instanceof GoogleCalendarFetchError) {
		return formatGoogleCalendarFetchError(error);
	}

	// Handle DailyNotesNotEnabledError
	if (error instanceof DailyNotesNotEnabledError) {
		return {
			title: 'Daily Notes Plugin Required',
			message: 'The Daily Notes core plugin must be enabled to sync meetings.',
			suggestions: [
				'Enable the Daily Notes core plugin in Settings → Core plugins',
				'Restart Obsidian if you just enabled it'
			]
		};
	}

	// Handle DailyNoteCreationError
	if (error instanceof DailyNoteCreationError) {
		return {
			title: 'Cannot Create Daily Note',
			message: 'Unable to create today\'s daily note. This may be due to Daily Notes configuration.',
			suggestions: [
				'Check Daily Notes settings (template, folder location)',
				'Try creating a daily note manually to test your configuration',
				'Ensure you have write permissions in the daily notes folder'
			]
		};
	}

	// Handle SectionNotFoundError
	if (error instanceof SectionNotFoundError) {
		return {
			title: 'Section Not Found',
			message: 'The specified section doesn\'t exist in today\'s daily note.',
			suggestions: [
				'Check the section name in plugin settings',
				'Make sure the section heading exists in your daily note',
				'The plugin will create the section automatically - try running sync again'
			]
		};
	}

	// Handle MeetingInsertionError
	if (error instanceof MeetingInsertionError) {
		return {
			title: 'Cannot Insert Meetings',
			message: 'Failed to add meetings to your daily note.',
			suggestions: [
				'Check that you have write permissions for the daily note',
				'Ensure the daily note is not open in an external editor',
				'Try running the sync command again'
			]
		};
	}

	// Handle SectionCreationError
	if (error instanceof SectionCreationError) {
		return {
			title: 'Cannot Create Section',
			message: 'Failed to create the meetings section in your daily note.',
			suggestions: [
				'Check that you have write permissions for the daily note',
				'Verify the section name in settings doesn\'t contain invalid characters',
				'Try adding the section manually to your daily note'
			]
		};
	}

	// Handle SyncError
	if (error instanceof SyncError) {
		return formatSyncError(error);
	}

	// Handle standard Error
	if (error instanceof Error) {
		return {
			title: 'Unexpected Error',
			message: error.message,
			suggestions: [
				'Try running the sync command again',
				'Check the console for more details (Ctrl+Shift+I)',
				'Report this issue if it persists'
			]
		};
	}

	// Handle string errors
	if (typeof error === 'string') {
		return {
			title: 'Unexpected Error',
			message: error,
			suggestions: [
				'Try running the sync command again',
				'Check the console for more details (Ctrl+Shift+I)'
			]
		};
	}

	// Handle unknown error types
	return {
		title: 'Unexpected Error',
		message: 'An unknown error occurred.',
		suggestions: [
			'Try running the sync command again',
			'Check the console for more details (Ctrl+Shift+I)',
			'Report this issue if it persists'
		]
	};
}

/**
 * Formats IcsParseError based on error code
 */
function formatIcsParseError(error: IcsParseError): UserFacingError {
	switch (error.code) {
		case 'FILE_NOT_FOUND':
			return {
				title: 'Calendar File Not Found',
				message: 'The local calendar file could not be found.',
				suggestions: [
					'Check that the file path in settings is correct',
					'Verify the file exists at the specified location',
					'Make sure the file path is absolute (e.g., /Users/name/calendar.ics)'
				]
			};

		case 'PERMISSION_DENIED':
			return {
				title: 'Permission Denied',
				message: 'Cannot read the calendar file due to insufficient permissions.',
				suggestions: [
					'Check file permissions',
					'Ensure Obsidian has permission to access the file',
					'Try moving the calendar file to a different location'
				]
			};

		case 'INVALID_PATH':
			return {
				title: 'Invalid File Path',
				message: 'The calendar file path is invalid or empty.',
				suggestions: [
					'Enter a valid file path in plugin settings',
					'The path should be absolute (e.g., /Users/name/calendar.ics)',
					'Use the file browser to select the calendar file'
				]
			};

		case 'INVALID_FORMAT':
			return {
				title: 'Invalid Calendar Format',
				message: 'The file is not in a valid calendar format.',
				suggestions: [
					'Verify the file is a valid .ics calendar file',
					'Try exporting the calendar again from your calendar application',
					'Check that the file isn\'t corrupted'
				]
			};

		case 'PARSE_ERROR':
		default:
			return {
				title: 'Calendar Parsing Error',
				message: 'Failed to parse the calendar file.',
				suggestions: [
					'Verify the file is a valid .ics calendar file',
					'Try exporting the calendar again from your calendar application',
					'Check that the file isn\'t corrupted or partially downloaded'
				]
			};
	}
}

/**
 * Formats GoogleCalendarFetchError based on error code
 */
function formatGoogleCalendarFetchError(error: GoogleCalendarFetchError): UserFacingError {
	switch (error.code) {
		case 'INVALID_URL':
			return {
				title: 'Invalid Calendar URL',
				message: 'The Google Calendar URL is not valid.',
				suggestions: [
					'Verify the URL is a Google Calendar shareable link ending in .ics',
					'Make sure you copied the entire URL',
					'Get the secret iCal address from Google Calendar settings'
				]
			};

		case 'NOT_FOUND':
			return {
				title: 'Calendar Not Found',
				message: 'The Google Calendar could not be found or the URL is incorrect.',
				suggestions: [
					'Check that the calendar URL is correct',
					'Verify the calendar still exists in Google Calendar',
					'Generate a new secret iCal address if the old one was revoked'
				]
			};

		case 'FORBIDDEN':
			return {
				title: 'Calendar Not Accessible',
				message: 'The Google Calendar is not accessible. It may not be publicly shared.',
				suggestions: [
					'Make sure the calendar is publicly shared',
					'Check Google Calendar sharing settings',
					'Generate a new secret iCal address with public access'
				]
			};

		case 'SERVER_ERROR':
			return {
				title: 'Calendar Server Error',
				message: 'Google Calendar is experiencing server issues.',
				suggestions: [
					'Try again in a few minutes',
					'Check Google Calendar status page for outages',
					'Use local calendar sync as an alternative temporarily'
				]
			};

		case 'NETWORK_ERROR':
			return {
				title: 'Network Error',
				message: 'Cannot connect to Google Calendar. Check your internet connection.',
				suggestions: [
					'Check your internet connection',
					'Verify you can access Google Calendar in your browser',
					'Check if a firewall or proxy is blocking the connection'
				]
			};

		case 'INVALID_RESPONSE':
		default:
			return {
				title: 'Invalid Calendar Response',
				message: 'Google Calendar returned an invalid response.',
				suggestions: [
					'Verify the URL is a Google Calendar secret iCal address',
					'Try generating a new secret iCal address',
					'Check that the calendar isn\'t empty'
				]
			};
	}
}

/**
 * Formats SyncError based on message content
 */
function formatSyncError(error: SyncError): UserFacingError {
	// Check for specific error patterns in the message
	if (error.message.includes('No calendar sources configured')) {
		return {
			title: 'No Calendar Sources',
			message: 'No calendar sources are configured. Add at least one calendar to sync.',
			suggestions: [
				'Configure at least one calendar source in plugin settings',
				'Add either a local .ics file path or Google Calendar URL',
				'Open Settings → Community plugins → Daily Sync'
			]
		};
	}

	if (error.message.includes('Failed to find or create daily note')) {
		return {
			title: 'Daily Note Error',
			message: 'Cannot access today\'s daily note.',
			suggestions: [
				'Enable the Daily Notes core plugin in Settings → Core plugins',
				'Check Daily Notes settings (template, folder location)',
				'Try creating a daily note manually to test your configuration'
			]
		};
	}

	// Generic sync error
	return {
		title: 'Sync Error',
		message: 'Failed to sync meetings to your daily note.',
		suggestions: [
			'Check plugin settings are correct',
			'Verify calendar sources are accessible',
			'Try running the sync command again',
			'Check the console for more details (Ctrl+Shift+I)'
		]
	};
}
