/**
 * Section Creator
 *
 * Provides functionality to ensure sections exist in daily notes.
 * Creates sections with proper markdown formatting when they don't exist.
 */
import { App, TFile } from 'obsidian';

/**
 * Error thrown when section creation fails
 */
export class SectionCreationError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message);
		this.name = 'SectionCreationError';
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SectionCreationError);
		}
	}
}

/**
 * Checks if a section exists in the content.
 *
 * @param content - The markdown content
 * @param sectionName - The section heading name (without # symbols)
 * @returns True if section exists
 */
function sectionExists(content: string, sectionName: string): boolean {
	const lines = content.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]?.trim() ?? '';
		// Match # Meetings or ## Meetings or ### Meetings, etc.
		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch && headingMatch[2]) {
			const headingText = headingMatch[2].trim();
			if (headingText === sectionName) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Formats a section heading with proper markdown syntax.
 *
 * @param sectionName - The section name (without # symbols)
 * @param headingLevel - The heading level (1-6)
 * @returns Formatted heading like "## Meetings"
 * @throws {SectionCreationError} - If heading level is invalid
 */
function formatSection(sectionName: string, headingLevel: number): string {
	if (headingLevel < 1 || headingLevel > 6) {
		throw new SectionCreationError(
			`Invalid heading level: ${headingLevel}. Must be between 1 and 6.`
		);
	}

	const hashes = '#'.repeat(headingLevel);
	return `${hashes} ${sectionName}`;
}

/**
 * Ensures a section exists in a daily note, creating it if necessary.
 *
 * This function:
 * - Checks if the section already exists
 * - If not, appends it to the end of the file
 * - Preserves all existing content
 * - Uses proper markdown formatting with blank lines
 *
 * @param app - The Obsidian App instance
 * @param file - The daily note file
 * @param sectionName - Section heading name (without # symbols)
 * @param headingLevel - Optional heading level (1-6), defaults to 2 (H2)
 * @throws {SectionCreationError} - If section creation fails or heading level is invalid
 *
 * @example
 * ```typescript
 * // Ensure "Meetings" section exists with H2 heading
 * await ensureSectionExists(app, dailyNote, 'Meetings');
 *
 * // Create section with custom heading level
 * await ensureSectionExists(app, dailyNote, 'Tasks', 3); // ### Tasks
 * ```
 */
export async function ensureSectionExists(
	app: App,
	file: TFile,
	sectionName: string,
	headingLevel: number = 2
): Promise<void> {
	try {
		// Validate heading level
		if (headingLevel < 1 || headingLevel > 6) {
			throw new SectionCreationError(
				`Invalid heading level: ${headingLevel}. Must be between 1 and 6.`
			);
		}

		// Read the current file content
		const content = await app.vault.read(file);

		// Check if section already exists
		if (sectionExists(content, sectionName)) {
			// Section exists, no need to modify
			return;
		}

		// Format the new section heading
		const sectionHeading = formatSection(sectionName, headingLevel);

		// Build the updated content
		let updatedContent = content;

		// Ensure content ends with newline (if not empty)
		if (updatedContent.length > 0 && !updatedContent.endsWith('\n')) {
			updatedContent += '\n';
		}

		// Add blank line before section heading for proper spacing
		updatedContent += '\n';

		// Add the section heading
		updatedContent += sectionHeading + '\n';

		// Write the updated content
		await app.vault.modify(file, updatedContent);

	} catch (error) {
		if (error instanceof SectionCreationError) {
			throw error;
		}
		throw new SectionCreationError(
			`Failed to create section "${sectionName}" in ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
			error
		);
	}
}
