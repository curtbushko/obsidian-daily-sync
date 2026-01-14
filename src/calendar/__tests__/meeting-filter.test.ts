import { describe, it, expect, beforeEach } from 'vitest';
import { getTodaysMeetings, IcsEvent } from '../ics-parser';

/**
 * Test suite for filtering today's meetings from ICS events
 * Following TDD approach - these tests are written FIRST and will fail until implementation is complete
 */
describe('Meeting Filter', () => {
	describe('getTodaysMeetings', () => {
		let sampleEvents: IcsEvent[];
		let targetDate: Date;

		beforeEach(() => {
			// Target date: January 15, 2026 (arbitrary date for testing)
			targetDate = new Date(2026, 0, 15, 12, 0, 0); // Month is 0-indexed

			// Sample events for testing
			sampleEvents = [
				// Event on target date (morning)
				{
					summary: 'Morning Standup',
					start: new Date(2026, 0, 15, 9, 0, 0),
					end: new Date(2026, 0, 15, 9, 30, 0),
					isAllDay: false
				},
				// Event on target date (afternoon)
				{
					summary: 'Afternoon Meeting',
					start: new Date(2026, 0, 15, 14, 0, 0),
					end: new Date(2026, 0, 15, 15, 0, 0),
					isAllDay: false
				},
				// Event on previous day
				{
					summary: 'Yesterday Event',
					start: new Date(2026, 0, 14, 10, 0, 0),
					end: new Date(2026, 0, 14, 11, 0, 0),
					isAllDay: false
				},
				// Event on next day
				{
					summary: 'Tomorrow Event',
					start: new Date(2026, 0, 16, 10, 0, 0),
					end: new Date(2026, 0, 16, 11, 0, 0),
					isAllDay: false
				},
				// All-day event on target date
				{
					summary: 'All Day Event Today',
					start: new Date(2026, 0, 15, 0, 0, 0),
					end: new Date(2026, 0, 16, 0, 0, 0),
					isAllDay: true
				},
				// All-day event on different date
				{
					summary: 'All Day Event Tomorrow',
					start: new Date(2026, 0, 16, 0, 0, 0),
					end: new Date(2026, 0, 17, 0, 0, 0),
					isAllDay: true
				},
				// Event at midnight on target date
				{
					summary: 'Midnight Event',
					start: new Date(2026, 0, 15, 0, 0, 0),
					end: new Date(2026, 0, 15, 1, 0, 0),
					isAllDay: false
				},
				// Event late night on target date
				{
					summary: 'Late Night Event',
					start: new Date(2026, 0, 15, 23, 0, 0),
					end: new Date(2026, 0, 15, 23, 59, 0),
					isAllDay: false
				}
			];
		});

		describe('when filtering by target date', () => {
			it('should return empty array when no events provided', () => {
				// Arrange
				const events: IcsEvent[] = [];

				// Act
				const result = getTodaysMeetings(events, targetDate);

				// Assert
				expect(result).toEqual([]);
				expect(result).toHaveLength(0);
			});

			it('should return only events on target date', () => {
				// Arrange & Act
				const result = getTodaysMeetings(sampleEvents, targetDate);

				// Assert
				expect(result).toHaveLength(5); // Morning, Afternoon, All Day, Midnight, Late Night
				expect(result.map(e => e.summary)).toContain('Morning Standup');
				expect(result.map(e => e.summary)).toContain('Afternoon Meeting');
				expect(result.map(e => e.summary)).toContain('All Day Event Today');
				expect(result.map(e => e.summary)).toContain('Midnight Event');
				expect(result.map(e => e.summary)).toContain('Late Night Event');
			});

			it('should exclude events from other dates', () => {
				// Arrange & Act
				const result = getTodaysMeetings(sampleEvents, targetDate);

				// Assert
				expect(result.map(e => e.summary)).not.toContain('Yesterday Event');
				expect(result.map(e => e.summary)).not.toContain('Tomorrow Event');
				expect(result.map(e => e.summary)).not.toContain('All Day Event Tomorrow');
			});

			it('should handle events at midnight correctly', () => {
				// Arrange & Act
				const result = getTodaysMeetings(sampleEvents, targetDate);

				// Assert
				const midnightEvent = result.find(e => e.summary === 'Midnight Event');
				expect(midnightEvent).toBeDefined();
				expect(midnightEvent?.start.getHours()).toBe(0);
			});

			it('should handle events late at night correctly', () => {
				// Arrange & Act
				const result = getTodaysMeetings(sampleEvents, targetDate);

				// Assert
				const lateNightEvent = result.find(e => e.summary === 'Late Night Event');
				expect(lateNightEvent).toBeDefined();
				expect(lateNightEvent?.start.getHours()).toBe(23);
			});
		});

		describe('when handling all-day events', () => {
			it('should include all-day events on target date', () => {
				// Arrange & Act
				const result = getTodaysMeetings(sampleEvents, targetDate);

				// Assert
				const allDayEvent = result.find(e => e.summary === 'All Day Event Today');
				expect(allDayEvent).toBeDefined();
				expect(allDayEvent?.isAllDay).toBe(true);
			});

			it('should exclude all-day events on different dates', () => {
				// Arrange & Act
				const result = getTodaysMeetings(sampleEvents, targetDate);

				// Assert
				expect(result.map(e => e.summary)).not.toContain('All Day Event Tomorrow');
			});

			it('should handle all-day events spanning multiple days', () => {
				// Arrange
				const multiDayEvents: IcsEvent[] = [
					{
						summary: 'Conference Day 1',
						start: new Date(2026, 0, 14, 0, 0, 0),
						end: new Date(2026, 0, 15, 0, 0, 0),
						isAllDay: true
					},
					{
						summary: 'Conference Day 2',
						start: new Date(2026, 0, 15, 0, 0, 0),
						end: new Date(2026, 0, 16, 0, 0, 0),
						isAllDay: true
					},
					{
						summary: 'Conference Day 3',
						start: new Date(2026, 0, 16, 0, 0, 0),
						end: new Date(2026, 0, 17, 0, 0, 0),
						isAllDay: true
					}
				];

				// Act
				const result = getTodaysMeetings(multiDayEvents, targetDate);

				// Assert
				expect(result).toHaveLength(1);
				expect(result[0].summary).toBe('Conference Day 2');
			});
		});

		describe('when sorting events', () => {
			it('should sort events by start time', () => {
				// Arrange
				const unsortedEvents: IcsEvent[] = [
					{
						summary: 'Afternoon',
						start: new Date(2026, 0, 15, 14, 0, 0),
						end: new Date(2026, 0, 15, 15, 0, 0),
						isAllDay: false
					},
					{
						summary: 'Morning',
						start: new Date(2026, 0, 15, 9, 0, 0),
						end: new Date(2026, 0, 15, 10, 0, 0),
						isAllDay: false
					},
					{
						summary: 'Evening',
						start: new Date(2026, 0, 15, 18, 0, 0),
						end: new Date(2026, 0, 15, 19, 0, 0),
						isAllDay: false
					}
				];

				// Act
				const result = getTodaysMeetings(unsortedEvents, targetDate);

				// Assert
				expect(result).toHaveLength(3);
				expect(result[0].summary).toBe('Morning');
				expect(result[1].summary).toBe('Afternoon');
				expect(result[2].summary).toBe('Evening');
			});

			it('should place all-day events before timed events', () => {
				// Arrange
				const mixedEvents: IcsEvent[] = [
					{
						summary: 'Morning Meeting',
						start: new Date(2026, 0, 15, 9, 0, 0),
						end: new Date(2026, 0, 15, 10, 0, 0),
						isAllDay: false
					},
					{
						summary: 'Holiday',
						start: new Date(2026, 0, 15, 0, 0, 0),
						end: new Date(2026, 0, 16, 0, 0, 0),
						isAllDay: true
					},
					{
						summary: 'Afternoon Meeting',
						start: new Date(2026, 0, 15, 14, 0, 0),
						end: new Date(2026, 0, 15, 15, 0, 0),
						isAllDay: false
					}
				];

				// Act
				const result = getTodaysMeetings(mixedEvents, targetDate);

				// Assert
				expect(result).toHaveLength(3);
				expect(result[0].summary).toBe('Holiday');
				expect(result[0].isAllDay).toBe(true);
				expect(result[1].summary).toBe('Morning Meeting');
				expect(result[2].summary).toBe('Afternoon Meeting');
			});
		});

		describe('when using default date (today)', () => {
			it('should use current date when targetDate is not provided', () => {
				// Arrange
				const today = new Date();
				const todayEvents: IcsEvent[] = [
					{
						summary: 'Today Event',
						start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
						end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0),
						isAllDay: false
					},
					{
						summary: 'Other Day Event',
						start: new Date(2025, 5, 1, 10, 0, 0),
						end: new Date(2025, 5, 1, 11, 0, 0),
						isAllDay: false
					}
				];

				// Act
				const result = getTodaysMeetings(todayEvents);

				// Assert
				expect(result).toHaveLength(1);
				expect(result[0].summary).toBe('Today Event');
			});
		});

		describe('when handling edge cases', () => {
			it('should handle empty events array', () => {
				// Arrange
				const emptyEvents: IcsEvent[] = [];

				// Act
				const result = getTodaysMeetings(emptyEvents, targetDate);

				// Assert
				expect(result).toEqual([]);
			});

			it('should handle future dates', () => {
				// Arrange
				const futureDate = new Date(2027, 5, 15, 12, 0, 0);
				const events: IcsEvent[] = [
					{
						summary: 'Future Event',
						start: new Date(2027, 5, 15, 10, 0, 0),
						end: new Date(2027, 5, 15, 11, 0, 0),
						isAllDay: false
					}
				];

				// Act
				const result = getTodaysMeetings(events, futureDate);

				// Assert
				expect(result).toHaveLength(1);
				expect(result[0].summary).toBe('Future Event');
			});

			it('should handle past dates', () => {
				// Arrange
				const pastDate = new Date(2025, 5, 15, 12, 0, 0);
				const events: IcsEvent[] = [
					{
						summary: 'Past Event',
						start: new Date(2025, 5, 15, 10, 0, 0),
						end: new Date(2025, 5, 15, 11, 0, 0),
						isAllDay: false
					}
				];

				// Act
				const result = getTodaysMeetings(events, pastDate);

				// Assert
				expect(result).toHaveLength(1);
				expect(result[0].summary).toBe('Past Event');
			});

			it('should return empty array when no events match target date', () => {
				// Arrange
				const events: IcsEvent[] = [
					{
						summary: 'Wrong Date Event',
						start: new Date(2026, 5, 20, 10, 0, 0),
						end: new Date(2026, 5, 20, 11, 0, 0),
						isAllDay: false
					}
				];

				// Act
				const result = getTodaysMeetings(events, targetDate);

				// Assert
				expect(result).toEqual([]);
			});
		});
	});

	describe('filterIgnoredMeetings', () => {
		// Import will be added when function is implemented
		let filterIgnoredMeetings: (meetings: IcsEvent[], ignorePhrasesString: string) => IcsEvent[];

		beforeEach(async () => {
			// Dynamic import to handle the function not existing yet during TDD
			try {
				const module = await import('../meeting-filter');
				filterIgnoredMeetings = module.filterIgnoredMeetings;
			} catch {
				// Function doesn't exist yet - tests will fail as expected in TDD
				filterIgnoredMeetings = () => [];
			}
		});

		// Helper to create test events
		function createEvent(summary: string): IcsEvent {
			return {
				summary,
				start: new Date('2026-01-14T10:00:00Z'),
				end: new Date('2026-01-14T11:00:00Z'),
				isAllDay: false
			};
		}

		describe('when ignore phrases is empty', () => {
			it('should return all meetings when ignore string is empty', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('Project Review'),
					createEvent('Team Lunch')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, '');

				// Assert
				expect(result).toHaveLength(3);
				expect(result).toEqual(meetings);
			});

			it('should return all meetings when ignore string is whitespace only', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, '   ');

				// Assert
				expect(result).toHaveLength(2);
			});
		});

		describe('when filtering with single phrase', () => {
			it('should filter out meetings containing the ignore phrase', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('Blocked: Focus Time'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, 'Blocked');

				// Assert
				expect(result).toHaveLength(2);
				expect(result.map(m => m.summary)).toEqual(['Daily Standup', 'Project Review']);
			});

			it('should filter case-insensitively', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('BLOCKED: Focus Time'),
					createEvent('blocked time'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, 'blocked');

				// Assert
				expect(result).toHaveLength(2);
				expect(result.map(m => m.summary)).toEqual(['Daily Standup', 'Project Review']);
			});

			it('should match partial words in meeting summary', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('Focus Block'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, 'Block');

				// Assert
				expect(result).toHaveLength(2);
				expect(result.map(m => m.summary)).toEqual(['Daily Standup', 'Project Review']);
			});
		});

		describe('when filtering with multiple phrases', () => {
			it('should filter out meetings matching any phrase', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('Blocked: Focus Time'),
					createEvent('Personal: Dentist'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, 'Blocked, Personal');

				// Assert
				expect(result).toHaveLength(2);
				expect(result.map(m => m.summary)).toEqual(['Daily Standup', 'Project Review']);
			});

			it('should handle extra whitespace around phrases', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('Blocked Time'),
					createEvent('Personal Errand'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, '  Blocked  ,  Personal  ');

				// Assert
				expect(result).toHaveLength(2);
				expect(result.map(m => m.summary)).toEqual(['Daily Standup', 'Project Review']);
			});

			it('should skip empty phrases in comma-separated list', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('Blocked Time'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, 'Blocked,,, ');

				// Assert
				expect(result).toHaveLength(2);
				expect(result.map(m => m.summary)).toEqual(['Daily Standup', 'Project Review']);
			});
		});

		describe('when handling edge cases', () => {
			it('should return empty array when all meetings are filtered', () => {
				// Arrange
				const meetings = [
					createEvent('Blocked: Focus'),
					createEvent('Blocked: Writing')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, 'Blocked');

				// Assert
				expect(result).toHaveLength(0);
			});

			it('should handle empty meetings array', () => {
				// Arrange
				const meetings: IcsEvent[] = [];

				// Act
				const result = filterIgnoredMeetings(meetings, 'Blocked');

				// Assert
				expect(result).toHaveLength(0);
			});

			it('should handle meetings with empty summary', () => {
				// Arrange
				const meetings = [
					createEvent(''),
					createEvent('Daily Standup')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, 'Blocked');

				// Assert
				expect(result).toHaveLength(2);
			});

			it('should filter meetings with special regex characters in phrase', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('[Personal] Dentist'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, '[Personal]');

				// Assert
				expect(result).toHaveLength(2);
				expect(result.map(m => m.summary)).toEqual(['Daily Standup', 'Project Review']);
			});

			it('should handle phrases with parentheses', () => {
				// Arrange
				const meetings = [
					createEvent('Daily Standup'),
					createEvent('(Blocked) Focus Time'),
					createEvent('Project Review')
				];

				// Act
				const result = filterIgnoredMeetings(meetings, '(Blocked)');

				// Assert
				expect(result).toHaveLength(2);
				expect(result.map(m => m.summary)).toEqual(['Daily Standup', 'Project Review']);
			});
		});

		describe('when preserving event properties', () => {
			it('should preserve all event properties in filtered results', () => {
				// Arrange
				const meetings: IcsEvent[] = [
					{
						summary: 'All Day Event',
						start: new Date('2026-01-14T00:00:00Z'),
						end: new Date('2026-01-15T00:00:00Z'),
						isAllDay: true
					},
					{
						summary: 'Blocked Time',
						start: new Date('2026-01-14T10:00:00Z'),
						end: new Date('2026-01-14T11:00:00Z'),
						isAllDay: false
					}
				];

				// Act
				const result = filterIgnoredMeetings(meetings, 'Blocked');

				// Assert
				expect(result).toHaveLength(1);
				expect(result[0]).toEqual({
					summary: 'All Day Event',
					start: new Date('2026-01-14T00:00:00Z'),
					end: new Date('2026-01-15T00:00:00Z'),
					isAllDay: true
				});
			});
		});
	});
});
