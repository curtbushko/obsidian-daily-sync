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

		describe('when handling Google Calendar sharable URLs', () => {
			it('should accept and convert embed URL format', async () => {
				// Arrange
				const embedUrl = 'https://calendar.google.com/calendar/embed?src=test@gmail.com';

				mockRequestUrl(async (request) => {
					const url = typeof request === 'string' ? request : request.url;
					// Should convert to iCal format
					expect(url).toContain('/ical/');
					expect(url).toContain('test%40gmail.com'); // URL encoded @
					expect(url).toMatch(/\.ics$/);
					expect(url).toContain('/public/basic.ics');

					return {
						status: 200,
						headers: { 'content-type': 'text/calendar' },
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: validICalContent
					} as RequestUrlResponse;
				});

				// Act
				const result = await fetchGoogleCalendar(embedUrl);

				// Assert
				expect(result.success).toBe(true);
				expect(result.content).toBe(validICalContent);
			});

			it('should accept embed URL with encoded calendar ID', async () => {
				// Arrange
				const embedUrl = 'https://calendar.google.com/calendar/embed?src=en.usa%23holiday%40group.v.calendar.google.com';

				mockRequestUrl(async (request) => {
					const url = typeof request === 'string' ? request : request.url;
					expect(url).toMatch(/\.ics$/);

					return {
						status: 200,
						headers: { 'content-type': 'text/calendar' },
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: validICalContent
					} as RequestUrlResponse;
				});

				// Act
				const result = await fetchGoogleCalendar(embedUrl);

				// Assert
				expect(result.success).toBe(true);
			});

			it('should accept URL with cid parameter (base64 encoded)', async () => {
				// Arrange
				// cid parameter is base64 encoded calendar ID
				// 'dGVzdEBnbWFpbC5jb20=' is base64 for 'test@gmail.com'
				const sharableUrl = 'https://calendar.google.com/calendar/u/0?cid=dGVzdEBnbWFpbC5jb20%3D';

				mockRequestUrl(async (request) => {
					const url = typeof request === 'string' ? request : request.url;
					expect(url).toMatch(/\.ics$/);
					// Should decode the base64 and use it
					expect(url).toContain('test%40gmail.com');

					return {
						status: 200,
						headers: { 'content-type': 'text/calendar' },
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: validICalContent
					} as RequestUrlResponse;
				});

				// Act
				const result = await fetchGoogleCalendar(sharableUrl);

				// Assert
				expect(result.success).toBe(true);
			});

			it('should accept URL with additional params', async () => {
				// Arrange
				const sharableUrl = 'https://calendar.google.com/calendar/u/0?cid=dGVzdEBnbWFpbC5jb20%3D&mode=week';

				mockRequestUrl(async (request) => {
					const url = typeof request === 'string' ? request : request.url;
					expect(url).toMatch(/\.ics$/);

					return {
						status: 200,
						headers: { 'content-type': 'text/calendar' },
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: validICalContent
					} as RequestUrlResponse;
				});

				// Act
				const result = await fetchGoogleCalendar(sharableUrl);

				// Assert
				expect(result.success).toBe(true);
			});

			it('should still accept direct iCal URLs', async () => {
				// Arrange - this should continue to work as before
				const icsUrl = 'https://calendar.google.com/calendar/ical/test@gmail.com/public/basic.ics';

				mockRequestUrl(async (request) => {
					const url = typeof request === 'string' ? request : request.url;
					expect(url).toBe(icsUrl);

					return {
						status: 200,
						headers: { 'content-type': 'text/calendar' },
						arrayBuffer: new ArrayBuffer(0),
						json: {},
						text: validICalContent
					} as RequestUrlResponse;
				});

				// Act
				const result = await fetchGoogleCalendar(icsUrl);

				// Assert
				expect(result.success).toBe(true);
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

			it('should throw INVALID_URL error when URL has no calendar ID', async () => {
				// Arrange
				const invalidUrl = 'https://calendar.google.com/calendar/';

				// Act & Assert
				try {
					await fetchGoogleCalendar(invalidUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('INVALID_URL');
					expect((error as GoogleCalendarFetchError).message).toContain('calendar ID');
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

			it('should provide helpful error when embed URL points to private calendar (404)', async () => {
				// Arrange - user provides embed URL for private calendar
				const embedUrl = 'https://calendar.google.com/calendar/embed?src=private@gmail.com';

				mockRequestUrl(async () => {
					// When we try to fetch /public/basic.ics for a private calendar, we get 404
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
					await fetchGoogleCalendar(embedUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('NOT_FOUND');
					// Error message should guide user to use the iCal URL instead
					expect((error as GoogleCalendarFetchError).message).toContain('Secret address in iCal format');
					expect((error as GoogleCalendarFetchError).message).toContain('private calendar');
				}
			});

			it('should provide helpful error when embed URL gets 403', async () => {
				// Arrange - user provides embed URL that's not accessible
				const embedUrl = 'https://calendar.google.com/calendar/embed?src=restricted@gmail.com';

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
					await fetchGoogleCalendar(embedUrl);
					expect.fail('Should have thrown an error');
				} catch (error) {
					expect(error).toBeInstanceOf(GoogleCalendarFetchError);
					expect((error as GoogleCalendarFetchError).code).toBe('FORBIDDEN');
					expect((error as GoogleCalendarFetchError).message).toContain('Secret address in iCal format');
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
