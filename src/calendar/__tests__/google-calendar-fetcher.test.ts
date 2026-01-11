import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchGoogleCalendar, GoogleCalendarFetchError, FetchCalendarResult } from '../google-calendar-fetcher';
import { mockRequestUrl, resetRequestUrlMock, RequestUrlResponse } from 'obsidian';

/**
 * Test suite for Google Calendar fetcher
 * Following TDD approach - these tests are written FIRST and will fail until implementation is complete
 */
describe('Google Calendar Fetcher', () => {
	beforeEach(() => {
		// Reset mock before each test
		resetRequestUrlMock();
	});

	afterEach(() => {
		// Clean up after each test
		resetRequestUrlMock();
	});

	describe('fetchGoogleCalendar', () => {
		const validGoogleCalendarUrl = 'https://calendar.google.com/calendar/ical/test@gmail.com/private-abc123/basic.ics';
		const validICalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART:20260111T100000Z
DTEND:20260111T110000Z
SUMMARY:Test Meeting
END:VEVENT
END:VCALENDAR`;

		describe('when fetching valid Google Calendar', () => {
			it('should fetch and return iCal content from valid URL', async () => {
				// Arrange
				mockRequestUrl(async (request) => {
					const url = typeof request === 'string' ? request : request.url;
					expect(url).toBe(validGoogleCalendarUrl);

					return {
						status: 200,
						headers: { 'content-type': 'text/calendar' },
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: validICalContent
					} as RequestUrlResponse;
				});

				// Act
				const result: FetchCalendarResult = await fetchGoogleCalendar(validGoogleCalendarUrl);

				// Assert
				expect(result.success).toBe(true);
				expect(result.content).toBe(validICalContent);
				expect(result.content).toContain('BEGIN:VCALENDAR');
				expect(result.content).toContain('Test Meeting');
			});

			it('should handle public Google Calendar URLs', async () => {
				// Arrange
				const publicUrl = 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics';

				mockRequestUrl(async () => ({
					status: 200,
					headers: { 'content-type': 'text/calendar' },
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: validICalContent
				} as RequestUrlResponse));

				// Act
				const result = await fetchGoogleCalendar(publicUrl);

				// Assert
				expect(result.success).toBe(true);
				expect(result.content).toBeDefined();
			});

			it('should return raw iCal content as string', async () => {
				// Arrange
				mockRequestUrl(async () => ({
					status: 200,
					headers: {},
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: validICalContent
				} as RequestUrlResponse));

				// Act
				const result = await fetchGoogleCalendar(validGoogleCalendarUrl);

				// Assert
				expect(typeof result.content).toBe('string');
				expect(result.content.length).toBeGreaterThan(0);
			});
		});

		describe('when handling URL validation errors', () => {
			it('should throw INVALID_URL error when URL is empty', async () => {
				// Arrange
				const emptyUrl = '';

				// Act & Assert
				try {
					await fetchGoogleCalendar(emptyUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_URL');
					expect((error as GoogleCalendarFetchError).message).toContain('URL');
				}
			});

			it('should throw INVALID_URL error when URL is whitespace only', async () => {
				// Arrange
				const whitespaceUrl = '   ';

				// Act & Assert
				try {
					await fetchGoogleCalendar(whitespaceUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_URL');
				}
			});

			it('should throw INVALID_URL error when URL is not a Google Calendar URL', async () => {
				// Arrange
				const invalidUrl = 'https://example.com/calendar.ics';

				// Act & Assert
				try {
					await fetchGoogleCalendar(invalidUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_URL');
					expect((error as GoogleCalendarFetchError).message).toContain('Google Calendar');
				}
			});

			it('should throw INVALID_URL error when URL does not end with .ics', async () => {
				// Arrange
				const invalidUrl = 'https://calendar.google.com/calendar/test';

				// Act & Assert
				try {
					await fetchGoogleCalendar(invalidUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_URL');
					expect((error as GoogleCalendarFetchError).message).toContain('.ics');
				}
			});
		});

		describe('when handling HTTP errors', () => {
			it('should throw NOT_FOUND error when calendar returns 404', async () => {
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
					await fetchGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('NOT_FOUND');
					expect((error as GoogleCalendarFetchError).message).toContain('not found');
				}
			});

			it('should throw FORBIDDEN error when calendar returns 403', async () => {
				// Arrange
				mockRequestUrl(async () => {
					throw Object.assign(new Error('HTTP 403'), {
						status: 403,
						headers: {},
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: 'Forbidden'
					});
				});

				// Act & Assert
				try {
					await fetchGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('FORBIDDEN');
					expect((error as GoogleCalendarFetchError).message).toContain('accessible');
				}
			});

			it('should throw SERVER_ERROR when calendar returns 500', async () => {
				// Arrange
				mockRequestUrl(async () => {
					throw Object.assign(new Error('HTTP 500'), {
						status: 500,
						headers: {},
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: 'Internal Server Error'
					});
				});

				// Act & Assert
				try {
					await fetchGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('SERVER_ERROR');
					expect((error as GoogleCalendarFetchError).message).toContain('server error');
				}
			});

			it('should throw NETWORK_ERROR when network request fails', async () => {
				// Arrange
				mockRequestUrl(async () => {
					throw new Error('Network connection failed');
				});

				// Act & Assert
				try {
					await fetchGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('NETWORK_ERROR');
				}
			});
		});

		describe('when handling response validation', () => {
			it('should throw INVALID_RESPONSE error when response body is empty', async () => {
				// Arrange
				mockRequestUrl(async () => ({
					status: 200,
					headers: {},
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: ''
				} as RequestUrlResponse));

				// Act & Assert
				try {
					await fetchGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_RESPONSE');
					expect((error as GoogleCalendarFetchError).message).toContain('empty');
				}
			});

			it('should throw INVALID_RESPONSE error when response is not valid iCal', async () => {
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
					await fetchGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_RESPONSE');
					expect((error as GoogleCalendarFetchError).message).toContain('valid iCal');
				}
			});

			it('should throw INVALID_RESPONSE error when response does not contain VCALENDAR', async () => {
				// Arrange
				mockRequestUrl(async () => ({
					status: 200,
					headers: {},
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: 'Some text without calendar data'
				} as RequestUrlResponse));

				// Act & Assert
				try {
					await fetchGoogleCalendar(validGoogleCalendarUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_RESPONSE');
				}
			});
		});

		describe('GoogleCalendarFetchError', () => {
			it('should be an instance of Error', () => {
				// Arrange & Act
				const error = new GoogleCalendarFetchError('Test error', 'TEST_CODE');

				// Assert
				expect(error).toBeInstanceOf(Error);
				expect(error.name).toBe('GoogleCalendarFetchError');
				expect(error.message).toBe('Test error');
				expect(error.code).toBe('TEST_CODE');
			});

			it('should have a code property', () => {
				// Arrange & Act
				const error = new GoogleCalendarFetchError('Test', 'CODE');

				// Assert
				expect(error).toHaveProperty('code');
				expect(error.code).toBe('CODE');
			});
		});

		describe('FetchCalendarResult interface', () => {
			it('should have success and content properties', async () => {
				// Arrange
				mockRequestUrl(async () => ({
					status: 200,
					headers: {},
					arrayBuffer: new ArrayBuffer(0),
					json: {},
					text: validICalContent
				} as RequestUrlResponse));

				// Act
				const result: FetchCalendarResult = await fetchGoogleCalendar(validGoogleCalendarUrl);

				// Assert
				expect(result).toHaveProperty('success');
				expect(result).toHaveProperty('content');
				expect(typeof result.success).toBe('boolean');
				expect(typeof result.content).toBe('string');
			});
		});
	});
});
