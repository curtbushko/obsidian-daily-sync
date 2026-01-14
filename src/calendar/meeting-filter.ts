/**
 * Meeting Filter
 *
 * Provides filtering functionality for calendar events based on ignore phrases.
 */
import type { IcsEvent } from './ics-parser';
import { debugLog } from '../utils/debug-logger';

/**
 * Escapes special regex characters in a string
 * This allows matching literal text including characters like [], (), *, etc.
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parses a comma-separated string of ignore phrases into an array
 * Trims whitespace and filters out empty phrases
 *
 * @param ignorePhrasesString - Comma-separated list of phrases
 * @returns Array of trimmed, non-empty phrases
 */
function parseIgnorePhrases(ignorePhrasesString: string): string[] {
	if (!ignorePhrasesString || ignorePhrasesString.trim() === '') {
		return [];
	}

	return ignorePhrasesString
		.split(',')
		.map(phrase => phrase.trim())
		.filter(phrase => phrase.length > 0);
}

/**
 * Checks if a meeting summary contains any of the ignore phrases (case-insensitive)
 *
 * @param summary - The meeting summary/title to check
 * @param phrases - Array of phrases to check against
 * @returns True if the summary contains any ignore phrase
 */
function shouldIgnoreMeeting(summary: string, phrases: string[]): boolean {
	const lowerSummary = summary.toLowerCase();

	for (const phrase of phrases) {
		const lowerPhrase = phrase.toLowerCase();
		// Use literal string matching (escape regex characters)
		const escapedPhrase = escapeRegex(lowerPhrase);
		const regex = new RegExp(escapedPhrase);
		if (regex.test(lowerSummary)) {
			return true;
		}
	}

	return false;
}

/**
 * Filters out meetings that contain any of the ignore phrases in their summary.
 *
 * @param meetings - Array of calendar events to filter
 * @param ignorePhrasesString - Comma-separated list of phrases to ignore
 * @returns Array of meetings that don't contain any ignore phrases
 *
 * @example
 * ```typescript
 * const meetings = [
 *   { summary: 'Daily Standup', ... },
 *   { summary: 'Blocked: Focus Time', ... },
 *   { summary: 'Project Review', ... }
 * ];
 * const filtered = filterIgnoredMeetings(meetings, 'Blocked, Personal');
 * // Returns only 'Daily Standup' and 'Project Review'
 * ```
 */
export function filterIgnoredMeetings(
	meetings: IcsEvent[],
	ignorePhrasesString: string
): IcsEvent[] {
	const phrases = parseIgnorePhrases(ignorePhrasesString);

	// If no phrases to ignore, return all meetings
	if (phrases.length === 0) {
		return meetings;
	}

	debugLog('Filtering meetings with ignore phrases:', phrases);

	const filtered: IcsEvent[] = [];
	const ignored: string[] = [];

	for (const meeting of meetings) {
		if (shouldIgnoreMeeting(meeting.summary, phrases)) {
			ignored.push(meeting.summary);
		} else {
			filtered.push(meeting);
		}
	}

	if (ignored.length > 0) {
		debugLog('Ignored meetings:', ignored);
	}

	return filtered;
}
