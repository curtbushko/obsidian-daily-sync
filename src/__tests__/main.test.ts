/**
 * Tests for Main Plugin
 * Tests plugin initialization and command registration
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App, TFile } from '../__mocks__/obsidian';
import DailySyncPlugin from '../main';
import * as syncOrchestrator from '../sync/sync-orchestrator';
import * as notificationHandler from '../notifications/notification-handler';

// Mock obsidian-daily-notes-interface
vi.mock('obsidian-daily-notes-interface', () => import('../__mocks__/obsidian-daily-notes-interface'));

describe('DailySyncPlugin', () => {
	let app: App;
	let plugin: DailySyncPlugin;
	let manifest: any;

	beforeEach(() => {
		app = new App();
		manifest = {
			id: 'obsidian-daily-sync',
			name: 'Daily Sync',
			version: '0.1.0',
			minAppVersion: '0.15.0',
			description: 'Sync meetings to daily notes',
			author: 'Test Author',
			isDesktopOnly: false
		};
		plugin = new DailySyncPlugin(app, manifest);
	});

	describe('onload', () => {
		it('should load settings on plugin load', async () => {
			// Arrange
			const mockLoadData = vi.spyOn(plugin, 'loadData').mockResolvedValue({
				icsFilePath: '/test/calendar.ics'
			});

			// Act
			await plugin.onload();

			// Assert
			expect(mockLoadData).toHaveBeenCalled();
			expect(plugin.settings.icsFilePath).toBe('/test/calendar.ics');
		});

		it('should add settings tab on plugin load', async () => {
			// Arrange
			const addSettingTabSpy = vi.spyOn(plugin, 'addSettingTab');

			// Act
			await plugin.onload();

			// Assert
			expect(addSettingTabSpy).toHaveBeenCalled();
		});

		it('should register sync command', async () => {
			// Arrange
			const addCommandSpy = vi.spyOn(plugin, 'addCommand');

			// Act
			await plugin.onload();

			// Assert
			expect(addCommandSpy).toHaveBeenCalled();
			const commandArg = addCommandSpy.mock.calls[0][0];
			expect(commandArg.id).toBe('sync-meetings');
			expect(commandArg.name).toBe('Sync meetings to daily note');
			expect(commandArg.callback).toBeDefined();
		});

		it('should register command with correct ID', async () => {
			// Arrange
			const addCommandSpy = vi.spyOn(plugin, 'addCommand');

			// Act
			await plugin.onload();

			// Assert
			const command = addCommandSpy.mock.calls[0][0];
			expect(command.id).toBe('sync-meetings');
		});

		it('should register command with user-friendly name', async () => {
			// Arrange
			const addCommandSpy = vi.spyOn(plugin, 'addCommand');

			// Act
			await plugin.onload();

			// Assert
			const command = addCommandSpy.mock.calls[0][0];
			expect(command.name).toBe('Sync meetings to daily note');
		});
	});

	describe('sync command callback', () => {
		it('should call syncMeetingsToDaily when command executed', async () => {
			// Arrange
			const dailyNote = new TFile('2024-01-15.md');
			const mockSync = vi.spyOn(syncOrchestrator, 'syncMeetingsToDaily').mockResolvedValue({
				success: true,
				dailyNote,
				localCalendar: { enabled: true, success: true, meetingsAdded: 2 },
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			});

			let commandCallback: (() => Promise<void>) | undefined;
			vi.spyOn(plugin, 'addCommand').mockImplementation((command) => {
				commandCallback = command.callback as (() => Promise<void>);
			});

			await plugin.onload();

			// Act
			await commandCallback?.();

			// Assert
			expect(mockSync).toHaveBeenCalledWith(app, plugin.settings);
		});

		it('should handle successful sync', async () => {
			// Arrange
			const dailyNote = new TFile('2024-01-15.md');
			vi.spyOn(syncOrchestrator, 'syncMeetingsToDaily').mockResolvedValue({
				success: true,
				dailyNote,
				localCalendar: { enabled: true, success: true, meetingsAdded: 2 },
				googleCalendar: { enabled: true, success: true, meetingsAdded: 1 }
			});

			let commandCallback: (() => Promise<void>) | undefined;
			vi.spyOn(plugin, 'addCommand').mockImplementation((command) => {
				commandCallback = command.callback as (() => Promise<void>);
			});

			await plugin.onload();

			// Act & Assert - should not throw
			await expect(commandCallback?.()).resolves.not.toThrow();
		});

		it('should show notification on successful sync', async () => {
			// Arrange
			const dailyNote = new TFile('2024-01-15.md');
			const syncResult = {
				success: true,
				dailyNote,
				localCalendar: { enabled: true, success: true, meetingsAdded: 2 },
				googleCalendar: { enabled: false, success: false, meetingsAdded: 0 }
			};

			vi.spyOn(syncOrchestrator, 'syncMeetingsToDaily').mockResolvedValue(syncResult);
			const notificationSpy = vi.spyOn(notificationHandler, 'showSyncNotification');

			let commandCallback: (() => Promise<void>) | undefined;
			vi.spyOn(plugin, 'addCommand').mockImplementation((command) => {
				commandCallback = command.callback as (() => Promise<void>);
			});

			await plugin.onload();

			// Act
			await commandCallback?.();

			// Assert
			expect(notificationSpy).toHaveBeenCalledWith(syncResult);
		});

		it('should handle sync failure gracefully', async () => {
			// Arrange
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			vi.spyOn(syncOrchestrator, 'syncMeetingsToDaily').mockRejectedValue(
				new Error('No sources configured')
			);

			let commandCallback: (() => Promise<void>) | undefined;
			vi.spyOn(plugin, 'addCommand').mockImplementation((command) => {
				commandCallback = command.callback as (() => Promise<void>);
			});

			await plugin.onload();

			// Act
			await commandCallback?.();

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalled();
			consoleErrorSpy.mockRestore();
		});
	});

	describe('settings', () => {
		it('should load default settings when no data exists', async () => {
			// Arrange
			vi.spyOn(plugin, 'loadData').mockResolvedValue(null);

			// Act
			await plugin.loadSettings();

			// Assert
			expect(plugin.settings.icsFilePath).toBe('');
			expect(plugin.settings.localCalendarSection).toBe('Meetings');
			expect(plugin.settings.googleCalendarLink).toBe('');
			expect(plugin.settings.googleCalendarSection).toBe('Meetings');
		});

		it('should merge saved settings with defaults', async () => {
			// Arrange
			vi.spyOn(plugin, 'loadData').mockResolvedValue({
				icsFilePath: '/custom/path.ics',
				googleCalendarLink: 'https://custom.link'
			});

			// Act
			await plugin.loadSettings();

			// Assert
			expect(plugin.settings.icsFilePath).toBe('/custom/path.ics');
			expect(plugin.settings.googleCalendarLink).toBe('https://custom.link');
			// Should still have defaults for missing values
			expect(plugin.settings.localCalendarSection).toBe('Meetings');
		});

		it('should save settings', async () => {
			// Arrange
			const saveDataSpy = vi.spyOn(plugin, 'saveData').mockResolvedValue();
			plugin.settings = {
				icsFilePath: '/test/calendar.ics',
				localCalendarSection: 'Work',
				googleCalendarLink: 'https://example.com',
				googleCalendarSection: 'Personal'
			};

			// Act
			await plugin.saveSettings();

			// Assert
			expect(saveDataSpy).toHaveBeenCalledWith(plugin.settings);
		});
	});
});
