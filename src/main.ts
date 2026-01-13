import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, DailySyncSettings, DailySyncSettingTab } from './settings';
import { syncMeetingsToDaily } from './sync/sync-orchestrator';

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

		// Register sync command
		this.addCommand({
			id: 'sync-meetings',
			name: 'Sync meetings to daily note',
			callback: async () => {
				try {
					await syncMeetingsToDaily(this.app, this.settings);
					// TODO: Add user notification in P05.F04
				} catch (error) {
					// TODO: Add user notification in P05.F04
					console.error('Sync failed:', error);
				}
			}
		});
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
