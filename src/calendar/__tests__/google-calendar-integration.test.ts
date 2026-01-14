import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchAndParseGoogleCalendar, parseIcsContent, IcsParseResult, IcsParseError } from '../ics-parser';
import { GoogleCalendarFetchError } from '../google-calendar-fetcher';
import { mockRequestUrl, resetRequestUrlMock, RequestUrlResponse } from 'obsidian';

/**
 * Test suite for Google Calendar integration (fetch + parse)
 * Following TDD approach - these tests are written FIRST and will fail until implementation is complete
 */
describe('Google Calendar Integration', () => {
	const validGoogleCalendarUrl = 'https://calendar.google.com/calendar/ical/test@gmail.com/private-abc123/basic.ics';
	const validICalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
X-WR-CALNAME:Test Calendar
X-WR-TIMEZONE:America/New_York
BEGIN:VEVENT
DTSTART:20260111T100000Z
DTEND:20260111T110000Z
DTSTAMP:20260111T080000Z
UID:event-001@google.com
SUMMARY:Daily Standup
DESCRIPTION:Team standup meeting
END:VEVENT
BEGIN:VEVENT
DTSTART:20260111T140000Z
DTEND:20260111T150000Z
DTSTAMP:20260111T080000Z
UID:event-002@google.com
SUMMARY:Planning Meeting
DESCRIPTION:Sprint planning
END:VEVENT
END:VCALENDAR`;

	beforeEach(() => {
		resetRequestUrlMock();
	});

	afterEach(() => {
		resetRequestUrlMock();
	});

	describe('parseIcsContent', () => {
		describe('when parsing valid iCal content', () => {
			it('should parse valid iCal content and return events', () => {
				// Arrange & Act
				const result: IcsParseResult = parseIcsContent(validICalContent);

				// Assert
				expect(result.events).toBeDefined();
				expect(result.events).toHaveLength(2);
				expect(result.errors).toBeUndefined();
			});

			it('should extract event details correctly', () => {
				// Arrange & Act
				const result = parseIcsContent(validICalContent);

				// Assert
				expect(result.events[0].summary).toBe('Daily Standup');
				expect(result.events[0].start).toBeInstanceOf(Date);
				expect(result.events[0].end).toBeInstanceOf(Date);
				expect(result.events[0].isAllDay).toBe(false);

				expect(result.events[1].summary).toBe('Planning Meeting');
				expect(result.events[1].start).toBeInstanceOf(Date);
				expect(result.events[1].end).toBeInstanceOf(Date);
			});

			it('should handle empty calendar with no events', () => {
				// Arrange
				const emptyCalendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
END:VCALENDAR`;

				// Act
				const result = parseIcsContent(emptyCalendar);

				// Assert
				expect(result.events).toHaveLength(0);
			});

			it('should handle all-day events', () => {
				// Arrange
				const allDayContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260111
DTEND;VALUE=DATE:20260112
SUMMARY:Holiday
UID:holiday@test.com
END:VEVENT
END:VCALENDAR`;

				// Act
				const result = parseIcsContent(allDayContent);

				// Assert
				expect(result.events).toHaveLength(1);
				expect(result.events[0].isAllDay).toBe(true);
				expect(result.events[0].summary).toBe('Holiday');
			});

			it('should handle RRULE with UNTIL in non-UTC format', () => {
				// Arrange - Google Calendar sometimes sends UNTIL without Z suffix
				const recurringContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART:20260111T100000Z
DTEND:20260111T110000Z
RRULE:FREQ=WEEKLY;UNTIL=20261231T235959
SUMMARY:Weekly Meeting
UID:recurring@test.com
END:VEVENT
END:VCALENDAR`;

				// Act
				const result = parseIcsContent(recurringContent);

				// Assert - recurring events are now expanded
				expect(result.events.length).toBeGreaterThan(1);
				expect(result.events.every(e => e.summary === 'Weekly Meeting')).toBe(true);
			});

			it('should handle RRULE with UNTIL in UTC format', () => {
				// Arrange - Properly formatted UNTIL with Z suffix
				const recurringContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART:20260111T100000Z
DTEND:20260111T110000Z
RRULE:FREQ=DAILY;UNTIL=20261231T235959Z
SUMMARY:Daily Standup
UID:recurring-utc@test.com
END:VEVENT
END:VCALENDAR`;

				// Act
				const result = parseIcsContent(recurringContent);

				// Assert - recurring events are now expanded (daily for ~1 year = ~355 events)
				expect(result.events.length).toBeGreaterThan(100);
				expect(result.events.every(e => e.summary === 'Daily Standup')).toBe(true);
			});

			it('should handle RRULE with UNTIL at end of RRULE line', () => {
				// Arrange - UNTIL is last parameter
				const recurringContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART:20260111T100000Z
DTEND:20260111T110000Z
RRULE:FREQ=MONTHLY;INTERVAL=2;UNTIL=20270630T235959
SUMMARY:Bi-monthly Review
UID:recurring-end@test.com
END:VEVENT
END:VCALENDAR`;

				// Act
				const result = parseIcsContent(recurringContent);

				// Assert - recurring events are now expanded (bi-monthly for ~18 months = ~9 events)
				expect(result.events.length).toBeGreaterThan(1);
				expect(result.events.every(e => e.summary === 'Bi-monthly Review')).toBe(true);
			});

			it('should handle RRULE with UNTIL followed by COUNT', () => {
				// Arrange - UNTIL in middle of parameters
				const recurringContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART:20260111T100000Z
DTEND:20260111T110000Z
RRULE:FREQ=WEEKLY;UNTIL=20261231T120000;BYDAY=MO,WE,FR
SUMMARY:Workout Sessions
UID:recurring-middle@test.com
END:VEVENT
END:VCALENDAR`;

				// Act
				const result = parseIcsContent(recurringContent);

				// Assert - recurring events are now expanded (3x per week for ~1 year)
				expect(result.events.length).toBeGreaterThan(50);
				expect(result.events.every(e => e.summary === 'Workout Sessions')).toBe(true);
			});

			it('should handle RRULE with UNTIL using DATE format (no time)', () => {
				// Arrange - UNTIL with just date, no time component
				const recurringContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260111
DTEND;VALUE=DATE:20260112
RRULE:FREQ=YEARLY;UNTIL=20301231
SUMMARY:Annual Holiday
UID:recurring-date@test.com
END:VEVENT
END:VCALENDAR`;

				// Act
				const result = parseIcsContent(recurringContent);

				// Assert - recurring events are now expanded (yearly, within our 2-year range = ~2 events)
				expect(result.events.length).toBeGreaterThanOrEqual(1);
				expect(result.events.every(e => e.summary === 'Annual Holiday')).toBe(true);
			});
		});

		describe('when handling invalid content', () => {
			it('should throw INVALID_FORMAT error when content is not iCal', () => {
				// Arrange
				const invalidContent = 'This is not an iCal file';

				// Act & Assert
				try {
					parseIcsContent(invalidContent);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(IcsParseError);
					expect((error as IcsParseError).code).toBe('INVALID_FORMAT');
				}
			});

			it('should throw INVALID_FORMAT error when content is empty', () => {
				// Arrange
				const emptyContent = '';

				// Act & Assert
				try {
					parseIcsContent(emptyContent);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(IcsParseError);
					expect((error as IcsParseError).code).toBe('INVALID_FORMAT');
				}
			});

			it('should throw INVALID_FORMAT error when content does not contain VCALENDAR', () => {
				// Arrange
				const invalidContent = 'Some random text without calendar data';

				// Act & Assert
				try {
					parseIcsContent(invalidContent);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(IcsParseError);
					expect((error as IcsParseError).code).toBe('INVALID_FORMAT');
				}
			});
		});
	});

	describe('fetchAndParseGoogleCalendar', () => {
		describe('when fetching and parsing successfully', () => {
			it('should fetch and parse Google Calendar events', async () => {
				// Arrange
				mockRequestUrl(async () => ({
					status: 200,
					headers: { 'content-type': 'text/calendar' },
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: validICalContent
				} as RequestUrlResponse));

				// Act
				const result: IcsParseResult = await fetchAndParseGoogleCalendar(validGoogleCalendarUrl);

				// Assert
				expect(result.events).toBeDefined();
				expect(result.events).toHaveLength(2);
				expect(result.events[0].summary).toBe('Daily Standup');
				expect(result.events[1].summary).toBe('Planning Meeting');
			});

			it('should return empty events array when calendar has no events', async () => {
				// Arrange
				const emptyCalendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
END:VCALENDAR`;

				mockRequestUrl(async () => ({
					status: 200,
					headers: {},
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: emptyCalendar
				} as RequestUrlResponse));

				// Act
				const result = await fetchAndParseGoogleCalendar(validGoogleCalendarUrl);

				// Assert
				expect(result.events).toHaveLength(0);
			});

			it('should preserve event details through fetch and parse', async () => {
				// Arrange
				mockRequestUrl(async () => ({
					status: 200,
					headers: {},
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: validICalContent
				} as RequestUrlResponse));

				// Act
				const result = await fetchAndParseGoogleCalendar(validGoogleCalendarUrl);

				// Assert
				const firstEvent = result.events[0];
				expect(firstEvent.summary).toBe('Daily Standup');
				expect(firstEvent.start).toBeInstanceOf(Date);
				expect(firstEvent.end).toBeInstanceOf(Date);
				expect(firstEvent.isAllDay).toBe(false);
			});
		});

		describe('when handling fetch errors', () => {
			it('should throw GoogleCalendarFetchError when URL is invalid', async () => {
				// Arrange
				const invalidUrl = 'https://example.com/calendar.ics';

				// Act & Assert
				try {
					await fetchAndParseGoogleCalendar(invalidUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_URL');
				}
			});

			it('should throw GoogleCalendarFetchError when calendar not found', async () => {
				// Arrange
				mockRequestUrl(async () => {
					throw Object.assign(new Error('HTTP 404'), {
						status: 404,
						headers: {},
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: 'Not Found'
					});
				});

				// Act & Assert
				try {
					await fetchAndParseGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('NOT_FOUND');
				}
			});

			it('should throw GoogleCalendarFetchError when network fails', async () => {
				// Arrange
				mockRequestUrl(async () => {
					throw new Error('Network connection failed');
				});

				// Act & Assert
				try {
					await fetchAndParseGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('NETWORK_ERROR');
				}
			});
		});

		describe('when handling parse errors', () => {
			it('should throw IcsParseError when response is not valid iCal', async () => {
				// Arrange
				mockRequestUrl(async () => ({
					status: 200,
					headers: {},
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: 'This is not an iCal file'
				} as RequestUrlResponse));

				// Act & Assert
				try {
					await fetchAndParseGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					// Should be caught by fetcher's validation first
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_RESPONSE');
				}
			});
		});
	});
});
