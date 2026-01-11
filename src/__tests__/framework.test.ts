import { describe, it, expect, beforeEach } from 'vitest';
import { App, Plugin, PluginSettingTab } from 'obsidian';

/**
 * Meta-test to verify testing framework is working correctly
 */
describe('Testing Framework', () => {
	describe('Vitest Configuration', () => {
		it('should run tests successfully', () => {
			expect(true).toBe(true);
		});

		it('should support async tests', async () => {
			const promise = Promise.resolve(42);
			await expect(promise).resolves.toBe(42);
		});
	});

	describe('Obsidian API Mocks', () => {
		let app: App;

		beforeEach(() => {
			app = new App();
		});

		it('should mock App class', () => {
			expect(app).toBeDefined();
			expect(app.workspace).toBeDefined();
			expect(app.vault).toBeDefined();
		});

		it('should mock Plugin class', () => {
			const manifest = {
				id: 'test-plugin',
				name: 'Test Plugin',
				version: '1.0.0',
				minAppVersion: '0.15.0',
				description: 'Test',
				author: 'Test Author',
				isDesktopOnly: false,
			};

			const plugin = new Plugin(app, manifest);
			expect(plugin).toBeDefined();
			expect(plugin.app).toBe(app);
			expect(plugin.manifest).toBe(manifest);
		});

		it('should mock PluginSettingTab class', () => {
			const manifest = {
				id: 'test-plugin',
				name: 'Test Plugin',
				version: '1.0.0',
				minAppVersion: '0.15.0',
				description: 'Test',
				author: 'Test Author',
				isDesktopOnly: false,
			};

			const plugin = new Plugin(app, manifest);
			const settingTab = new PluginSettingTab(app, plugin);

			expect(settingTab).toBeDefined();
			expect(settingTab.app).toBe(app);
			expect(settingTab.plugin).toBe(plugin);
			expect(settingTab.containerEl).toBeDefined();
		});

		it('should support async operations', async () => {
			const data = { test: 'value' };
			await app.vault.create('test.md', JSON.stringify(data));

			// If we got here without errors, async operations work
			expect(true).toBe(true);
		});
	});
});
