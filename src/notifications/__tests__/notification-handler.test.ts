/**
 * Tests for Notification Handler
 * Tests user notifications for sync results and errors
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncResult } from '../../sync/sync-orchestrator';

// Mock Notice from obsidian
vi.mock('obsidian', () => ({
	Notice: vi.fn()
}));

// Import after mocking
import { showSyncNotification } from '../notification-handler';
import { Notice } from 'obsidian';

// Helper to create a mock TFile
function mockTFile(path: string): any {
	return {
		path,
		name: path.split('/').pop() || '',
		basename: (path.split('/').pop() || '').split('.')[0] || '',
		extension: (path.split('/').pop() || '').split('.').pop() || ''
	};
}

describe('Notification Handler', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('showSyncNotification - Success scenarios', () => {
		it('should show success message when both sources sync successfully', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: true, success: true, meetingsAdded: 3 },
				googleCalendar: { enabled: true, success: true, meetingsAdded: 2 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('5 meetings'),
				4000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('Synced'),
				4000
			);
		});

		it('should show success message for local calendar only', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: true, success: true, meetingsAdded: 4 },
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('4 meetings'),
				4000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('local calendar'),
				4000
			);
		});

		it('should show success message for Google Calendar only', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: false, success: false, meetingsAdded: 0 },
				googleCalendar: { enabled: true, success: true, meetingsAdded: 6 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('6 meetings'),
				4000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('Google Calendar'),
				4000
			);
		});

		it('should use singular "meeting" for one meeting', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: true, success: true, meetingsAdded: 1 },
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('1 meeting'),
				4000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.not.stringContaining('meetings'),
				4000
			);
		});
	});

	describe('showSyncNotification - No meetings', () => {
		it('should show message when no meetings found', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: true, success: true, meetingsAdded: 0 },
				googleCalendar: { enabled: true, success: true, meetingsAdded: 0 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('No meetings'),
				4000
			);
		});
	});

	describe('showSyncNotification - Partial success', () => {
		it('should show partial success when local succeeds and Google fails', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: true, success: true, meetingsAdded: 3 },
				googleCalendar: {
					enabled: true,
					success: false,
					meetingsAdded: 0,
					error: 'Network error'
				}
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('3 meetings'),
				6000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('local calendar'),
				6000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('Google Calendar failed'),
				6000
			);
		});

		it('should show partial success when Google succeeds and local fails', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: {
					enabled: true,
					success: false,
					meetingsAdded: 0,
					error: 'File not found'
				},
				googleCalendar: { enabled: true, success: true, meetingsAdded: 2 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('2 meetings'),
				6000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('Google Calendar'),
				6000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('Local calendar failed'),
				6000
			);
		});
	});

	describe('showSyncNotification - Complete failure', () => {
		it('should show error when both sources fail', () => {
			// Arrange
			const result: SyncResult = {
				success: false,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: {
					enabled: true,
					success: false,
					meetingsAdded: 0,
					error: 'File not found'
				},
				googleCalendar: {
					enabled: true,
					success: false,
					meetingsAdded: 0,
					error: 'Network error'
				}
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('failed'),
				8000
			);
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('Both'),
				8000
			);
		});

		it('should show error when only source fails', () => {
			// Arrange
			const result: SyncResult = {
				success: false,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: {
					enabled: true,
					success: false,
					meetingsAdded: 0,
					error: 'Permission denied'
				},
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('failed'),
				8000
			);
		});
	});

	describe('showSyncNotification - Message clarity', () => {
		it('should include check console hint in failure messages', () => {
			// Arrange
			const result: SyncResult = {
				success: false,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: {
					enabled: true,
					success: false,
					meetingsAdded: 0,
					error: 'Error'
				},
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('console'),
				8000
			);
		});

		it('should not include technical details in success messages', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: true, success: true, meetingsAdded: 2 },
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			const message = Notice.mock.calls[0][0];
			expect(message).not.toContain('TFile');
			expect(message).not.toContain('enabled');
			expect(message).not.toContain('error');
		});
	});

	describe('showSyncNotification - Timeout durations', () => {
		it('should use 4000ms for success messages', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: true, success: true, meetingsAdded: 3 },
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(expect.any(String), 4000);
		});

		it('should use 6000ms for partial success messages', () => {
			// Arrange
			const result: SyncResult = {
				success: true,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: { enabled: true, success: true, meetingsAdded: 2 },
				googleCalendar: {
					enabled: true,
					success: false,
					meetingsAdded: 0,
					error: 'Error'
				}
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(expect.any(String), 6000);
		});

		it('should use 8000ms for failure messages', () => {
			// Arrange
			const result: SyncResult = {
				success: false,
				dailyNote: mockTFile('2024-01-15.md'),
				localCalendar: {
					enabled: true,
					success: false,
					meetingsAdded: 0,
					error: 'Error'
				},
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			};

			// Act
			showSyncNotification(result);

			// Assert
			expect(Notice).toHaveBeenCalledWith(expect.any(String), 8000);
		});
	});
});
