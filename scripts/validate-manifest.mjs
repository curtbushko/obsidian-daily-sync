#!/usr/bin/env node
/**
 * Validates manifest.json against Obsidian plugin requirements
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI colors
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m'
};

function log(color, symbol, message) {
	console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function success(message) {
	log(colors.green, '✓', message);
}

function error(message) {
	log(colors.red, '✗', message);
}

function warn(message) {
	log(colors.yellow, '⚠', message);
}

function info(message) {
	log(colors.cyan, 'ℹ', message);
}

function header(message) {
	console.log(`\n${colors.blue}${message}${colors.reset}`);
}

// Load and parse manifest
let manifest;
let manifestPath = join(rootDir, 'manifest.json');

try {
	const manifestContent = readFileSync(manifestPath, 'utf-8');
	manifest = JSON.parse(manifestContent);
	success('manifest.json is valid JSON');
} catch (err) {
	error(`Failed to load manifest.json: ${err.message}`);
	process.exit(1);
}

// Validation functions
const validators = {
	// Required fields
	id: (value) => {
		if (!value) return 'id is required';
		if (typeof value !== 'string') return 'id must be a string';
		if (!/^[a-z0-9-]+$/.test(value)) return 'id must contain only lowercase letters, numbers, and hyphens';
		if (value.startsWith('-') || value.endsWith('-')) return 'id cannot start or end with a hyphen';
		return null;
	},

	name: (value) => {
		if (!value) return 'name is required';
		if (typeof value !== 'string') return 'name must be a string';
		if (value.length < 1) return 'name cannot be empty';
		if (value.length > 50) return 'name should be 50 characters or less';
		return null;
	},

	version: (value) => {
		if (!value) return 'version is required';
		if (typeof value !== 'string') return 'version must be a string';
		// Semantic versioning: x.y.z (only three-part version supported)
		if (!/^\d+\.\d+\.\d+$/.test(value)) return 'version must follow semantic versioning (x.y.z format)';
		return null;
	},

	minAppVersion: (value) => {
		if (!value) return 'minAppVersion is required';
		if (typeof value !== 'string') return 'minAppVersion must be a string';
		if (!/^\d+\.\d+\.\d+$/.test(value)) return 'minAppVersion must follow semantic versioning (x.y.z format)';
		return null;
	},

	description: (value) => {
		if (!value) return 'description is required';
		if (typeof value !== 'string') return 'description must be a string';
		if (value.length < 10) return 'description should be at least 10 characters';
		if (value.length > 250) return 'description should be 250 characters or less (recommended)';
		return null;
	},

	author: (value) => {
		if (!value) return 'author is required';
		if (typeof value !== 'string') return 'author must be a string';
		if (value.length < 1) return 'author cannot be empty';
		return null;
	},

	isDesktopOnly: (value) => {
		if (value === undefined) return 'isDesktopOnly is required';
		if (typeof value !== 'boolean') return 'isDesktopOnly must be a boolean';
		return null;
	},

	// Optional fields
	authorUrl: (value) => {
		if (value !== undefined) {
			if (typeof value !== 'string') return 'authorUrl must be a string';
			try {
				new URL(value);
			} catch {
				return 'authorUrl must be a valid URL';
			}
		}
		return null;
	},

	fundingUrl: (value) => {
		if (value !== undefined) {
			if (typeof value === 'string') {
				try {
					new URL(value);
				} catch {
					return 'fundingUrl must be a valid URL';
				}
			} else if (typeof value === 'object') {
				for (const [key, url] of Object.entries(value)) {
					if (typeof url !== 'string') {
						return `fundingUrl.${key} must be a string`;
					}
					try {
						new URL(url);
					} catch {
						return `fundingUrl.${key} must be a valid URL`;
					}
				}
			} else {
				return 'fundingUrl must be a string or object';
			}
		}
		return null;
	}
};

// Required fields
const requiredFields = [
	'id',
	'name',
	'version',
	'minAppVersion',
	'description',
	'author',
	'isDesktopOnly'
];

// Optional fields
const optionalFields = [
	'authorUrl',
	'fundingUrl'
];

// Validate manifest
header('Validating Required Fields:');
let hasErrors = false;
let hasWarnings = false;

for (const field of requiredFields) {
	const value = manifest[field];
	const validator = validators[field];

	if (validator) {
		const errorMessage = validator(value);
		if (errorMessage) {
			error(`${field}: ${errorMessage}`);
			hasErrors = true;
		} else {
			success(`${field}: "${value}"`);
		}
	}
}

header('Validating Optional Fields:');

for (const field of optionalFields) {
	const value = manifest[field];

	if (value !== undefined) {
		const validator = validators[field];
		if (validator) {
			const errorMessage = validator(value);
			if (errorMessage) {
				error(`${field}: ${errorMessage}`);
				hasErrors = true;
			} else {
				if (typeof value === 'object') {
					success(`${field}: (object with ${Object.keys(value).length} entries)`);
				} else {
					success(`${field}: "${value}"`);
				}
			}
		}
	} else {
		info(`${field}: (not provided)`);
	}
}

// Check for extra fields
header('Checking for Unknown Fields:');

const allKnownFields = [...requiredFields, ...optionalFields];
const manifestFields = Object.keys(manifest);
const unknownFields = manifestFields.filter(field => !allKnownFields.includes(field));

if (unknownFields.length > 0) {
	for (const field of unknownFields) {
		warn(`Unknown field: ${field}`);
		hasWarnings = true;
	}
} else {
	success('No unknown fields found');
}

// Validate versions.json
header('Validating versions.json:');

try {
	const versionsPath = join(rootDir, 'versions.json');
	const versionsContent = readFileSync(versionsPath, 'utf-8');
	const versions = JSON.parse(versionsContent);

	success('versions.json is valid JSON');

	// Check if current version is in versions.json
	if (!versions[manifest.version]) {
		error(`versions.json does not contain entry for version ${manifest.version}`);
		hasErrors = true;
	} else {
		success(`versions.json contains entry for ${manifest.version}`);

		// Check if minAppVersion matches
		if (versions[manifest.version] !== manifest.minAppVersion) {
			warn(`versions.json maps ${manifest.version} to ${versions[manifest.version]}, but manifest.json has minAppVersion ${manifest.minAppVersion}`);
			hasWarnings = true;
		} else {
			success(`versions.json minAppVersion matches manifest.json`);
		}
	}
} catch (err) {
	error(`Failed to validate versions.json: ${err.message}`);
	hasErrors = true;
}

// Validate package.json version (for consistency)
header('Validating package.json:');

try {
	const packagePath = join(rootDir, 'package.json');
	const packageContent = readFileSync(packagePath, 'utf-8');
	const pkg = JSON.parse(packageContent);

	if (pkg.version !== manifest.version) {
		warn(`package.json version (${pkg.version}) does not match manifest.json version (${manifest.version})`);
		hasWarnings = true;
	} else {
		success(`package.json version matches manifest.json (${manifest.version})`);
	}
} catch (err) {
	warn(`Failed to validate package.json: ${err.message}`);
	hasWarnings = true;
}

// Summary
console.log();
if (hasErrors) {
	error('Validation FAILED - Please fix the errors above');
	process.exit(1);
} else if (hasWarnings) {
	warn('Validation passed with warnings');
	process.exit(0);
} else {
	success('Validation PASSED - manifest.json is ready for release!');
	process.exit(0);
}
