/**
 * CLI entry point for Daily Sync
 *
 * Allows running the sync without Obsidian by mocking the App interface
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { DailySyncSettings } from './settings.js';
import { parseIcsFile, fetchAndParseGoogleCalendar, getTodaysMeetings, type IcsEvent } from './calendar/ics-parser.js';
import { filterIgnoredMeetings } from './calendar/meeting-filter.js';
import { setDebugEnabled, debugLog, debugError } from './utils/debug-logger.js';

interface CLIConfig {
	vaultPath: string;
	dailyNotesFolder: string;
	dailyNotesFormat: string;
	enableLocalCalendar: boolean;
	icsFilePath: string;
	localCalendarSection: string;
	localCalendarIgnore: string;
	enableGoogleCalendar: boolean;
	googleCalendarLink: string;
	googleCalendarSection: string;
	googleCalendarIgnore: string;
	enableDebugLogging: boolean;
}

/**
 * Load configuration from file
 */
async function loadConfig(configPath: string): Promise<CLIConfig> {
	const content = await readFile(configPath, 'utf-8');
	const config = JSON.parse(content) as CLIConfig;

	// Set defaults if not specified
	config.vaultPath = config.vaultPath || process.cwd();
	config.dailyNotesFolder = config.dailyNotesFolder || 'daily';
	config.dailyNotesFormat = config.dailyNotesFormat || 'YYYYMMDD';

	return config;
}

/**
 * Format date according to daily notes format
 */
function formatDateForFilename(date: Date, format: string): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return format
		.replace('YYYY', String(year))
		.replace('MM', month)
		.replace('DD', day);
}

/**
 * Get full path to daily note
 */
function getDailyNotePath(config: CLIConfig, date: Date): string {
	const filename = formatDateForFilename(date, config.dailyNotesFormat) + '.md';
	return join(config.vaultPath, config.dailyNotesFolder, filename);
}

/**
 * Ensure daily note exists
 */
async function ensureDailyNote(notePath: string, date: Date): Promise<void> {
	if (existsSync(notePath)) {
		return;
	}

	// Create directory if needed
	await mkdir(dirname(notePath), { recursive: true });

	// Create basic daily note content
	const monthName = date.toLocaleDateString('en-US', { month: 'long' });
	const dayNum = date.getDate();
	const year = date.getFullYear();
	const monthTag = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
	const datePart = date.toISOString().split('T')[0];
	const timePart = new Date().toTimeString().split(' ')[0];
	const timestamp = `${datePart ?? ''} ${timePart?.substring(0, 5) ?? ''}`;

	const content = `---
title: ${monthName} ${dayNum}, ${year}
date:  ${timestamp}
tags:
  - daily
  - ${monthTag}
---
# WORK

# FAMILY

# PERSONAL

- Daily Codwars/Exercism/LC
- Exercise

# TWO GOOD THINGS THAT HAPPENED

"Don't make the same decision twice. Spend time and thought to make a solid decision the first time so that you don't revisit the issue unnecessarily." — Bill Gates

"He who every morning plans the transactions of that day and follows that plan carries a thread that will guide him through the labyrinth of the most busy life." ― Victor Hugo

"We all sorely complain of the shortness of time, and yet have much more than we know what to do with. Our lives are either spent in doing nothing at all, or in doing nothing to the purpose, or in doing nothing that we ought to do. We are always complaining that our days are few, and acting as though there would be no end of them." — Seneca
`;

	await writeFile(notePath, content, 'utf-8');
	debugLog('Created daily note:', notePath);
}

/**
 * Find section in note content
 */
function findSection(content: string, sectionName: string): { start: number; end: number } | null {
	const lines = content.split('\n');
	const sectionHeader = `# ${sectionName}`;

	const startIdx = lines.findIndex(line => line.trim() === sectionHeader);
	if (startIdx === -1) {
		return null;
	}

	// Find next section or end of file
	let endIdx = lines.length;
	for (let i = startIdx + 1; i < lines.length; i++) {
		const line = lines[i];
		if (line && line.startsWith('# ')) {
			endIdx = i;
			break;
		}
	}

	return { start: startIdx, end: endIdx };
}

/**
 * Format meeting as markdown checklist item
 */
function formatMeeting(meeting: IcsEvent): string {
	const time = meeting.isAllDay
		? 'All Day'
		: meeting.start.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});

	return `- [ ] Meeting: ${meeting.summary.trim()} (${time})`;
}

/**
 * Insert meetings into section
 */
