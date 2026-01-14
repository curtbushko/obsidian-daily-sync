/**
 * Date Detector
 *
 * Determines the target date for sync operations based on the currently open daily note.
 * Falls back to today if no daily note is open or if detection fails.
 */
import { App, moment } from 'obsidian';
import {
	appHasDailyNotesPluginLoaded,
	getAllDailyNotes,
} from 'obsidian-daily-notes-interface';

// Infer Moment type from the moment function exported by Obsidian
type Moment = ReturnType<typeof moment>;

/**
 * Determines the target date for sync based on the currently open daily note.
 *
 * This function:
 * 1. Gets the currently active file from the workspace
 * 2. Checks if it's a daily note
 * 3. If yes, extracts and returns the date from the filename
 * 4. If no, falls back to today's date
 *
 * @param app - The Obsidian App instance
 * @returns Moment - The target date for sync (either from active note or today)
 *
 * @example
 * ```typescript
 * // User has daily note "20240115.md" open
 * const targetDate = getTargetDateForSync(app);
 * console.log(targetDate.format('YYYYMMDD')); // "20240115"
 *
 * // User has regular note "My Project.md" open
 * const targetDate = getTargetDateForSync(app);
 * console.log(targetDate.format('YYYYMMDD')); // Today's date
 * ```
 */
export function getTargetDateForSync(app: App): Moment {
	// Default to today
	const today = moment();

	// Check if Daily Notes plugin is loaded
	if (!appHasDailyNotesPluginLoaded()) {
		console.log('Daily Sync - Daily Notes plugin not loaded, using today');
		return today;
	}

	// Get the active file
	const activeFile = app.workspace.getActiveFile();
	if (!activeFile) {
		console.log('Daily Sync - No active file open, using today');
		return today;
	}

	// Get all daily notes
	const allDailyNotes = getAllDailyNotes();

	// Check if the active file is a daily note by looking it up in the daily notes map
	// The map is keyed by date string - can be in various formats depending on daily notes config
	for (const [dateStr, dailyNote] of Object.entries(allDailyNotes)) {
		if (dailyNote.path === activeFile.path) {
			// Found a match - try parsing with multiple formats
			// 1. Try ISO format with "day-" prefix (e.g., "day-2026-01-30T00:00:00-05:00")
			let parsedDate = moment(dateStr.replace(/^day-/, ''));

			// 2. Try YYYYMMDD format
			if (!parsedDate.isValid()) {
				parsedDate = moment(dateStr, 'YYYYMMDD', true);
			}

			// 3. Try YYYY-MM-DD format
			if (!parsedDate.isValid()) {
				parsedDate = moment(dateStr, 'YYYY-MM-DD', true);
			}

			if (parsedDate.isValid()) {
				console.log('Daily Sync - Syncing to daily note date:', parsedDate.format('YYYY-MM-DD'));
				return parsedDate;
			} else {
				console.error('Daily Sync - Could not parse date from daily note key:', dateStr);
				return today;
			}
		}
	}

	// Active file is not a daily note
	console.log('Daily Sync - Active file is not a daily note, using today');
	return today;
}
