/**
 * Tests for Sync Orchestrator
 * Tests the main sync command that orchestrates all calendar sources
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App, TFile, moment } from '../../__mocks__/obsidian';
import type { DailySyncSettings } from '../../settings';
import * as icsParser from '../../calendar/ics-parser';
import * as dailyNoteFinder from '../../daily-note/daily-note-finder';
import * as sectionCreator from '../../daily-note/section-creator';
import * as meetingInserter from '../../daily-note/meeting-inserter';

// Mock obsidian-daily-notes-interface to avoid import issues
vi.mock('obsidian-daily-notes-interface', () => import('../../__mocks__/obsidian-daily-notes-interface'));

// Import after mocking
import { syncMeetingsToDaily, SyncError } from '../sync-orchestrator';

describe('Sync Orchestrator', () => {
	let app: App;
	let settings: DailySyncSettings;
	let dailyNote: TFile;

	beforeEach(() => {
		app = new App();
		dailyNote = new TFile('2024-01-15.md');
		settings = {
			icsFilePath: '/path/to/calendar.ics',
			localCalendarSection: 'Local Meetings',
			googleCalendarLink: 'https://calendar.google.com/calendar/ical/test',
			googleCalendarSection: 'Google Meetings'
		};

		// Default mocks
		vi.spyOn(dailyNoteFinder, 'findOrCreateDailyNote').mockResolvedValue(dailyNote);
		vi.spyOn(sectionCreator, 'ensureSectionExists').mockResolvedValue();
		vi.spyOn(meetingInserter, 'insertMeetingsIntoNote').mockResolvedValue();
	});

	describe('syncMeetingsToDaily', () => {
		it('should sync from both sources when both configured', async () => {
			// Arrange
			const localMeetings = [
				{
					summary: 'Local Meeting',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T11:00:00'),
					isAllDay: false
				}
			];
			const googleMeetings = [
				{
					summary: 'Google Meeting',
					start: new Date('2024-01-15T14:00:00'),
					end: new Date('2024-01-15T15:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(icsParser, 'parseIcsFile').mockResolvedValue({
				events: localMeetings,
				errors: []
			});
			vi.spyOn(icsParser, 'fetchAndParseGoogleCalendar').mockResolvedValue({
				events: googleMeetings,
				errors: []
			});
			vi.spyOn(icsParser, 'getTodaysMeetings').mockImplementation((events) => events);

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert
			expect(result.success).toBe(true);
			expect(result.dailyNote).toBe(dailyNote);
			expect(result.localCalendar.success).toBe(true);
			expect(result.localCalendar.meetingsAdded).toBe(1);
			expect(result.googleCalendar.success).toBe(true);
			expect(result.googleCalendar.meetingsAdded).toBe(1);
		});

		it('should sync only local ICS when Google not configured', async () => {
			// Arrange
			settings.googleCalendarLink = '';
			const localMeetings = [
				{
					summary: 'Local Meeting',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T11:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(icsParser, 'parseIcsFile').mockResolvedValue({
				events: localMeetings,
				errors: []
			});
			vi.spyOn(icsParser, 'getTodaysMeetings').mockImplementation((events) => events);

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert
			expect(result.success).toBe(true);
			expect(result.localCalendar.enabled).toBe(true);
			expect(result.localCalendar.success).toBe(true);
			expect(result.googleCalendar.enabled).toBe(false);
		});

		it('should sync only Google when local ICS not configured', async () => {
			// Arrange
			settings.icsFilePath = '';
			const googleMeetings = [
				{
					summary: 'Google Meeting',
					start: new Date('2024-01-15T14:00:00'),
					end: new Date('2024-01-15T15:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(icsParser, 'fetchAndParseGoogleCalendar').mockResolvedValue({
				events: googleMeetings,
				errors: []
			});
			vi.spyOn(icsParser, 'getTodaysMeetings').mockImplementation((events) => events);

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert
			expect(result.success).toBe(true);
			expect(result.localCalendar.enabled).toBe(false);
			expect(result.googleCalendar.enabled).toBe(true);
			expect(result.googleCalendar.success).toBe(true);
		});

		it('should throw error when neither source configured', async () => {
			// Arrange
			settings.icsFilePath = '';
			settings.googleCalendarLink = '';

			// Act & Assert
			await expect(syncMeetingsToDaily(app, settings)).rejects.toThrow(SyncError);
			await expect(syncMeetingsToDaily(app, settings)).rejects.toThrow(
				'No calendar sources configured'
			);
		});

		it('should handle one source failing while other succeeds', async () => {
			// Arrange
			const googleMeetings = [
				{
					summary: 'Google Meeting',
					start: new Date('2024-01-15T14:00:00'),
					end: new Date('2024-01-15T15:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(icsParser, 'parseIcsFile').mockRejectedValue(new Error('File not found'));
			vi.spyOn(icsParser, 'fetchAndParseGoogleCalendar').mockResolvedValue({
				events: googleMeetings,
				errors: []
			});
			vi.spyOn(icsParser, 'getTodaysMeetings').mockImplementation((events) => events);

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert
			expect(result.success).toBe(true); // Partial success
			expect(result.localCalendar.success).toBe(false);
			expect(result.localCalendar.error).toContain('File not found');
			expect(result.googleCalendar.success).toBe(true);
		});

		it('should fail when both sources fail', async () => {
			// Arrange
			vi.spyOn(icsParser, 'parseIcsFile').mockRejectedValue(new Error('Local error'));
			vi.spyOn(icsParser, 'fetchAndParseGoogleCalendar').mockRejectedValue(new Error('Network error'));

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert
			expect(result.success).toBe(false);
			expect(result.localCalendar.success).toBe(false);
			expect(result.googleCalendar.success).toBe(false);
		});

		it('should fail when daily note cannot be created', async () => {
			// Arrange
			vi.spyOn(dailyNoteFinder, 'findOrCreateDailyNote').mockRejectedValue(
				new Error('Daily Notes plugin not enabled')
			);

			// Act & Assert
			await expect(syncMeetingsToDaily(app, settings)).rejects.toThrow(SyncError);
		});

		it('should handle empty meetings array', async () => {
			// Arrange
			vi.spyOn(icsParser, 'parseIcsFile').mockResolvedValue({
				events: [],
				errors: []
			});
			vi.spyOn(icsParser, 'fetchAndParseGoogleCalendar').mockResolvedValue({
				events: [],
				errors: []
			});
			vi.spyOn(icsParser, 'getTodaysMeetings').mockReturnValue([]);

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert
			expect(result.success).toBe(true);
			expect(result.localCalendar.meetingsAdded).toBe(0);
			expect(result.googleCalendar.meetingsAdded).toBe(0);
		});

		it('should ensure sections exist before inserting', async () => {
			// Arrange
			const meetings = [
				{
					summary: 'Meeting',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T11:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(icsParser, 'parseIcsFile').mockResolvedValue({
				events: meetings,
				errors: []
			});
			vi.spyOn(icsParser, 'getTodaysMeetings').mockImplementation((events) => events);
			const ensureSectionSpy = vi.spyOn(sectionCreator, 'ensureSectionExists');

			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert
			expect(ensureSectionSpy).toHaveBeenCalledWith(app, dailyNote, 'Local Meetings', 2);
		});

		it('should filter meetings for today only', async () => {
			// Arrange
			const allMeetings = [
				{
					summary: 'Yesterday',
					start: new Date('2024-01-14T10:00:00'),
					end: new Date('2024-01-14T11:00:00'),
					isAllDay: false
				},
				{
					summary: 'Today',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T11:00:00'),
					isAllDay: false
				},
				{
					summary: 'Tomorrow',
					start: new Date('2024-01-16T10:00:00'),
					end: new Date('2024-01-16T11:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(icsParser, 'parseIcsFile').mockResolvedValue({
				events: allMeetings,
				errors: []
			});
			const getTodaysSpy = vi.spyOn(icsParser, 'getTodaysMeetings').mockReturnValue([allMeetings[1]]);

			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert
			expect(getTodaysSpy).toHaveBeenCalled();
		});

		it('should handle section creation failure for one source', async () => {
			// Arrange
			const meetings = [
				{
					summary: 'Meeting',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T11:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(icsParser, 'parseIcsFile').mockResolvedValue({
				events: meetings,
				errors: []
			});
			vi.spyOn(icsParser, 'fetchAndParseGoogleCalendar').mockResolvedValue({
				events: meetings,
				errors: []
			});
			vi.spyOn(icsParser, 'getTodaysMeetings').mockImplementation((events) => events);

			vi.spyOn(sectionCreator, 'ensureSectionExists').mockImplementation(async (app, file, section) => {
				if (section === 'Local Meetings') {
					throw new Error('Invalid section name');
				}
			});

			// Act
			const result = await syncMeetingsToDaily(app, settings);

			// Assert
			expect(result.success).toBe(true); // Partial success
			expect(result.localCalendar.success).toBe(false);
			expect(result.googleCalendar.success).toBe(true);
		});

		it('should use correct section names from settings', async () => {
			// Arrange
			settings.localCalendarSection = 'Work Meetings';
			settings.googleCalendarSection = 'Personal Events';

			const meetings = [
				{
					summary: 'Meeting',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T11:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(icsParser, 'parseIcsFile').mockResolvedValue({
				events: meetings,
				errors: []
			});
			vi.spyOn(icsParser, 'fetchAndParseGoogleCalendar').mockResolvedValue({
				events: meetings,
				errors: []
			});
			vi.spyOn(icsParser, 'getTodaysMeetings').mockImplementation((events) => events);
			const ensureSectionSpy = vi.spyOn(sectionCreator, 'ensureSectionExists');

			// Act
			await syncMeetingsToDaily(app, settings);

			// Assert
			expect(ensureSectionSpy).toHaveBeenCalledWith(app, dailyNote, 'Work Meetings', 2);
			expect(ensureSectionSpy).toHaveBeenCalledWith(app, dailyNote, 'Personal Events', 2);
		});
	});

	describe('Error classes', () => {
		it('should have SyncError with correct name', () => {
			// Arrange & Act
			const error = new SyncError('test message');

			// Assert
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('SyncError');
			expect(error.message).toBe('test message');
		});
	});
});
