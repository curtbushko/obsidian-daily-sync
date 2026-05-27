#!/usr/bin/env node
/**
 * Build validation script
 * Verifies that the build produces required outputs for Obsidian plugin
 */

import { existsSync, readFileSync } from 'node:fs';

const REQUIRED_FILES = [
	{ path: 'dist/main.js', display: 'dist/main.js' },
	{ path: 'manifest.json', display: 'manifest.json' },
	{ path: 'styles.css', display: 'styles.css' }
];
const errors = [];

console.log(' Validating build outputs...\n');

// Check required files exist
for (const file of REQUIRED_FILES) {
	if (!existsSync(file.path)) {
		errors.push(`✗ Missing required file: ${file.display}`);
	} else {
		console.log(`✓ Found ${file.display}`);
	}
}

// Validate manifest.json
try {
	const manifestPath = 'manifest.json';
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

	const requiredFields = ['id', 'name', 'version', 'minAppVersion', 'description'];
	for (const field of requiredFields) {
		if (!manifest[field]) {
			errors.push(`✗ manifest.json missing required field: ${field}`);
		}
	}

	// Validate specific requirements for our plugin
	if (manifest.id === 'sample-plugin') {
		errors.push(`✗ manifest.json still has sample plugin ID`);
	}

	console.log(`✓ manifest.json is valid`);
} catch (err) {
	errors.push(`✗ manifest.json is invalid: ${err.message}`);
}

// Check main.js is not empty
try {
	const mainJs = readFileSync('dist/main.js', 'utf-8');
	if (mainJs.length < 100) {
		errors.push(`✗ dist/main.js seems too small (${mainJs.length} bytes)`);
	} else {
		console.log(`✓ dist/main.js is properly generated (${mainJs.length} bytes)`);
	}
} catch {
	// File doesn't exist - already caught above
}

console.log('');

if (errors.length > 0) {
	console.error(' Build validation FAILED:\n');
	errors.forEach(err => console.error(`  ${err}`));
	process.exit(1);
} else {
	console.log(' Build validation PASSED');
	process.exit(0);
}
