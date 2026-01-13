import { Plugin, Notice } from 'obsidian';
import { DEFAULT_SETTINGS, DailySyncSettings, DailySyncSettingTab } from './settings';
import { syncMeetingsToDaily } from './sync/sync-orchestrator';
import { formatErrorForUser } from './errors/error-handler';
import { showSyncNotification } from './notifications/notification-handler';

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
					const result = await syncMeetingsToDaily(this.app, this.settings);
					showSyncNotification(result);
				} catch (error) {
					// Format error for user with helpful suggestions
					const userError = formatErrorForUser(error);

					// Show error notification
					new Notice(`${userError.title}: ${userError.message}`, 8000);

					// Log detailed error info to console
					console.error('Sync failed:', userError.title, '-', userError.message);
					console.error('Suggestions:', userError.suggestions);
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
