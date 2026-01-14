import { App, PluginSettingTab, Setting } from 'obsidian';
import type DailySyncPlugin from './main';

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
}

export const DEFAULT_SETTINGS: DailySyncSettings = {
	enableLocalCalendar: true,
	icsFilePath: '',
	localCalendarSection: 'Meetings',
	enableGoogleCalendar: true,
	googleCalendarLink: '',
	googleCalendarSection: 'Meetings'
};

/**
 * Settings tab for the Daily Sync plugin
 */
export class DailySyncSettingTab extends PluginSettingTab {
	plugin: DailySyncPlugin;

	constructor(app: App, plugin: DailySyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

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
			.addText(text => text
				.setPlaceholder('/path/to/calendar.ics')
				.setValue(this.plugin.settings.icsFilePath)
				.onChange(async (value) => {
					this.plugin.settings.icsFilePath = value;
					await this.plugin.saveSettings();
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
			.setName('Enable Google calendar')
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
	}
}
