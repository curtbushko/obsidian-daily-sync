/**
 * Tests for Date Detector
 * Tests detection of target date from currently open daily note
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App, TFile, moment } from '../../__mocks__/obsidian';
import {
	setPluginLoaded,
	setDailyNotes,
	resetMocks
} from '../../__mocks__/obsidian-daily-notes-interface';
import { getTargetDateForSync } from '../date-detector';

// Mock the obsidian-daily-notes-interface module
vi.mock('obsidian-daily-notes-interface', () => import('../../__mocks__/obsidian-daily-notes-interface'));

describe('Date Detector', () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		resetMocks();
		// Clear any active file mock
		vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(null);
	});

	describe('getTargetDateForSync', () => {
		it('should return today when no file is open', () => {
			// Arrange
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(null);
			const today = moment();

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe(today.format('YYYYMMDD'));
		});

		it('should return today when daily notes plugin is not loaded', () => {
			// Arrange
			setPluginLoaded(false);
			const dailyNote = new TFile('Daily Notes/20240115.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(dailyNote);
			const today = moment();

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe(today.format('YYYYMMDD'));
		});

		it('should return today when non-daily note is open', () => {
			// Arrange
			const regularNote = new TFile('Notes/My Project.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(regularNote);
			setDailyNotes({}); // No daily notes exist
			const today = moment();

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe(today.format('YYYYMMDD'));
		});

		it('should extract date from daily note filename', () => {
			// Arrange
			const targetDate = moment('2024-01-15');
			const dailyNote = new TFile('Daily Notes/20240115.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(dailyNote);
			setDailyNotes({ '20240115': dailyNote });

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe('20240115');
		});

		it('should handle past dates in daily notes', () => {
			// Arrange
			const pastDate = moment('2023-06-20');
			const dailyNote = new TFile('Daily Notes/20230620.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(dailyNote);
			setDailyNotes({ '20230620': dailyNote });

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe('20230620');
		});

		it('should handle future dates in daily notes', () => {
			// Arrange
			const futureDate = moment('2025-12-31');
			const dailyNote = new TFile('Daily Notes/20251231.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(dailyNote);
			setDailyNotes({ '20251231': dailyNote });

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe('20251231');
		});

		it('should handle different date formats in filenames', () => {
			// Arrange - filename with YYYYMMDD format
			const targetDate = moment('2024-03-01');
			const dailyNote = new TFile('Daily Notes/20240301.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(dailyNote);
			setDailyNotes({ '20240301': dailyNote });

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe('20240301');
		});

		it('should fall back to today when daily note has unparseable date', () => {
			// Arrange - file that looks like daily note but isn't registered
			const invalidNote = new TFile('Daily Notes/invalid-date.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(invalidNote);
			setDailyNotes({}); // Not registered as a daily note
			const today = moment();

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe(today.format('YYYYMMDD'));
		});

		it('should handle year boundary dates correctly', () => {
			// Arrange
			const newYearDate = moment('2024-01-01');
			const dailyNote = new TFile('Daily Notes/20240101.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(dailyNote);
			setDailyNotes({ '20240101': dailyNote });

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe('20240101');
		});

		it('should handle leap year dates correctly', () => {
			// Arrange
			const leapDate = moment('2024-02-29');
			const dailyNote = new TFile('Daily Notes/20240229.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(dailyNote);
			setDailyNotes({ '20240229': dailyNote });

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe('20240229');
		});

		it('should return moment object with correct time methods', () => {
			// Arrange
			const targetDate = moment('2024-01-15');
			const dailyNote = new TFile('Daily Notes/20240115.md');
			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(dailyNote);
			setDailyNotes({ '20240115': dailyNote });

			// Act
			const result = getTargetDateForSync(app);

			// Assert - verify it's a proper Moment object
			expect(result.isValid()).toBe(true);
			expect(typeof result.toDate).toBe('function');
			expect(typeof result.format).toBe('function');
			expect(result.toDate()).toBeInstanceOf(Date);
		});

		it('should handle multiple daily notes but only use active one', () => {
			// Arrange
			const activeDate = moment('2024-01-15');
			const activeDailyNote = new TFile('Daily Notes/20240115.md');
			const otherDailyNote = new TFile('Daily Notes/20240120.md');

			vi.spyOn(app.workspace, 'getActiveFile').mockReturnValue(activeDailyNote);
			setDailyNotes({
				'20240115': activeDailyNote,
				'20240120': otherDailyNote
			});

			// Act
			const result = getTargetDateForSync(app);

			// Assert
			expect(result.format('YYYYMMDD')).toBe('20240115');
		});
	});
});
