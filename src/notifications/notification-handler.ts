/**
 * Notification Handler
 *
 * Displays user notifications for sync results using Obsidian's Notice API.
 * Provides clear, actionable feedback for success, partial success, and failures.
 */
import { Notice } from 'obsidian';
import type { SyncResult } from '../sync/sync-orchestrator';

/**
 * Shows a notification based on sync result
 *
 * Displays appropriate user feedback:
 * - Full success: Brief message with meeting count
 * - Partial success: Shows what worked, hints at failure
 * - No meetings: Brief "no meetings" message
 * - Complete failure: Error message with console hint
 *
 * @param result - The sync operation result
 *
 * @example
 * ```typescript
 * const result = await syncMeetingsToDaily(app, settings);
 * showSyncNotification(result);
 * ```
 */
export function showSyncNotification(result: SyncResult): void {
	// Calculate total meetings
	const totalMeetings = result.localCalendar.meetingsAdded + result.googleCalendar.meetingsAdded;

	// Log errors to console for debugging
	if (result.localCalendar.enabled && !result.localCalendar.success && result.localCalendar.error) {
		console.error('Daily Sync - Local calendar error:', result.localCalendar.error);
	}
	if (result.googleCalendar.enabled && !result.googleCalendar.success && result.googleCalendar.error) {
		console.error('Daily Sync - Google Calendar error:', result.googleCalendar.error);
	}

	// Full success - both sources worked (if enabled)
	if (result.success && !hasPartialFailure(result)) {
		if (totalMeetings === 0) {
			new Notice('No meetings found for today.', 4000);
			return;
		}

		const message = buildSuccessMessage(result, totalMeetings);
		new Notice(message, 4000);
		return;
	}

	// Partial success - one source worked, one failed
	if (result.success && hasPartialFailure(result)) {
		const message = buildPartialSuccessMessage(result, totalMeetings);
		new Notice(message, 6000);
		return;
	}

	// Complete failure - all sources failed
	const message = buildFailureMessage(result);
	new Notice(message, 8000);
}

/**
 * Checks if the result has a partial failure
 * (one source succeeded, one failed)
 */
function hasPartialFailure(result: SyncResult): boolean {
	const localFailed = result.localCalendar.enabled && !result.localCalendar.success;
	const googleFailed = result.googleCalendar.enabled && !result.googleCalendar.success;
	const localSucceeded = result.localCalendar.enabled && result.localCalendar.success;
	const googleSucceeded = result.googleCalendar.enabled && result.googleCalendar.success;

	return (localFailed && googleSucceeded) || (googleFailed && localSucceeded);
}

/**
 * Builds success message for full sync success
 */
function buildSuccessMessage(result: SyncResult, totalMeetings: number): string {
	const meetingWord = totalMeetings === 1 ? 'meeting' : 'meetings';

	// Both sources enabled and succeeded
	if (result.localCalendar.success && result.googleCalendar.success) {
		return `✓ Synced ${totalMeetings} ${meetingWord} to daily note.`;
	}

	// Only local calendar
	if (result.localCalendar.success) {
		return `✓ Synced ${totalMeetings} ${meetingWord} from local calendar.`;
	}

	// Only Google Calendar
	if (result.googleCalendar.success) {
		return `✓ Synced ${totalMeetings} ${meetingWord} from Google Calendar.`;
	}

	// Fallback (shouldn't happen)
	return `✓ Synced ${totalMeetings} ${meetingWord}.`;
}

/**
 * Builds message for partial success
 * (one source succeeded, one failed)
 */
function buildPartialSuccessMessage(result: SyncResult, totalMeetings: number): string {
	const meetingWord = totalMeetings === 1 ? 'meeting' : 'meetings';

	// Local succeeded, Google failed
	if (result.localCalendar.success && !result.googleCalendar.success) {
		const errorMsg = result.googleCalendar.error || 'Unknown error';
		return `✓ Synced ${totalMeetings} ${meetingWord} from local calendar.\n✗ Google Calendar failed: ${errorMsg}`;
	}

	// Google succeeded, local failed
	if (result.googleCalendar.success && !result.localCalendar.success) {
		const errorMsg = result.localCalendar.error || 'Unknown error';
		return `✓ Synced ${totalMeetings} ${meetingWord} from Google Calendar.\n✗ Local calendar failed: ${errorMsg}`;
	}

	// Fallback (shouldn't happen)
	return `Partial sync: ${totalMeetings} ${meetingWord} synced. One source failed.`;
}

/**
 * Builds message for complete failure
 */
function buildFailureMessage(result: SyncResult): string {
	const bothEnabled = result.localCalendar.enabled && result.googleCalendar.enabled;

	if (bothEnabled) {
		const localError = result.localCalendar.error || 'Unknown error';
		const googleError = result.googleCalendar.error || 'Unknown error';
		return `✗ Sync failed: Both calendar sources failed.\n• Local: ${localError}\n• Google: ${googleError}\nCheck console for details.`;
	}

	// Only one source was enabled
	if (result.localCalendar.enabled) {
		const errorMsg = result.localCalendar.error || 'Unknown error';
		return `✗ Sync failed: ${errorMsg}\nCheck console for details.`;
	}

	if (result.googleCalendar.enabled) {
		const errorMsg = result.googleCalendar.error || 'Unknown error';
		return `✗ Sync failed: ${errorMsg}\nCheck console for details.`;
	}

	return '✗ Sync failed. No calendar sources configured.\nCheck console for details.';
}
