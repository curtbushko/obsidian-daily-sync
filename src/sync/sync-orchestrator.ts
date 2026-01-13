/**
 * Sync Orchestrator
 *
 * Orchestrates the complete sync workflow: fetching from calendar sources,
 * finding/creating daily notes, and inserting meetings with proper error handling.
 */
import { App, TFile, moment } from 'obsidian';
import type { DailySyncSettings } from '../settings';
import { parseIcsFile, fetchAndParseGoogleCalendar, getTodaysMeetings } from '../calendar/ics-parser';
import { findOrCreateDailyNote } from '../daily-note/daily-note-finder';
import { ensureSectionExists } from '../daily-note/section-creator';
import { insertMeetingsIntoNote } from '../daily-note/meeting-inserter';

/**
 * Error thrown when sync operation fails
 */
export class SyncError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message);
		this.name = 'SyncError';
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SyncError);
		}
	}
}

/**
 * Result from syncing a single calendar source
 */
export interface SourceResult {
	/** Whether this source was configured */
	enabled: boolean;
	/** Whether the sync succeeded */
	success: boolean;
	/** Number of meetings added */
	meetingsAdded: number;
	/** Error message if failed */
	error?: string;
}

/**
 * Result from the complete sync operation
 */
export interface SyncResult {
	/** True if at least one source succeeded */
	success: boolean;
	/** The daily note that was synced */
	dailyNote: TFile;
	/** Result from local ICS calendar */
	localCalendar: SourceResult;
	/** Result from Google Calendar */
	googleCalendar: SourceResult;
}

/**
 * Checks if local ICS is configured
 */
function isLocalIcsConfigured(settings: DailySyncSettings): boolean {
	return settings.icsFilePath.trim().length > 0;
}

/**
 * Checks if Google Calendar is configured
 */
function isGoogleCalendarConfigured(settings: DailySyncSettings): boolean {
	return settings.googleCalendarLink.trim().length > 0;
}

/**
 * Syncs local ICS calendar to daily note
 */
async function syncLocalIcs(
	app: App,
	dailyNote: TFile,
	settings: DailySyncSettings
): Promise<SourceResult> {
	const result: SourceResult = {
		enabled: true,
		success: false,
		meetingsAdded: 0
	};

	try {
		// Parse ICS file
		const parseResult = await parseIcsFile(settings.icsFilePath, app);

		// Filter for today's meetings
		const today = moment().toDate();
		const todaysMeetings = getTodaysMeetings(parseResult.events, today);

		// Ensure section exists
		await ensureSectionExists(app, dailyNote, settings.localCalendarSection, 2);

		// Insert meetings
		await insertMeetingsIntoNote(app, dailyNote, todaysMeetings, settings.localCalendarSection);

		result.success = true;
		result.meetingsAdded = todaysMeetings.length;
	} catch (error) {
		result.success = false;
		result.error = error instanceof Error ? error.message : String(error);
	}

	return result;
}

/**
 * Syncs Google Calendar to daily note
 */
async function syncGoogleCalendar(
	app: App,
	dailyNote: TFile,
	settings: DailySyncSettings
): Promise<SourceResult> {
	const result: SourceResult = {
		enabled: true,
		success: false,
		meetingsAdded: 0
	};

	try {
		// Fetch and parse Google Calendar
		const parseResult = await fetchAndParseGoogleCalendar(settings.googleCalendarLink);

		// Filter for today's meetings
		const today = moment().toDate();
		const todaysMeetings = getTodaysMeetings(parseResult.events, today);

		// Ensure section exists
		await ensureSectionExists(app, dailyNote, settings.googleCalendarSection, 2);

		// Insert meetings
		await insertMeetingsIntoNote(app, dailyNote, todaysMeetings, settings.googleCalendarSection);

		result.success = true;
		result.meetingsAdded = todaysMeetings.length;
	} catch (error) {
		result.success = false;
		result.error = error instanceof Error ? error.message : String(error);
	}

	return result;
}

/**
 * Syncs meetings from configured calendar sources to today's daily note.
 *
 * This is the main orchestration function that:
 * 1. Validates at least one source is configured
 * 2. Finds or creates today's daily note
 * 3. Syncs from local ICS (if configured)
 * 4. Syncs from Google Calendar (if configured)
 * 5. Returns aggregated results
 *
 * Sources are processed in parallel for performance. Each source's errors
 * are isolated - one source failing doesn't prevent the other from syncing.
 *
 * @param app - The Obsidian App instance
 * @param settings - Plugin settings with calendar source configuration
 * @returns SyncResult with success status and details for each source
 * @throws {SyncError} - If no sources configured or daily note can't be created
 *
 * @example
 * ```typescript
 * const result = await syncMeetingsToDaily(app, plugin.settings);
 * if (result.success) {
 *   console.log(`Local: ${result.localCalendar.meetingsAdded} meetings`);
 *   console.log(`Google: ${result.googleCalendar.meetingsAdded} meetings`);
 * }
 * ```
 */
export async function syncMeetingsToDaily(
	app: App,
	settings: DailySyncSettings
): Promise<SyncResult> {
	// Check if at least one source is configured
	const hasLocalIcs = isLocalIcsConfigured(settings);
	const hasGoogleCalendar = isGoogleCalendarConfigured(settings);

	if (!hasLocalIcs && !hasGoogleCalendar) {
		throw new SyncError(
			'No calendar sources configured. Please configure at least one calendar source in settings.'
		);
	}

	// Get or create today's daily note
	let dailyNote: TFile;
	try {
		dailyNote = await findOrCreateDailyNote(app);
	} catch (error) {
		throw new SyncError(
			`Failed to find or create daily note: ${error instanceof Error ? error.message : String(error)}`,
			error
		);
	}

	// Initialize results
	const localResult: SourceResult = {
		enabled: hasLocalIcs,
		success: false,
		meetingsAdded: 0
	};

	const googleResult: SourceResult = {
		enabled: hasGoogleCalendar,
		success: false,
		meetingsAdded: 0
	};

	// Sync from both sources in parallel
	const promises: Promise<SourceResult>[] = [];

	if (hasLocalIcs) {
		promises.push(syncLocalIcs(app, dailyNote, settings));
	}

	if (hasGoogleCalendar) {
		promises.push(syncGoogleCalendar(app, dailyNote, settings));
	}

	// Wait for all sources to complete
	const results = await Promise.allSettled(promises);

	// Aggregate results
	let resultIndex = 0;
	if (hasLocalIcs) {
		const result = results[resultIndex++];
		if (result && result.status === 'fulfilled') {
			Object.assign(localResult, result.value);
		}
	}

	if (hasGoogleCalendar) {
		const result = results[resultIndex++];
		if (result && result.status === 'fulfilled') {
			Object.assign(googleResult, result.value);
		}
	}

	// Determine overall success
	const overallSuccess = localResult.success || googleResult.success;

	return {
		success: overallSuccess,
		dailyNote,
		localCalendar: localResult,
		googleCalendar: googleResult
	};
}
