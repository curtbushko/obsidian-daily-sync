/**
 * Tests for Section Creator
 * Tests creating sections in daily notes with proper formatting
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App, TFile } from '../../__mocks__/obsidian';
import {
	ensureSectionExists,
	SectionCreationError
} from '../section-creator';

describe('Section Creator', () => {
	let app: App;
	let file: TFile;

	beforeEach(() => {
		app = new App();
		file = new TFile('2024-01-15.md');
	});

	describe('ensureSectionExists', () => {
		it('should not modify file when section already exists', async () => {
			// Arrange
			const initialContent = `# Daily Note

## Meetings
- Existing meeting

## Tasks
`;
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			expect(modifySpy).not.toHaveBeenCalled();
		});

		it('should create section in empty file', async () => {
			// Arrange
			const initialContent = '';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			expect(modifySpy).toHaveBeenCalledWith(
				file,
				'\n## Meetings\n'
			);
		});

		it('should append section to file with content', async () => {
			// Arrange
			const initialContent = `# Daily Note

Some existing content here.
`;
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('# Daily Note');
			expect(writtenContent).toContain('Some existing content here.');
			expect(writtenContent).toContain('## Meetings');
			expect(writtenContent).toMatch(/\n\n## Meetings\n$/);
		});

		it('should append new section after existing sections', async () => {
			// Arrange
			const initialContent = `## Tasks
- Do something

## Notes
Some notes here
`;
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('## Tasks');
			expect(writtenContent).toContain('## Notes');
			expect(writtenContent).toContain('## Meetings');
			// Meetings should be at the end
			expect(writtenContent).toMatch(/## Meetings\n$/);
		});

		it('should use H2 heading by default', async () => {
			// Arrange
			const initialContent = 'Content\n';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('## Meetings');
		});

		it('should support custom heading level H1', async () => {
			// Arrange
			const initialContent = 'Content\n';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings', 1);

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('# Meetings');
		});

		it('should support custom heading level H3', async () => {
			// Arrange
			const initialContent = 'Content\n';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings', 3);

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('### Meetings');
		});

		it('should support heading level H6', async () => {
			// Arrange
			const initialContent = 'Content\n';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings', 6);

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('###### Meetings');
		});

		it('should throw error for invalid heading level 0', async () => {
			// Arrange
			const initialContent = 'Content\n';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);

			// Act & Assert
			await expect(ensureSectionExists(app, file, 'Meetings', 0)).rejects.toThrow(
				SectionCreationError
			);
		});

		it('should throw error for invalid heading level 7', async () => {
			// Arrange
			const initialContent = 'Content\n';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);

			// Act & Assert
			await expect(ensureSectionExists(app, file, 'Meetings', 7)).rejects.toThrow(
				SectionCreationError
			);
		});

		it('should handle file without trailing newline', async () => {
			// Arrange
			const initialContent = '# Daily Note\n\nSome content';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('Some content');
			expect(writtenContent).toContain('## Meetings');
			// Should add proper spacing
			expect(writtenContent).toMatch(/content\n\n## Meetings\n$/);
		});

		it('should preserve all existing content', async () => {
			// Arrange
			const initialContent = `# Daily Note

## Tasks
- Task 1
- Task 2

Some random content.

## Notes
Important notes here.
`;
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('# Daily Note');
			expect(writtenContent).toContain('## Tasks');
			expect(writtenContent).toContain('- Task 1');
			expect(writtenContent).toContain('- Task 2');
			expect(writtenContent).toContain('Some random content.');
			expect(writtenContent).toContain('## Notes');
			expect(writtenContent).toContain('Important notes here.');
			expect(writtenContent).toContain('## Meetings');
		});

		it('should add proper blank lines around heading', async () => {
			// Arrange
			const initialContent = 'Content\n';
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			// Should have blank line before and after heading
			expect(writtenContent).toMatch(/\n\n## Meetings\n$/);
		});

		it('should not create duplicate sections', async () => {
			// Arrange
			const initialContent = `## Meetings

## Tasks
`;
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			expect(modifySpy).not.toHaveBeenCalled();
		});

		it('should detect section regardless of heading level', async () => {
			// Arrange
			const initialContent = `# Meetings

Content here
`;
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			expect(modifySpy).not.toHaveBeenCalled();
		});

		it('should handle section with same name as substring of another', async () => {
			// Arrange
			const initialContent = `## Meeting Notes

Content
`;
			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			await ensureSectionExists(app, file, 'Meetings');

			// Assert
			// Should create "Meetings" section because "Meeting Notes" is different
			expect(modifySpy).toHaveBeenCalled();
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('## Meeting Notes');
			expect(writtenContent).toContain('## Meetings');
		});
	});

	describe('Error classes', () => {
		it('should have SectionCreationError with correct name', () => {
			// Arrange & Act
			const error = new SectionCreationError('test message');

			// Assert
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('SectionCreationError');
			expect(error.message).toBe('test message');
		});
	});
});
