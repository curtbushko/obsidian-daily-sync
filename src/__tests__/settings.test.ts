/**
 * Tests for Settings Tab
 * Tests settings UI including file browser functionality
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { App, Setting, ButtonComponent, TextComponent } from '../__mocks__/obsidian';
import { DailySyncSettingTab, DEFAULT_SETTINGS, setElectronForTesting, resetElectronForTesting } from '../settings';
import DailySyncPlugin from '../main';

// Mock obsidian-daily-notes-interface
vi.mock('obsidian-daily-notes-interface', () => import('../__mocks__/obsidian-daily-notes-interface'));

// Mock electron module for testing
const mockGetPathForFile = vi.fn();

describe('DailySyncSettingTab', () => {
	let app: App;
	let plugin: DailySyncPlugin;
	let settingTab: DailySyncSettingTab;
	let manifest: any;

	beforeEach(() => {
		app = new App();
		manifest = {
			id: 'obsidian-daily-sync',
			name: 'Daily Sync',
			version: '1.0.0',
			minAppVersion: '0.15.0',
			description: 'Sync meetings to daily notes',
			author: 'Test Author',
			isDesktopOnly: false
		};
		plugin = new DailySyncPlugin(app, manifest);
		plugin.settings = { ...DEFAULT_SETTINGS };
		settingTab = new DailySyncSettingTab(app, plugin);

		// Set up mock Electron module for file path resolution
		setElectronForTesting({
			webUtils: {
				getPathForFile: mockGetPathForFile
			}
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		mockGetPathForFile.mockReset();
		resetElectronForTesting();
	});

	describe('display', () => {
		it('should render settings container', () => {
			// Act
			settingTab.display();

			// Assert
			expect(settingTab.containerEl).toBeDefined();
		});

		it('should display local calendar settings section', () => {
			// Arrange
			const settingSpy = vi.spyOn(Setting.prototype, 'setName');

			// Act
			settingTab.display();

			// Assert
			expect(settingSpy).toHaveBeenCalledWith('Local calendar');
		});

		it('should display Google calendar settings section', () => {
			// Arrange
			const settingSpy = vi.spyOn(Setting.prototype, 'setName');

			// Act
			settingTab.display();

			// Assert
			expect(settingSpy).toHaveBeenCalledWith('Google calendar');
		});
	});

	describe('file browser button', () => {
		it('should add a browse button next to ICS file path field', () => {
			// Arrange
			const addButtonSpy = vi.spyOn(Setting.prototype, 'addButton');

			// Act
			settingTab.display();

			// Assert
			expect(addButtonSpy).toHaveBeenCalled();
		});

		it('should set browse button text to "Browse"', () => {
			// Arrange
			const buttonTextSpy = vi.spyOn(ButtonComponent.prototype, 'setButtonText');

			// Act
			settingTab.display();

			// Assert
			expect(buttonTextSpy).toHaveBeenCalledWith('Browse');
		});

		it('should set browse button tooltip', () => {
			// Arrange
			const tooltipSpy = vi.spyOn(ButtonComponent.prototype, 'setTooltip');

			// Act
			settingTab.display();

			// Assert
			expect(tooltipSpy).toHaveBeenCalledWith('Browse for .ics file');
		});

		it('should create file input element for file selection', () => {
			// Act
			settingTab.display();

			// Assert
			const fileInput = settingTab.containerEl.querySelector('input[type="file"]');
			expect(fileInput).toBeDefined();
		});

		it('should filter file input to accept only .ics files', () => {
			// Act
			settingTab.display();

			// Assert
			const fileInput = settingTab.containerEl.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput?.accept).toBe('.ics');
		});

		it('should hide the file input element', () => {
			// Act
			settingTab.display();

			// Assert
			const fileInput = settingTab.containerEl.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput?.classList.contains('daily-sync-file-input-hidden')).toBe(true);
		});

		it('should trigger file input click when browse button is clicked', () => {
			// Arrange
			settingTab.display();
			const fileInput = settingTab.containerEl.querySelector('input[type="file"]') as HTMLInputElement;
			const clickSpy = vi.spyOn(fileInput, 'click');

			// Find and click the browse button
			const browseButton = settingTab.containerEl.querySelector('button');

			// Act
			browseButton?.click();

			// Assert
			expect(clickSpy).toHaveBeenCalled();
		});

		it('should update ICS file path when file is selected', async () => {
			// Arrange
			const saveSettingsSpy = vi.spyOn(plugin, 'saveSettings').mockResolvedValue();
			settingTab.display();

			const fileInput = settingTab.containerEl.querySelector('input[type="file"]') as HTMLInputElement;

			// Create a mock file
			const mockFile = new File(['calendar content'], 'work.ics', { type: 'text/calendar' });

			// Mock Electron's getPathForFile to return full path
			mockGetPathForFile.mockReturnValue('/Users/test/calendars/work.ics');

			// Mock the files property
			Object.defineProperty(fileInput, 'files', {
				value: [mockFile],
				writable: false
			});

			// Act
			fileInput.dispatchEvent(new Event('change'));

			// Allow async operations to complete
			await new Promise(resolve => setTimeout(resolve, 0));

			// Assert
			expect(mockGetPathForFile).toHaveBeenCalledWith(mockFile);
			expect(plugin.settings.icsFilePath).toBe('/Users/test/calendars/work.ics');
			expect(saveSettingsSpy).toHaveBeenCalled();
		});

		it('should not update path when file selection is cancelled', async () => {
			// Arrange
			const originalPath = '/original/path.ics';
			plugin.settings.icsFilePath = originalPath;
			const saveSettingsSpy = vi.spyOn(plugin, 'saveSettings').mockResolvedValue();
			settingTab.display();

			const fileInput = settingTab.containerEl.querySelector('input[type="file"]') as HTMLInputElement;

			// Mock empty files (cancelled selection)
			Object.defineProperty(fileInput, 'files', {
				value: [],
				writable: false
			});

			// Act
			fileInput.dispatchEvent(new Event('change'));

			// Allow async operations to complete
			await new Promise(resolve => setTimeout(resolve, 0));

			// Assert
			expect(plugin.settings.icsFilePath).toBe(originalPath);
			expect(saveSettingsSpy).not.toHaveBeenCalled();
		});

		it('should fall back to file name when Electron is not available', async () => {
			// Arrange
			const saveSettingsSpy = vi.spyOn(plugin, 'saveSettings').mockResolvedValue();

			// Simulate mobile/web environment where Electron is not available
			setElectronForTesting(null);

			settingTab.display();

			const fileInput = settingTab.containerEl.querySelector('input[type="file"]') as HTMLInputElement;

			// Create a mock file
			const mockFile = new File(['calendar content'], 'work.ics', { type: 'text/calendar' });

			// Mock the files property
			Object.defineProperty(fileInput, 'files', {
				value: [mockFile],
				writable: false
			});

			// Act
			fileInput.dispatchEvent(new Event('change'));

			// Allow async operations to complete
			await new Promise(resolve => setTimeout(resolve, 0));

			// Assert - should fall back to filename
			expect(plugin.settings.icsFilePath).toBe('work.ics');
			expect(saveSettingsSpy).toHaveBeenCalled();
		});

		it('should reject non-.ics files', async () => {
			// Arrange
			const originalPath = '';
			plugin.settings.icsFilePath = originalPath;
			const saveSettingsSpy = vi.spyOn(plugin, 'saveSettings').mockResolvedValue();
			settingTab.display();

			const fileInput = settingTab.containerEl.querySelector('input[type="file"]') as HTMLInputElement;

			// Create a mock file with wrong extension
			const mockFile = new File(['not a calendar'], 'document.txt', { type: 'text/plain' });

			// Mock Electron's getPathForFile - shouldn't be called for invalid file type
			mockGetPathForFile.mockReturnValue('/Users/test/document.txt');

			// Mock the files property
			Object.defineProperty(fileInput, 'files', {
				value: [mockFile],
				writable: false
			});

			// Act
			fileInput.dispatchEvent(new Event('change'));

			// Allow async operations to complete
			await new Promise(resolve => setTimeout(resolve, 0));

			// Assert - should not update path for non-.ics files
			expect(plugin.settings.icsFilePath).toBe(originalPath);
			expect(saveSettingsSpy).not.toHaveBeenCalled();
			expect(mockGetPathForFile).not.toHaveBeenCalled();
		});
	});

	describe('settings persistence', () => {
		it('should save settings when ICS file path is changed via text input', async () => {
			// Arrange
			const saveSettingsSpy = vi.spyOn(plugin, 'saveSettings').mockResolvedValue();
			let textOnChange: ((value: string) => Promise<void>) | undefined;

			vi.spyOn(TextComponent.prototype, 'onChange').mockImplementation(function(this: TextComponent, cb) {
				// Only capture the onChange for ICS file path (first text field after local calendar heading)
				if (!textOnChange) {
					textOnChange = cb as (value: string) => Promise<void>;
				}
				return this;
			});

			// Act
			settingTab.display();
			await textOnChange?.('/new/path.ics');

			// Assert
			expect(plugin.settings.icsFilePath).toBe('/new/path.ics');
			expect(saveSettingsSpy).toHaveBeenCalled();
		});
	});

	describe('debug logging toggle', () => {
		it('should display Advanced settings section', () => {
			// Arrange
			const settingSpy = vi.spyOn(Setting.prototype, 'setName');

			// Act
			settingTab.display();

			// Assert
			expect(settingSpy).toHaveBeenCalledWith('Advanced');
		});

		it('should display debug logging toggle', () => {
			// Arrange
			const settingSpy = vi.spyOn(Setting.prototype, 'setName');

			// Act
			settingTab.display();

			// Assert
			expect(settingSpy).toHaveBeenCalledWith('Enable debug logging');
		});

		it('should have debug logging disabled by default', () => {
			// Assert
			expect(DEFAULT_SETTINGS.enableDebugLogging).toBe(false);
		});

		it('should save settings when debug toggle is changed', async () => {
			// Arrange
			const saveSettingsSpy = vi.spyOn(plugin, 'saveSettings').mockResolvedValue();
			plugin.settings.enableDebugLogging = false;

			// We need to capture the toggle onChange callback
			const toggleCallbacks: ((value: boolean) => Promise<void>)[] = [];
			vi.spyOn(Setting.prototype, 'addToggle').mockImplementation(function(this: Setting, cb) {
				const mockToggle = {
					setValue: vi.fn().mockReturnThis(),
					onChange: (handler: (value: boolean) => Promise<void>) => {
						toggleCallbacks.push(handler);
						return mockToggle;
					}
				};
				cb(mockToggle as any);
				return this;
			});

			// Act
			settingTab.display();
			// The debug toggle should be the last toggle added (after enableLocalCalendar and enableGoogleCalendar)
			const debugToggleCallback = toggleCallbacks[toggleCallbacks.length - 1];
			await debugToggleCallback(true);

			// Assert
			expect(plugin.settings.enableDebugLogging).toBe(true);
			expect(saveSettingsSpy).toHaveBeenCalled();
		});

		it('should persist debug logging setting across restarts', async () => {
			// Arrange - simulate loading saved settings
			vi.spyOn(plugin, 'loadData').mockResolvedValue({
				enableDebugLogging: true
			});

			// Act
			await plugin.loadSettings();

			// Assert
			expect(plugin.settings.enableDebugLogging).toBe(true);
		});
	});
});
