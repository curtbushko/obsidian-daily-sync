/**
 * End-to-End Integration Tests
 * Tests complete user workflows with minimal mocking
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { App, TFile, moment } from '../__mocks__/obsidian';
import { syncMeetingsToDaily } from '../sync/sync-orchestrator';
import type { DailySyncSettings } from '../settings';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mock obsidian-daily-notes-interface
vi.mock('obsidian-daily-notes-interface', () => import('../__mocks__/obsidian-daily-notes-interface'));

// Import mocking utilities
import {
	setPluginLoaded,
	setDailyNotes,
	resetMocks
} from '../__mocks__/obsidian-daily-notes-interface';

describe('End-to-End Integration Tests', () => {
	let app: App;
	let settings: DailySyncSettings;
	let dailyNoteContent: string;
	let dailyNote: TFile;

	beforeEach(() => {
		// Mock the system time to match fixture dates (January 15, 2026)
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

		app = new App();
		dailyNote = new TFile('2026-01-15.md');

		// Reset daily notes mock
		resetMocks();
		setPluginLoaded(true);

		// Set up today's daily note
		const today = moment().format('YYYY-MM-DD');
		setDailyNotes({
			[today]: dailyNote
		});

		// Initialize empty daily note content
		dailyNoteContent = '# Daily Note\n\n';

		// Mock vault read/modify to track daily note changes
		vi.spyOn(app.vault, 'read').mockImplementation(async (file: TFile) => {
			return dailyNoteContent;
		});

		vi.spyOn(app.vault, 'modify').mockImplementation(async (file: TFile, data: string) => {
			dailyNoteContent = data;
		});

		// Default settings
		settings = {
			enableLocalCalendar: true,
			icsFilePath: join(__dirname, 'fixtures', 'sample-calendar.ics'),
			localCalendarSection: 'Meetings',
			localCalendarIgnore: '',
			enableGoogleCalendar: true,
			googleCalendarLink: '',
			googleCalendarSection: 'Google Meetings',
			googleCalendarIgnore: '',
			enableDebugLogging: false
		};
	});

	afterEach(() => {
		// Restore real timers
		vi.useRealTimers();
	});

	describe('Full Sync Workflow', () => {
		it('should complete full sync from local ICS to daily note', async () => {
			// This tests the complete user workflow:
			// 1. User has a local .ics file
			// 2. User runs sync command
			// 3. Plugin parses ICS file
			// 4. Plugin finds/creates daily note
			// 5. Plugin creates section if needed
			// 6. Plugin inserts meetings
			// 7. User sees meetings in daily note

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert - Sync succeeded
			expect(result.success).toBe(true);
			expect(result.localCalendar.success).toBe(true);
			expect(result.localCalendar.meetingsAdded).toBeGreaterThan(0);

			// Assert - Daily note was modified
			expect(dailyNoteContent).toContain('## Meetings');
			expect(dailyNoteContent).toContain('Morning Standup');
			expect(dailyNoteContent).toContain('Project Review');
			expect(dailyNoteContent).toContain('Team Outing');

			// Assert - Tomorrow's meeting NOT included
			expect(dailyNoteContent).not.toContain('Tomorrow\'s Meeting');
		});

		it('should format meetings correctly in daily note', async () => {
			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert - Time-based meetings have time
			expect(dailyNoteContent).toMatch(/Morning Standup.*\d{1,2}:\d{2}\s+(AM|PM)/);
			expect(dailyNoteContent).toMatch(/Project Review.*\d{1,2}:\d{2}\s+(AM|PM)/);

			// Assert - All-day events marked as all day
			expect(dailyNoteContent).toContain('Team Outing (All day)');
		});

		it('should create section if it doesn\'t exist', async () => {
			// Arrange - Start with minimal daily note
			dailyNoteContent = '# Daily Note\n\nSome content here.\n';

			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert - Section was created
			expect(dailyNoteContent).toContain('## Meetings');

			// Assert - Original content preserved
			expect(dailyNoteContent).toContain('Some content here.');
		});

		it('should append to existing section', async () => {
			// Arrange - Daily note with existing section and content
			dailyNoteContent = `# Daily Note

## Meetings
- Existing meeting from yesterday

## Notes
Some notes here.
`;

			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert - New meetings added
			expect(dailyNoteContent).toContain('Morning Standup');
			expect(dailyNoteContent).toContain('Project Review');

			// Assert - Existing content preserved
			expect(dailyNoteContent).toContain('Existing meeting from yesterday');
			expect(dailyNoteContent).toContain('## Notes');
			expect(dailyNoteContent).toContain('Some notes here.');
		});
	});

	describe('Duplicate Prevention', () => {
		it('should not duplicate meetings when sync runs multiple times', async () => {
			// Act - Run sync twice
			await syncMeetingsToDaily(app, settings);
			const contentAfterFirstSync = dailyNoteContent;

			await syncMeetingsToDaily(app, settings);
			const contentAfterSecondSync = dailyNoteContent;

			// Assert - Content unchanged after second sync
			expect(contentAfterSecondSync).toBe(contentAfterFirstSync);

			// Assert - Each meeting appears only once
			const standupCount = (contentAfterSecondSync.match(/Morning Standup/g) || []).length;
			expect(standupCount).toBe(1);
		});

		it('should handle new meetings added after initial sync', async () => {
			// Arrange - First sync
			await syncMeetingsToDaily(app, settings);

			// Manually add a new meeting to daily note
			dailyNoteContent = dailyNoteContent.replace(
				'## Meetings\n',
				'## Meetings\n- [ ] Meeting: New Ad-hoc Meeting (3:00 PM)\n'
			);

			// Act - Second sync (simulating calendar unchanged)
			await syncMeetingsToDaily(app, settings);

			// Assert - Ad-hoc meeting preserved
			expect(dailyNoteContent).toContain('New Ad-hoc Meeting');

			// Assert - Original meetings still present
			expect(dailyNoteContent).toContain('Morning Standup');
		});
	});

	describe('Error Scenarios', () => {
		it('should handle missing ICS file gracefully', async () => {
			// Arrange - Invalid file path
			settings.icsFilePath = '/nonexistent/path/calendar.ics';

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert - Sync fails gracefully (doesn't throw)
			expect(result.success).toBe(false);
			expect(result.localCalendar.success).toBe(false);
			expect(result.localCalendar.error).toContain('File not found');
		});

		it('should handle Daily Notes plugin not enabled', async () => {
			// Arrange
			setPluginLoaded(false);

			// Act & Assert
			await expect(syncMeetingsToDaily(app, settings)).rejects.toThrow('Daily Notes plugin is not enabled');
		});

		it('should handle no calendar sources configured', async () => {
			// Arrange
			settings.icsFilePath = '';
			settings.googleCalendarLink = '';

			// Act & Assert
			await expect(syncMeetingsToDaily(app, settings)).rejects.toThrow('No calendar sources configured');
		});
	});

	describe('Combined Sources', () => {
		it('should handle both local and Google Calendar disabled', async () => {
			// Arrange
			settings.icsFilePath = '';
			settings.googleCalendarLink = '';

			// Act & Assert
			await expect(syncMeetingsToDaily(app, settings)).rejects.toThrow();
		});

		it('should sync from local calendar when only local enabled', async () => {
			// Arrange - Only local calendar configured
			settings.googleCalendarLink = '';

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert
			expect(result.success).toBe(true);
			expect(result.localCalendar.enabled).toBe(true);
			expect(result.localCalendar.success).toBe(true);
			expect(result.googleCalendar.enabled).toBe(false);
		});
	});

	describe('Section Handling', () => {
		it('should use custom section name from settings', async () => {
			// Arrange
			settings.localCalendarSection = 'Work Calendar';

			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert
			expect(dailyNoteContent).toContain('## Work Calendar');
			expect(dailyNoteContent).not.toContain('## Meetings');
		});

		it('should handle multiple sections for different sources', async () => {
			// This would require Google Calendar to be mocked, which is complex
			// Skipping for now - covered by sync-orchestrator tests
		});
	});

	describe('Date Filtering', () => {
		it('should only include today\'s meetings', async () => {
			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert - Today's meetings included
			expect(dailyNoteContent).toContain('Morning Standup');
			expect(dailyNoteContent).toContain('Project Review');
			expect(dailyNoteContent).toContain('Team Outing');

			// Assert - Tomorrow's meeting excluded
			expect(dailyNoteContent).not.toContain('Tomorrow\'s Meeting');
		});

		it('should handle all-day events', async () => {
			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert - All-day event present and formatted correctly
			expect(dailyNoteContent).toContain('Team Outing (All day)');
		});
	});

	describe('Real ICS File Parsing', () => {
		it('should parse actual ICS file from fixtures', () => {
			// Arrange - Read actual ICS file
			const icsPath = join(__dirname, 'fixtures', 'sample-calendar.ics');
			const icsContent = readFileSync(icsPath, 'utf-8');

			// Assert - File contains expected calendar data
			expect(icsContent).toContain('BEGIN:VCALENDAR');
			expect(icsContent).toContain('Morning Standup');
			expect(icsContent).toContain('Project Review');
			expect(icsContent).toContain('Team Outing');
		});
	});
});
