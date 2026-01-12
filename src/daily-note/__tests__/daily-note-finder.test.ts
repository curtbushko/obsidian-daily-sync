/**
 * Tests for Daily Note Finder
 * Tests finding and creating daily notes using obsidian-daily-notes-interface
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App, TFile, moment } from '../../__mocks__/obsidian';
import {
	setPluginLoaded,
	setDailyNotes,
	setCreateShouldFail,
	resetMocks
} from '../../__mocks__/obsidian-daily-notes-interface';
import {
	findOrCreateDailyNote,
	DailyNotesNotEnabledError,
	DailyNoteCreationError
} from '../daily-note-finder';

// Mock the obsidian-daily-notes-interface module
vi.mock('obsidian-daily-notes-interface', () => import('../../__mocks__/obsidian-daily-notes-interface'));

describe('Daily Note Finder', () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		resetMocks();
	});

	describe('findOrCreateDailyNote', () => {
		it('should return existing daily note when it exists', async () => {
			// Arrange
			const testDate = moment('2024-01-15');
			const existingFile = new TFile('Daily Notes/2024-01-15.md');
			setDailyNotes({ '2024-01-15': existingFile });

			// Act
			const result = await findOrCreateDailyNote(app, testDate);

			// Assert
			expect(result).toBe(existingFile);
			expect(result.path).toBe('Daily Notes/2024-01-15.md');
		});

		it('should create and return new daily note when it does not exist', async () => {
			// Arrange
			const testDate = moment('2024-01-16');
			setDailyNotes({}); // No existing notes

			// Act
			const result = await findOrCreateDailyNote(app, testDate);

			// Assert
			expect(result).toBeInstanceOf(TFile);
			expect(result.path).toBe('Daily Notes/2024-01-16.md');
		});

		it('should default to today when no date provided', async () => {
			// Arrange
			const today = moment();
			const todayStr = today.format('YYYY-MM-DD');
			setDailyNotes({});

			// Act
			const result = await findOrCreateDailyNote(app);

			// Assert
			expect(result).toBeInstanceOf(TFile);
			expect(result.path).toBe(`Daily Notes/${todayStr}.md`);
		});

		it('should handle different date formats correctly', async () => {
			// Arrange
			const testDate = moment('2024-12-31');
			setDailyNotes({});

			// Act
			const result = await findOrCreateDailyNote(app, testDate);

			// Assert
			expect(result.path).toBe('Daily Notes/2024-12-31.md');
		});

		it('should throw DailyNotesNotEnabledError when plugin is not loaded', async () => {
			// Arrange
			setPluginLoaded(false);
			const testDate = moment('2024-01-15');

			// Act & Assert
			await expect(findOrCreateDailyNote(app, testDate)).rejects.toThrow(DailyNotesNotEnabledError);
			await expect(findOrCreateDailyNote(app, testDate)).rejects.toThrow(
				'Daily Notes plugin is not enabled'
			);
		});

		it('should throw DailyNoteCreationError when file creation fails', async () => {
			// Arrange
			const testDate = moment('2024-01-15');
			setDailyNotes({});
			setCreateShouldFail(true);

			// Act & Assert
			await expect(findOrCreateDailyNote(app, testDate)).rejects.toThrow(DailyNoteCreationError);
			await expect(findOrCreateDailyNote(app, testDate)).rejects.toThrow(
				/Failed to create daily note/
			);
		});

		it('should work with past dates', async () => {
			// Arrange
			const pastDate = moment('2023-01-01');
			setDailyNotes({});

			// Act
			const result = await findOrCreateDailyNote(app, pastDate);

			// Assert
			expect(result.path).toBe('Daily Notes/2023-01-01.md');
		});

		it('should work with future dates', async () => {
			// Arrange
			const futureDate = moment('2025-12-31');
			setDailyNotes({});

			// Act
			const result = await findOrCreateDailyNote(app, futureDate);

			// Assert
			expect(result.path).toBe('Daily Notes/2025-12-31.md');
		});

		it('should return same file for multiple calls with same date', async () => {
			// Arrange
			const testDate = moment('2024-01-15');
			setDailyNotes({});

			// Act
			const result1 = await findOrCreateDailyNote(app, testDate);
			const result2 = await findOrCreateDailyNote(app, testDate);

			// Assert
			expect(result1.path).toBe(result2.path);
		});

		it('should handle edge case of year boundary', async () => {
			// Arrange
			const newYearDate = moment('2024-01-01');
			setDailyNotes({});

			// Act
			const result = await findOrCreateDailyNote(app, newYearDate);

			// Assert
			expect(result.path).toBe('Daily Notes/2024-01-01.md');
		});

		it('should handle leap year date', async () => {
			// Arrange
			const leapDate = moment('2024-02-29');
			setDailyNotes({});

			// Act
			const result = await findOrCreateDailyNote(app, leapDate);

			// Assert
			expect(result.path).toBe('Daily Notes/2024-02-29.md');
		});
	});

	describe('Error classes', () => {
		it('should have DailyNotesNotEnabledError with correct name', () => {
			// Arrange & Act
			const error = new DailyNotesNotEnabledError('test message');

			// Assert
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('DailyNotesNotEnabledError');
			expect(error.message).toBe('test message');
		});

		it('should have DailyNoteCreationError with correct name', () => {
			// Arrange & Act
			const error = new DailyNoteCreationError('test message');

			// Assert
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('DailyNoteCreationError');
			expect(error.message).toBe('test message');
		});
	});
});
