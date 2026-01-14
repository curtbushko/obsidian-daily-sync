/**
 * Meeting Inserter
 *
 * Provides functionality to insert meeting entries into daily notes under specified sections.
 * Handles duplicate detection and preserves existing content.
 */
import { App, TFile } from 'obsidian';
import type { IcsEvent } from '../calendar/ics-parser';

/**
 * Error thrown when target section is not found in note
 */
export class SectionNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SectionNotFoundError';
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SectionNotFoundError);
		}
	}
}

/**
 * Error thrown when meeting insertion fails
 */
export class MeetingInsertionError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message);
		this.name = 'MeetingInsertionError';
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, MeetingInsertionError);
		}
	}
}

/**
 * Formats a meeting as a markdown bullet point.
 *
 * @param meeting - The meeting to format
 * @returns Formatted string like "- [ ] Meeting: Team Standup (10:00 AM)"
 *
 * @example
 * ```typescript
 * const meeting = {
 *   summary: 'Team Standup',
 *   start: new Date('2024-01-15T10:00:00'),
 *   end: new Date('2024-01-15T10:30:00'),
 *   isAllDay: false
 * };
 * formatMeeting(meeting); // "- [ ] Meeting: Team Standup (10:00 AM)"
 * ```
 */
export function formatMeeting(meeting: IcsEvent): string {
	if (meeting.isAllDay) {
		return `- [ ] Meeting: ${meeting.summary} (All day)`;
	}

	const time = formatTime(meeting.start);
	return `- [ ] Meeting: ${meeting.summary} (${time})`;
}

/**
 * Formats a Date as 12-hour time string with AM/PM.
 *
 * @param date - The date to format
 * @returns Time string like "10:00 AM" or "2:30 PM"
 */
function formatTime(date: Date): string {
	let hours = date.getHours();
	const minutes = date.getMinutes();
	const ampm = hours >= 12 ? 'PM' : 'AM';

	// Convert to 12-hour format
	hours = hours % 12;
	hours = hours ? hours : 12; // 0 should be 12

	// Format minutes with leading zero if needed
	const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

	return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Finds the bounds of a section in markdown content.
 *
 * @param content - The markdown content
 * @param sectionName - The section heading name (without # symbols)
 * @returns Object with start and end positions, or null if not found
 */
function findSectionBounds(content: string, sectionName: string): { start: number; end: number } | null {
	const lines = content.split('\n');
	let sectionStart = -1;
	let sectionEnd = -1;

	// Find the section heading
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]?.trim() ?? '';
		// Match # Meetings or ## Meetings or ### Meetings, etc.
		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch && headingMatch[2]) {
			const headingText = headingMatch[2].trim();
			if (headingText === sectionName) {
				sectionStart = i;
				break;
			}
		}
	}

	if (sectionStart === -1) {
		return null;
	}

	// Find the end of the section (next heading or end of file)
	sectionEnd = lines.length;
	for (let i = sectionStart + 1; i < lines.length; i++) {
		const line = lines[i]?.trim() ?? '';
		// Check if this is another heading
		if (line.match(/^#{1,6}\s+/)) {
			sectionEnd = i;
			break;
		}
	}

	return { start: sectionStart, end: sectionEnd };
}

/**
 * Checks if a meeting is already present in the content.
 *
 * @param meeting - The meeting to check
 * @param content - The content to search in
 * @returns True if meeting is already present
 */
function isMeetingInContent(meeting: IcsEvent, content: string): boolean {
	const formattedMeeting = formatMeeting(meeting);
	return content.includes(formattedMeeting);
}

/**
 * Inserts meetings into a daily note under the specified section.
 *
 * This function:
 * - Reads the daily note content
 * - Finds the target section
 * - Filters out duplicate meetings
 * - Inserts new meetings as bullet points
 * - Preserves existing content
 *
 * @param app - The Obsidian App instance
 * @param file - The daily note file
 * @param meetings - Array of meetings to insert
 * @param sectionName - Target section heading (without # symbols)
 * @returns Number of meetings actually inserted (excluding duplicates)
 * @throws {SectionNotFoundError} - If the target section doesn't exist
 * @throws {MeetingInsertionError} - If insertion fails
 *
 * @example
 * ```typescript
 * const meetings = [
 *   {
 *     summary: 'Team Standup',
 *     start: new Date('2024-01-15T10:00:00'),
 *     end: new Date('2024-01-15T10:30:00'),
 *     isAllDay: false
 *   }
 * ];
 * const insertedCount = await insertMeetingsIntoNote(app, dailyNote, meetings, 'Meetings');
 * console.log(`Inserted ${insertedCount} meetings`);
 * ```
 */
export async function insertMeetingsIntoNote(
	app: App,
	file: TFile,
	meetings: IcsEvent[],
	sectionName: string
): Promise<number> {
	try {
		// Handle empty meetings array
		if (meetings.length === 0) {
			return 0;
		}

		// Read the current file content
		const content = await app.vault.read(file);

		// Find the section
		const boundsOrNull = findSectionBounds(content, sectionName);
		if (!boundsOrNull) {
			throw new SectionNotFoundError(
				`Section "${sectionName}" not found in ${file.path}. ` +
				`Please create the section first or check the section name in settings.`
			);
		}

		// TypeScript type narrowing: bounds is guaranteed non-null here
		const bounds = boundsOrNull;

		// Filter out meetings that are already in the section
		const lines = content.split('\n');
		const sectionContent = lines.slice(bounds.start, bounds.end).join('\n');
		const newMeetings = meetings.filter(meeting => !isMeetingInContent(meeting, sectionContent));

		// Log duplicate detection
		const duplicateCount = meetings.length - newMeetings.length;
		if (duplicateCount > 0) {
			console.log('Daily Sync - Skipping', duplicateCount, 'duplicate meeting(s) already in note');
		}

		// If all meetings are duplicates, no need to modify
		if (newMeetings.length === 0) {
			if (duplicateCount > 0) {
				console.log('Daily Sync - All', duplicateCount, 'meeting(s) already exist in "' + sectionName + '" section');
			}
			return 0;
		}

		// Format new meetings
		const formattedMeetings = newMeetings.map(meeting => formatMeeting(meeting));

		// Log what's being inserted
		console.log('Daily Sync - Inserting', newMeetings.length, 'new meeting(s) into "' + sectionName + '" section');

		// Insert meetings after the section heading
		// Find the position to insert (after heading, preserving existing content)
		const beforeSection = lines.slice(0, bounds.start + 1);
		const sectionLines = lines.slice(bounds.start + 1, bounds.end);
		const afterSection = lines.slice(bounds.end);

		// Add formatted meetings to section
		const updatedSection = [...sectionLines, ...formattedMeetings];

		// Reconstruct the content
		const updatedContent = [
			...beforeSection,
			...updatedSection,
			...afterSection
		].join('\n');

		// Write the updated content
		await app.vault.modify(file, updatedContent);

		return newMeetings.length;

	} catch (error) {
		console.error(`Daily Sync - Error inserting meetings into ${file.path}:`, error);
		if (error instanceof SectionNotFoundError) {
			throw error;
		}
		throw new MeetingInsertionError(
			`Failed to insert meetings into ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
			error
		);
	}
}
