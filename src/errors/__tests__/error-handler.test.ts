/**
 * Tests for Error Handler
 * Tests centralized error handling with user-friendly messages and suggestions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock obsidian-daily-notes-interface before importing modules that use it
vi.mock('obsidian-daily-notes-interface', () => import('../../__mocks__/obsidian-daily-notes-interface'));

import {
	DailySyncError,
	formatErrorForUser,
	type UserFacingError
} from '../error-handler';
import { IcsParseError } from '../../calendar/ics-parser';
import { GoogleCalendarFetchError } from '../../calendar/google-calendar-fetcher';
import { DailyNotesNotEnabledError } from '../../daily-note/daily-note-finder';
import { SectionNotFoundError } from '../../daily-note/meeting-inserter';
import { SyncError } from '../../sync/sync-orchestrator';

describe('Error Handler', () => {
	describe('DailySyncError', () => {
		it('should create error with all properties', () => {
			// Arrange & Act
			const error = new DailySyncError(
				'FILE_NOT_FOUND',
				'Technical message',
				'User-friendly message',
				['Suggestion 1', 'Suggestion 2']
			);

			// Assert
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('DailySyncError');
			expect(error.code).toBe('FILE_NOT_FOUND');
			expect(error.message).toBe('Technical message');
			expect(error.userMessage).toBe('User-friendly message');
			expect(error.suggestions).toEqual(['Suggestion 1', 'Suggestion 2']);
		});

		it('should create error with optional cause', () => {
			// Arrange
			const originalError = new Error('Original error');

			// Act
			const error = new DailySyncError(
				'PARSE_ERROR',
				'Failed to parse',
				'Cannot read file',
				['Check file format'],
				originalError
			);

			// Assert
			expect(error.cause).toBe(originalError);
		});

		it('should maintain stack trace', () => {
			// Arrange & Act
			const error = new DailySyncError(
				'TEST_ERROR',
				'Test',
				'Test message',
				[]
			);

			// Assert
			expect(error.stack).toBeDefined();
		});
	});

	describe('formatErrorForUser - IcsParseError', () => {
		it('should format FILE_NOT_FOUND error', () => {
			// Arrange
			const error = new IcsParseError(
				'File not found: /path/to/calendar.ics',
				'FILE_NOT_FOUND'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Calendar File Not Found');
			expect(result.message).toContain('calendar file');
			expect(result.suggestions).toContain('Check that the file path in settings is correct');
			expect(result.suggestions.length).toBeGreaterThan(0);
		});

		it('should format PERMISSION_DENIED error', () => {
			// Arrange
			const error = new IcsParseError(
				'Permission denied: /path/to/calendar.ics',
				'PERMISSION_DENIED'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Permission Denied');
			expect(result.message).toContain('permission');
			expect(result.suggestions).toContain('Check file permissions');
		});

		it('should format INVALID_FORMAT error', () => {
			// Arrange
			const error = new IcsParseError(
				'Content is malformed',
				'INVALID_FORMAT'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Invalid Calendar Format');
			expect(result.message).toContain('valid calendar format');
			expect(result.suggestions).toContain('Verify the file is a valid .ics calendar file');
		});

		it('should format generic PARSE_ERROR', () => {
			// Arrange
			const error = new IcsParseError(
				'Failed to parse ICS content',
				'PARSE_ERROR'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Calendar Parsing Error');
			expect(result.message).toContain('parse');
			expect(result.suggestions.length).toBeGreaterThan(0);
		});
	});

	describe('formatErrorForUser - GoogleCalendarFetchError', () => {
		it('should format INVALID_URL error', () => {
			// Arrange
			const error = new GoogleCalendarFetchError(
				'URL must be a Google Calendar URL',
				'INVALID_URL'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Invalid Calendar URL');
			expect(result.message).toContain('URL');
			expect(result.suggestions).toContain('Verify the URL is a Google Calendar shareable link ending in .ics');
		});

		it('should format NOT_FOUND error', () => {
			// Arrange
			const error = new GoogleCalendarFetchError(
				'Calendar not found',
				'NOT_FOUND'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Calendar Not Found');
			expect(result.message).toContain('could not be found');
			expect(result.suggestions).toContain('Check that the calendar URL is correct');
		});

		it('should format FORBIDDEN error', () => {
			// Arrange
			const error = new GoogleCalendarFetchError(
				'Calendar is not accessible',
				'FORBIDDEN'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Calendar Not Accessible');
			expect(result.message).toContain('not accessible');
			expect(result.suggestions).toContain('Make sure the calendar is publicly shared');
		});

		it('should format SERVER_ERROR', () => {
			// Arrange
			const error = new GoogleCalendarFetchError(
				'Google Calendar server error',
				'SERVER_ERROR'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Calendar Server Error');
			expect(result.message).toContain('server');
			expect(result.suggestions).toContain('Try again in a few minutes');
		});

		it('should format NETWORK_ERROR', () => {
			// Arrange
			const error = new GoogleCalendarFetchError(
				'Network error: Connection refused',
				'NETWORK_ERROR'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Network Error');
			expect(result.message).toContain('internet connection');
			expect(result.suggestions).toContain('Check your internet connection');
		});
	});

	describe('formatErrorForUser - DailyNotesNotEnabledError', () => {
		it('should format daily notes not enabled error', () => {
			// Arrange
			const error = new DailyNotesNotEnabledError(
				'Daily Notes plugin is not enabled'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Daily Notes Plugin Required');
			expect(result.message).toContain('Daily Notes');
			expect(result.suggestions).toContain('Enable the Daily Notes core plugin in Settings → Core plugins');
		});
	});

	describe('formatErrorForUser - SectionNotFoundError', () => {
		it('should format section not found error', () => {
			// Arrange
			const error = new SectionNotFoundError(
				'Section "Meetings" not found in 2024-01-15.md'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Section Not Found');
			expect(result.message).toContain('section');
			expect(result.suggestions).toContain('Check the section name in plugin settings');
		});
	});

	describe('formatErrorForUser - SyncError', () => {
		it('should format no sources configured error', () => {
			// Arrange
			const error = new SyncError(
				'No calendar sources configured'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('No Calendar Sources');
			expect(result.message).toContain('calendar source');
			expect(result.suggestions).toContain('Configure at least one calendar source in plugin settings');
		});

		it('should format daily note creation error', () => {
			// Arrange
			const error = new SyncError(
				'Failed to find or create daily note'
			);

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Daily Note Error');
			expect(result.message).toContain('daily note');
			expect(result.suggestions.length).toBeGreaterThan(0);
		});
	});

	describe('formatErrorForUser - Unknown errors', () => {
		it('should format standard Error', () => {
			// Arrange
			const error = new Error('Something went wrong');

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Unexpected Error');
			expect(result.message).toBe('Something went wrong');
			expect(result.suggestions).toContain('Try running the sync command again');
			expect(result.suggestions).toContain('Check the console for more details (Ctrl+Shift+I)');
		});

		it('should format string error', () => {
			// Arrange
			const error = 'String error message';

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Unexpected Error');
			expect(result.message).toBe('String error message');
		});

		it('should format non-error object', () => {
			// Arrange
			const error = { custom: 'error' };

			// Act
			const result = formatErrorForUser(error);

			// Assert
			expect(result.title).toBe('Unexpected Error');
			expect(result.message).toContain('unknown error');
		});
	});

	describe('formatErrorForUser - UserFacingError type', () => {
		it('should return correct structure for all errors', () => {
			// Arrange
			const error = new IcsParseError('Test error', 'FILE_NOT_FOUND');

			// Act
			const result: UserFacingError = formatErrorForUser(error);

			// Assert
			expect(result).toHaveProperty('title');
			expect(result).toHaveProperty('message');
			expect(result).toHaveProperty('suggestions');
			expect(typeof result.title).toBe('string');
			expect(typeof result.message).toBe('string');
			expect(Array.isArray(result.suggestions)).toBe(true);
			expect(result.suggestions.every(s => typeof s === 'string')).toBe(true);
		});
	});

	describe('Error message clarity', () => {
		it('should have user-friendly messages without technical jargon', () => {
			// Arrange
			const errors = [
				new IcsParseError('File not found', 'FILE_NOT_FOUND'),
				new GoogleCalendarFetchError('URL invalid', 'INVALID_URL'),
				new DailyNotesNotEnabledError('Plugin not enabled')
			];

			// Act & Assert
			errors.forEach(error => {
				const result = formatErrorForUser(error);

				// Message should not contain technical terms
				const technicalTerms = ['ENOENT', 'EACCES', 'null', 'undefined', 'stack trace'];
				const hasJargon = technicalTerms.some(term =>
					result.message.includes(term) || result.title.includes(term)
				);

				expect(hasJargon).toBe(false);

				// Should have at least one suggestion
				expect(result.suggestions.length).toBeGreaterThan(0);
			});
		});

		it('should provide actionable suggestions', () => {
			// Arrange
			const error = new IcsParseError('File not found', 'FILE_NOT_FOUND');

			// Act
			const result = formatErrorForUser(error);

			// Assert
			result.suggestions.forEach(suggestion => {
				// Each suggestion should be actionable (start with a verb or be instructive)
				const isActionable = /^(Check|Verify|Make sure|Enable|Try|Ensure|Go to|Open)/.test(suggestion);
				expect(isActionable || suggestion.includes('settings')).toBe(true);
			});
		});
	});
});