async function insertMeetings(
	notePath: string,
	meetings: IcsEvent[],
	sectionName: string
): Promise<number> {
	if (meetings.length === 0) {
		return 0;
	}

	let content = await readFile(notePath, 'utf-8');
	const section = findSection(content, sectionName);

	if (!section) {
		debugError(`Section '${sectionName}' not found in note`);
		return 0;
	}

	const lines = content.split('\n');
	const sectionLines = lines.slice(section.start + 1, section.end);

	// Get existing meetings
	const existingMeetings = new Set(
		sectionLines
			.filter(line => line.includes('Meeting:'))
			.map(line => {
				const match = line.match(/Meeting: ([^(]+)/);
				return match?.[1]?.trim() ?? '';
			})
	);

	// Filter out meetings that already exist
	const newMeetings = meetings.filter(m => !existingMeetings.has(m.summary.trim()));

	if (newMeetings.length === 0) {
		debugLog('All meetings already exist in section');
		return 0;
	}

	// Format new meetings
	const meetingLines = newMeetings.map(formatMeeting);

	// Insert after section header
	lines.splice(section.start + 1, 0, ...meetingLines);

	// Write back
	await writeFile(notePath, lines.join('\n'), 'utf-8');

	return newMeetings.length;
}

/**
 * Sync meetings from a calendar source
 */
async function syncCalendar(
	config: CLIConfig,
	notePath: string,
	date: Date,
	isLocal: boolean
): Promise<{ success: boolean; meetingsAdded: number; error?: string }> {
	try {
		const calendarType = isLocal ? 'local' : 'Google';
		debugLog(`\n=== ${calendarType.toUpperCase()} CALENDAR SYNC START ===`);

		// Parse calendar
		let events: IcsEvent[];
		if (isLocal) {
			debugLog('Parsing local ICS:', config.icsFilePath);
			const result = await parseIcsFile(config.icsFilePath, null as any);
			events = result.events;
		} else {
			debugLog('Fetching Google Calendar:', config.googleCalendarLink);
			const result = await fetchAndParseGoogleCalendar(config.googleCalendarLink);
			events = result.events;
		}

		debugLog(`Parsed ${events.length} total events`);

		// Filter for today
		const todaysMeetings = getTodaysMeetings(events, date);
		debugLog(`Found ${todaysMeetings.length} meetings for ${date.toLocaleDateString()}`);

		// Apply ignore filter
		const ignoreList = isLocal ? config.localCalendarIgnore : config.googleCalendarIgnore;
		const filteredMeetings = filterIgnoredMeetings(todaysMeetings, ignoreList);
		debugLog(`After filtering: ${filteredMeetings.length} meetings`);

		// Insert into note
		const section = isLocal ? config.localCalendarSection : config.googleCalendarSection;
		const added = await insertMeetings(notePath, filteredMeetings, section);

		debugLog(`=== ${calendarType.toUpperCase()} CALENDAR SYNC COMPLETE ===`);
		debugLog(`Added ${added} new meetings\n`);

		return { success: true, meetingsAdded: added };
	} catch (error) {
		debugError('Sync failed:', error);
		return {
			success: false,
			meetingsAdded: 0,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

/**
 * Main CLI function
 */
async function main() {
	const args = process.argv.slice(2);
	const configPath = args[0] || '.obsidian/plugins/obsidian-daily-sync/data.json';

	try {
		// Load config
		const config = await loadConfig(configPath);
		setDebugEnabled(config.enableDebugLogging);

		// Get today's date
		const today = new Date();
		const notePath = getDailyNotePath(config, today);

		debugLog('Daily note path:', notePath);
		debugLog('Date:', today.toLocaleDateString());

		// Ensure daily note exists
		await ensureDailyNote(notePath, today);

		// Sync calendars
		const results = await Promise.allSettled([
			config.enableLocalCalendar
				? syncCalendar(config, notePath, today, true)
				: Promise.resolve({ success: false, meetingsAdded: 0 }),
			config.enableGoogleCalendar
				? syncCalendar(config, notePath, today, false)
				: Promise.resolve({ success: false, meetingsAdded: 0 })
		]);

		// Report results
		const mappedResults = results.map(r =>
			r.status === 'fulfilled' ? r.value : { success: false, meetingsAdded: 0, error: 'Failed' }
		);
		const localResult = mappedResults[0];
		const googleResult = mappedResults[1];

		console.log('\n✓ Sync complete');
		if (config.enableLocalCalendar && localResult) {
			console.log(`  Local calendar: ${localResult.meetingsAdded} meeting(s) added`);
		}
		if (config.enableGoogleCalendar && googleResult) {
			console.log(`  Google calendar: ${googleResult.meetingsAdded} meeting(s) added`);
		}

		process.exit(0);
	} catch (error) {
		console.error('Error:', error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url.startsWith('file:')) {
	const modulePath = new URL(import.meta.url).pathname;
	const scriptPath = process.argv[1];
	const isMain = scriptPath && (scriptPath === modulePath || scriptPath.endsWith('/cli.js'));
	if (isMain) {
		main();
	}
}
