import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, DailySyncSettings, DailySyncSettingTab } from './settings';

/**
 * Daily Sync Plugin
 * Imports daily meetings from local .ics calendar files and Google Calendar into daily notes
 */
export default class DailySyncPlugin extends Plugin {
	settings: DailySyncSettings;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new DailySyncSettingTab(this.app, this));

		// Command to sync meetings to daily note will be added in later feature
	}

	onunload() {
		// Cleanup will be added as needed
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<DailySyncSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
