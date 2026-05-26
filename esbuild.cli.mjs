import esbuild from 'esbuild';

esbuild.build({
	entryPoints: ['src/cli.ts'],
	bundle: true,
	platform: 'node',
	target: 'node18',
	format: 'esm',
	outfile: 'dist/cli.mjs',
	banner: {
		js: '#!/usr/bin/env node\nimport { createRequire } from "module";\nconst require = createRequire(import.meta.url);\n'
	},
	sourcemap: false,
	minify: false,
	alias: {
		// Stub out obsidian imports
		'obsidian': './src/__mocks__/obsidian.ts',
		'obsidian-daily-notes-interface': './src/__mocks__/obsidian-daily-notes-interface.ts'
	}
}).catch(() => process.exit(1));
