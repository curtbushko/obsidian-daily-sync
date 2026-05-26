import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		// Allow moment in devDependencies for testing (Obsidian bundles moment)
		files: ['package.json'],
		rules: {
			'depend/ban-dependencies': ['error', {
				allowed: ['moment'], // Allow in devDependencies for tests
			}],
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"scripts",
		"esbuild.config.mjs",
		"esbuild.cli.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		"**/__tests__/**",
		"**/__mocks__/**",
		"**/*.test.ts",
		"vitest.config.ts",
		"coverage",
		".trash/**",
		"src/cli.ts",
	]),
);
