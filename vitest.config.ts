import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			obsidian: resolve(__dirname, 'src/__mocks__/obsidian.ts'),
		},
	},
	test: {
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./src/__tests__/setup.ts'],
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.direnv/**',
			'**/.git/**',
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'dist/',
				'scripts/',
				'*.config.*',
				'**/*.test.ts',
				'**/__tests__/**',
				'**/__mocks__/**',
				'esbuild.config.mjs',
				'version-bump.mjs',
			],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 75,
				statements: 80,
			},
		},
	},
});
