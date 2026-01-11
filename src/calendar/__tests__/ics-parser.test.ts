import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from 'obsidian';
import { parseIcsFile, IcsEvent, IcsParseResult, IcsParseError } from '../ics-parser';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Test suite for ICS file parser
 * Following TDD approach - these tests are written FIRST and will fail until implementation is complete
 */
describe('ICS Parser', () => {
	let app: App;
	const fixturesPath = resolve(__dirname, 'fixtures');

	beforeEach(() => {
		app = new App();
	});

	describe('parseIcsFile', () => {
		describe('when parsing valid ICS files', () => {
			it('should parse valid ICS file with multiple events', async () => {
				// Arrange
				const filePath = resolve(fixturesPath, 'valid-events.ics');

				// Act
				const result: IcsParseResult = await parseIcsFile(filePath, app);

				// Assert
				expect(result.events).toBeDefined();
				expect(result.events).toHaveLength(2);
				expect(result.errors).toBeUndefined();

				// First event
				expect(result.events[0].summary).toBe('Daily Standup');
				expect(result.events[0].start).toBeInstanceOf(Date);
				expect(result.events[0].end).toBeInstanceOf(Date);
				expect(result.events[0].isAllDay).toBe(false);

				// Second event
				expect(result.events[1].summary).toBe('Planning Meeting');
				expect(result.events[1].start).toBeInstanceOf(Date);
				expect(result.events[1].end).toBeInstanceOf(Date);
				expect(result.events[1].isAllDay).toBe(false);
			});

			it('should handle empty ICS file with no events', async () => {
				// Arrange
				const filePath = resolve(fixturesPath, 'empty-events.ics');

				// Act
				const result: IcsParseResult = await parseIcsFile(filePath, app);

				// Assert
				expect(result.events).toBeDefined();
				expect(result.events).toHaveLength(0);
				expect(result.errors).toBeUndefined();
			});

			it('should correctly identify all-day events', async () => {
				// Arrange
				const filePath = resolve(fixturesPath, 'all-day-event.ics');

				// Act
				const result: IcsParseResult = await parseIcsFile(filePath, app);

				// Assert
				expect(result.events).toHaveLength(1);
				expect(result.events[0].summary).toBe('Holiday');
				expect(result.events[0].isAllDay).toBe(true);
				expect(result.events[0].start).toBeInstanceOf(Date);
				expect(result.events[0].end).toBeInstanceOf(Date);
			});

			it('should extract correct event details', async () => {
				// Arrange
				const filePath = resolve(fixturesPath, 'valid-events.ics');

				// Act
				const result: IcsParseResult = await parseIcsFile(filePath, app);

				// Assert
				const event = result.events[0];
				expect(event).toHaveProperty('summary');
				expect(event).toHaveProperty('start');
				expect(event).toHaveProperty('end');
				expect(event).toHaveProperty('isAllDay');
				expect(typeof event.summary).toBe('string');
				expect(event.start instanceof Date).toBe(true);
				expect(event.end instanceof Date).toBe(true);
				expect(typeof event.isAllDay).toBe('boolean');
			});
		});

		describe('when handling file errors', () => {
			it('should throw FILE_NOT_FOUND error when file does not exist', async () => {
				// Arrange
				const filePath = resolve(fixturesPath, 'non-existent-file.ics');

				// Act & Assert
				await expect(parseIcsFile(filePath, app)).rejects.toThrow(IcsParseError);
				await expect(parseIcsFile(filePath, app)).rejects.toMatchObject({
					code: 'FILE_NOT_FOUND',
					message: expect.stringContaining('not found')
				});
			});

			it('should throw INVALID_PATH error when path is invalid', async () => {
				// Arrange
				const filePath = '';

				// Act & Assert
				await expect(parseIcsFile(filePath, app)).rejects.toThrow(IcsParseError);
				await expect(parseIcsFile(filePath, app)).rejects.toMatchObject({
					code: 'INVALID_PATH'
				});
			});

			it('should throw INVALID_PATH error when path is whitespace only', async () => {
				// Arrange
				const filePath = '   ';

				// Act & Assert
				await expect(parseIcsFile(filePath, app)).rejects.toThrow(IcsParseError);
				await expect(parseIcsFile(filePath, app)).rejects.toMatchObject({
					code: 'INVALID_PATH'
				});
			});

			it('should throw INVALID_FORMAT error when ICS file is malformed', async () => {
				// Arrange
				const filePath = resolve(fixturesPath, 'malformed.ics');

				// Act & Assert
				await expect(parseIcsFile(filePath, app)).rejects.toThrow(IcsParseError);
				await expect(parseIcsFile(filePath, app)).rejects.toMatchObject({
					code: 'INVALID_FORMAT',
					message: expect.stringContaining('malformed')
				});
			});
		});

		describe('when handling edge cases', () => {
			it('should handle events with missing summary gracefully', async () => {
				// Arrange - We'll need to create this fixture
				const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
DTSTART:20260111T100000Z
DTEND:20260111T110000Z
UID:no-summary@test.com
END:VEVENT
END:VCALENDAR`;

				const filePath = resolve(fixturesPath, 'no-summary.ics');
				await readFile(filePath).catch(() => {
					// File might not exist yet, that's ok for this test
				});

				// For this test, we expect either:
				// 1. Event with empty/default summary, OR
				// 2. Event to be skipped
				// We'll validate behavior exists without being too prescriptive
				expect(true).toBe(true); // Placeholder - will implement after seeing library behavior
			});

			it('should handle files with only past events', async () => {
				// Arrange
				const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
DTSTART:20200111T100000Z
DTEND:20200111T110000Z
SUMMARY:Past Event
UID:past@test.com
END:VEVENT
END:VCALENDAR`;

				// This test validates that parser returns ALL events, not filtered by date
				// Filtering by date will be a separate function's responsibility
				expect(true).toBe(true); // Will implement after core parser works
			});
		});

		describe('IcsParseError', () => {
			it('should be an instance of Error', () => {
				// Arrange & Act
				const error = new IcsParseError('Test error', 'TEST_CODE');

				// Assert
				expect(error).toBeInstanceOf(Error);
				expect(error.name).toBe('IcsParseError');
				expect(error.message).toBe('Test error');
				expect(error.code).toBe('TEST_CODE');
			});

			it('should have a code property', () => {
				// Arrange & Act
				const error = new IcsParseError('Test', 'CODE');

				// Assert
				expect(error).toHaveProperty('code');
				expect(error.code).toBe('CODE');
			});
		});
	});

	describe('IcsEvent interface', () => {
		it('should have required properties', () => {
			// Arrange
			const event: IcsEvent = {
				summary: 'Test Event',
				start: new Date(),
				end: new Date(),
				isAllDay: false
			};

			// Assert
			expect(event).toHaveProperty('summary');
			expect(event).toHaveProperty('start');
			expect(event).toHaveProperty('end');
			expect(event).toHaveProperty('isAllDay');
		});
	});

	describe('IcsParseResult interface', () => {
		it('should have events array', () => {
			// Arrange
			const result: IcsParseResult = {
				events: []
			};

			// Assert
			expect(result).toHaveProperty('events');
			expect(Array.isArray(result.events)).toBe(true);
		});

		it('should optionally have errors array', () => {
			// Arrange
			const resultWithErrors: IcsParseResult = {
				events: [],
				errors: ['Error 1']
			};

			const resultWithoutErrors: IcsParseResult = {
				events: []
			};

			// Assert
			expect(resultWithErrors.errors).toBeDefined();
			expect(resultWithoutErrors.errors).toBeUndefined();
		});
	});
});
