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
import { getTargetDateForSync } from '../daily-note/date-detector';

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
 * Checks if local ICS is configured and enabled
 */
function isLocalIcsConfigured(settings: DailySyncSettings): boolean {
	return settings.enableLocalCalendar && settings.icsFilePath.trim().length > 0;
}

/**
 * Checks if Google Calendar is configured and enabled
 */
function isGoogleCalendarConfigured(settings: DailySyncSettings): boolean {
	return settings.enableGoogleCalendar && settings.googleCalendarLink.trim().length > 0;
}

/**
 * Syncs local ICS calendar to daily note
 */
async function syncLocalIcs(
	app: App,
	dailyNote: TFile,
	settings: DailySyncSettings,
	targetDate: Date
): Promise<SourceResult> {
	const result: SourceResult = {
		enabled: true,
		success: false,
		meetingsAdded: 0
	};

	try {
		console.log('Daily Sync - Syncing local ICS calendar from:', settings.icsFilePath);

		// Parse ICS file
		const parseResult = await parseIcsFile(settings.icsFilePath, app);
		console.log('Daily Sync - Parsed', parseResult.events.length, 'total event(s) from local calendar');

		// Filter for target date's meetings
		const todaysMeetings = getTodaysMeetings(parseResult.events, targetDate);
		console.log('Daily Sync - Found', todaysMeetings.length, 'meeting(s) for target date');

		// Ensure section exists
		await ensureSectionExists(app, dailyNote, settings.localCalendarSection, 2);

		// Insert meetings and get count of actually inserted meetings
		const insertedCount = await insertMeetingsIntoNote(app, dailyNote, todaysMeetings, settings.localCalendarSection);

		result.success = true;
		result.meetingsAdded = insertedCount;
		console.log('Daily Sync - Local calendar sync completed:', insertedCount, 'meeting(s) added');
	} catch (error) {
		console.error('Daily Sync - Local calendar sync failed:', error);
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
	settings: DailySyncSettings,
	targetDate: Date
): Promise<SourceResult> {
	const result: SourceResult = {
		enabled: true,
		success: false,
		meetingsAdded: 0
	};

	try {
		console.log('Daily Sync - Syncing Google Calendar from:', settings.googleCalendarLink);

		// Fetch and parse Google Calendar
		const parseResult = await fetchAndParseGoogleCalendar(settings.googleCalendarLink);
		console.log('Daily Sync - Parsed', parseResult.events.length, 'total event(s) from Google Calendar');

		// Filter for target date's meetings
		const todaysMeetings = getTodaysMeetings(parseResult.events, targetDate);
		console.log('Daily Sync - Found', todaysMeetings.length, 'meeting(s) for target date');

		// Ensure section exists
		await ensureSectionExists(app, dailyNote, settings.googleCalendarSection, 2);

		// Insert meetings and get count of actually inserted meetings
		const insertedCount = await insertMeetingsIntoNote(app, dailyNote, todaysMeetings, settings.googleCalendarSection);

		result.success = true;
		result.meetingsAdded = insertedCount;
		console.log('Daily Sync - Google Calendar sync completed:', insertedCount, 'meeting(s) added');
	} catch (error) {
		console.error('Daily Sync - Google Calendar sync failed:', error);
		result.success = false;
		result.error = error instanceof Error ? error.message : String(error);
	}

	return result;
}

/**
 * Syncs meetings from configured calendar sources to the current daily note.
 *
 * This is the main orchestration function that:
 * 1. Validates at least one source is configured
 * 2. Detects target date from currently open daily note (or uses today)
 * 3. Finds or creates the daily note for that date
 * 4. Syncs from local ICS (if configured)
 * 5. Syncs from Google Calendar (if configured)
 * 6. Returns aggregated results
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

	// Detect target date from currently open daily note (or use today)
	const targetDate = getTargetDateForSync(app);

	// Get or create daily note for the target date
	let dailyNote: TFile;
	try {
		dailyNote = await findOrCreateDailyNote(app, targetDate);
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
	const targetDateAsDate = targetDate.toDate();

	if (hasLocalIcs) {
		promises.push(syncLocalIcs(app, dailyNote, settings, targetDateAsDate));
	}

	if (hasGoogleCalendar) {
		promises.push(syncGoogleCalendar(app, dailyNote, settings, targetDateAsDate));
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
