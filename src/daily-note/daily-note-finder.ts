/**
 * Daily Note Finder
 *
 * Provides functionality to find or create daily notes using the obsidian-daily-notes-interface.
 * Respects user's Daily Notes plugin settings for format, folder, and template.
 */
import { App, TFile, moment } from 'obsidian';
import {
	appHasDailyNotesPluginLoaded,
	getAllDailyNotes,
	getDailyNote,
	createDailyNote
} from 'obsidian-daily-notes-interface';

// Infer Moment type from the moment function exported by Obsidian
type Moment = ReturnType<typeof moment>;

/**
 * Error thrown when Daily Notes plugin is not enabled
 */
export class DailyNotesNotEnabledError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DailyNotesNotEnabledError';
		// Maintain proper stack trace in V8
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, DailyNotesNotEnabledError);
		}
	}
}

/**
 * Error thrown when daily note creation fails
 */
export class DailyNoteCreationError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message);
		this.name = 'DailyNoteCreationError';
		// Maintain proper stack trace in V8
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, DailyNoteCreationError);
		}
	}
}

/**
 * Find or create a daily note for the specified date.
 *
 * If the daily note already exists, it returns the existing note.
 * If it doesn't exist, it creates a new daily note and returns it.
 *
 * @param app - The Obsidian App instance
 * @param date - The date for the daily note (defaults to today)
 * @returns Promise<TFile> - The daily note file
 * @throws {DailyNotesNotEnabledError} - If Daily Notes plugin is not enabled
 * @throws {DailyNoteCreationError} - If daily note creation fails
 *
 * @example
 * ```typescript
 * import moment from 'moment';
 * import { findOrCreateDailyNote } from './daily-note-finder';
 *
 * // Get or create today's daily note
 * const todayNote = await findOrCreateDailyNote(app);
 *
 * // Get or create daily note for specific date
 * const note = await findOrCreateDailyNote(app, moment('2024-01-15'));
 * ```
 */
export async function findOrCreateDailyNote(
	app: App,
	date?: Moment
): Promise<TFile> {
	// Default to today if no date provided
	const targetDate = date || moment();

	// Check if Daily Notes plugin is enabled
	if (!appHasDailyNotesPluginLoaded()) {
		throw new DailyNotesNotEnabledError(
			'Daily Notes plugin is not enabled. Please enable it in Settings → Core plugins.'
		);
	}

	// Get all daily notes for performance (caching)
	const allDailyNotes = getAllDailyNotes();

	// Try to find existing daily note
	const existingNote = getDailyNote(targetDate, allDailyNotes);
	if (existingNote) {
		return existingNote;
	}

	// Note doesn't exist, create it
	try {
		const newNote = await createDailyNote(targetDate);
		return newNote;
	} catch (error) {
		throw new DailyNoteCreationError(
			`Failed to create daily note for ${targetDate.format('YYYY-MM-DD')}: ${error instanceof Error ? error.message : String(error)}`,
			error
		);
	}
}
