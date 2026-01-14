import { App, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import type DailySyncPlugin from './main';

// Electron's webUtils for getting file paths
interface ElectronWebUtils {
	getPathForFile(file: File): string;
}

interface ElectronModule {
	webUtils: ElectronWebUtils;
}

// Cached Electron module reference
let electronModule: ElectronModule | null | undefined = undefined;

// Get Electron module if available (desktop only)
export function getElectron(): ElectronModule | null {
	if (electronModule === undefined) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
			electronModule = require('electron') as ElectronModule;
		} catch {
			electronModule = null;
		}
	}
	return electronModule;
}

// Test helper to inject a mock Electron module
export function setElectronForTesting(electron: ElectronModule | null): void {
	electronModule = electron;
}

// Test helper to reset the Electron module cache
export function resetElectronForTesting(): void {
	electronModule = undefined;
}

/**
 * Plugin settings interface
 */
export interface DailySyncSettings {
	/** Enable/disable local calendar sync */
	enableLocalCalendar: boolean;
	/** Path to local .ics calendar file */
	icsFilePath: string;
	/** Section name in daily note for local calendar meetings */
	localCalendarSection: string;
	/** Enable/disable Google Calendar sync */
	enableGoogleCalendar: boolean;
	/** Google Calendar shareable link */
	googleCalendarLink: string;
	/** Section name in daily note for Google Calendar meetings */
	googleCalendarSection: string;
	/** Enable/disable debug logging to console */
	enableDebugLogging: boolean;
}

export const DEFAULT_SETTINGS: DailySyncSettings = {
	enableLocalCalendar: true,
	icsFilePath: '',
	localCalendarSection: 'Meetings',
	enableGoogleCalendar: true,
	googleCalendarLink: '',
	googleCalendarSection: 'Meetings',
	enableDebugLogging: false
};

/**
 * Settings tab for the Daily Sync plugin
 */
export class DailySyncSettingTab extends PluginSettingTab {
	plugin: DailySyncPlugin;
	private fileInput: HTMLInputElement | null = null;
	private icsPathTextComponent: TextComponent | null = null;

	constructor(app: App, plugin: DailySyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Create hidden file input for file browser
		this.fileInput = this.createFileInput(containerEl);

		// Local calendar settings
		new Setting(containerEl)
			.setName('Local calendar')
			.setHeading();

		new Setting(containerEl)
			.setName('Enable local calendar')
			.setDesc('Toggle to enable or disable syncing from local .ics calendar')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableLocalCalendar)
				.onChange(async (value) => {
					this.plugin.settings.enableLocalCalendar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Ics file path')
			.setDesc('Path to your local .ics calendar file')
			.addText(text => {
				this.icsPathTextComponent = text;
				text.setPlaceholder('/path/to/calendar.ics')
					.setValue(this.plugin.settings.icsFilePath)
					.onChange(async (value) => {
						this.plugin.settings.icsFilePath = value;
						await this.plugin.saveSettings();
					});
			})
			.addButton(button => button
				.setButtonText('Browse')
				.setTooltip('Browse for .ics file')
				.onClick(() => {
					this.fileInput?.click();
				}));

		new Setting(containerEl)
			.setName('Section name for local calendar')
			.setDesc('Section heading in daily note where local calendar meetings will be added')
			.addText(text => text
				.setPlaceholder('Meetings')
				.setValue(this.plugin.settings.localCalendarSection)
				.onChange(async (value) => {
					this.plugin.settings.localCalendarSection = value;
					await this.plugin.saveSettings();
				}));

		// Google Calendar settings
		new Setting(containerEl)
			.setName('Google calendar')
			.setHeading();

		new Setting(containerEl)
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setName('Enable Google calendar')
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc('Toggle to enable or disable syncing from Google Calendar')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableGoogleCalendar)
				.onChange(async (value) => {
					this.plugin.settings.enableGoogleCalendar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Shareable link')
			.setDesc('Public/shareable ical link from your calendar')
			.addText(text => text
				.setPlaceholder('https://calendar.google.com/calendar/ical/...')
				.setValue(this.plugin.settings.googleCalendarLink)
				.onChange(async (value) => {
					this.plugin.settings.googleCalendarLink = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Section name')
			.setDesc('Section heading in daily note where calendar meetings will be added')
			.addText(text => text
				.setPlaceholder('Meetings')
				.setValue(this.plugin.settings.googleCalendarSection)
				.onChange(async (value) => {
					this.plugin.settings.googleCalendarSection = value;
					await this.plugin.saveSettings();
				}));

		// Advanced settings
		new Setting(containerEl)
			.setName('Advanced')
			.setHeading();

		new Setting(containerEl)
			.setName('Enable debug logging')
			.setDesc('Log detailed sync information to the developer console (Ctrl+Shift+I)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableDebugLogging)
				.onChange(async (value) => {
					this.plugin.settings.enableDebugLogging = value;
					await this.plugin.saveSettings();
				}));
	}

	/**
	 * Creates a hidden file input element for browsing .ics files
	 */
	private createFileInput(containerEl: HTMLElement): HTMLInputElement {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = '.ics';
		fileInput.addClass('daily-sync-file-input-hidden');

		fileInput.addEventListener('change', () => {
			void this.handleFileSelection(fileInput);
		});

		containerEl.appendChild(fileInput);
		return fileInput;
	}

	/**
	 * Handles file selection from the file browser
	 */
	private async handleFileSelection(fileInput: HTMLInputElement): Promise<void> {
		const files = fileInput.files;
		const file = files?.[0];
		if (!file) {
			return;
		}

		// Validate file extension
		if (!file.name.toLowerCase().endsWith('.ics')) {
			return;
		}

		// Get the full file path using Electron's webUtils (desktop only)
		let filePath = file.name; // Default to filename for mobile/web
		const electron = getElectron();
		if (electron?.webUtils) {
			try {
				filePath = electron.webUtils.getPathForFile(file);
			} catch {
				// Fall back to filename if getPathForFile fails
				filePath = file.name;
			}
		}

		// Update setting
		this.plugin.settings.icsFilePath = filePath;
		await this.plugin.saveSettings();

		// Update the text input to show the selected path
		if (this.icsPathTextComponent) {
			this.icsPathTextComponent.setValue(filePath);
		}

		// Reset the file input so the same file can be selected again
		fileInput.value = '';
	}
}
