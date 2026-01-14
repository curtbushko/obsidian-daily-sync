/**
 * Tests for Meeting Inserter
 * Tests inserting meetings into daily notes under specified sections
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App, TFile } from '../../__mocks__/obsidian';
import type { IcsEvent } from '../../calendar/ics-parser';
import {
	insertMeetingsIntoNote,
	formatMeeting,
	SectionNotFoundError,
	MeetingInsertionError
} from '../meeting-inserter';

describe('Meeting Inserter', () => {
	let app: App;
	let file: TFile;

	beforeEach(() => {
		app = new App();
		file = new TFile('2024-01-15.md');
	});

	describe('formatMeeting', () => {
		it('should format a regular meeting with time', () => {
			// Arrange
			const meeting: IcsEvent = {
				summary: 'Team Standup',
				start: new Date('2024-01-15T10:00:00'),
				end: new Date('2024-01-15T10:30:00'),
				isAllDay: false
			};

			// Act
			const result = formatMeeting(meeting);

			// Assert
			expect(result).toBe('- [ ] Meeting: Team Standup (10:00 AM)');
		});

		it('should format an all-day event', () => {
			// Arrange
			const meeting: IcsEvent = {
				summary: 'Company Holiday',
				start: new Date('2024-01-15'),
				end: new Date('2024-01-15'),
				isAllDay: true
			};

			// Act
			const result = formatMeeting(meeting);

			// Assert
			expect(result).toBe('- [ ] Meeting: Company Holiday (All day)');
		});

		it('should handle afternoon times (PM)', () => {
			// Arrange
			const meeting: IcsEvent = {
				summary: 'Client Call',
				start: new Date('2024-01-15T14:30:00'),
				end: new Date('2024-01-15T15:00:00'),
				isAllDay: false
			};

			// Act
			const result = formatMeeting(meeting);

			// Assert
			expect(result).toBe('- [ ] Meeting: Client Call (2:30 PM)');
		});

		it('should handle midnight time', () => {
			// Arrange
			const meeting: IcsEvent = {
				summary: 'Midnight Release',
				start: new Date('2024-01-15T00:00:00'),
				end: new Date('2024-01-15T01:00:00'),
				isAllDay: false
			};

			// Act
			const result = formatMeeting(meeting);

			// Assert
			expect(result).toBe('- [ ] Meeting: Midnight Release (12:00 AM)');
		});

		it('should handle noon time', () => {
			// Arrange
			const meeting: IcsEvent = {
				summary: 'Lunch Meeting',
				start: new Date('2024-01-15T12:00:00'),
				end: new Date('2024-01-15T13:00:00'),
				isAllDay: false
			};

			// Act
			const result = formatMeeting(meeting);

			// Assert
			expect(result).toBe('- [ ] Meeting: Lunch Meeting (12:00 PM)');
		});
	});

	describe('insertMeetingsIntoNote', () => {
		it('should insert meetings into existing section', async () => {
			// Arrange
			const initialContent = `# Daily Note

## Meetings

## Tasks
- Do something
`;
			const meetings: IcsEvent[] = [
				{
					summary: 'Team Standup',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(1);
			expect(modifySpy).toHaveBeenCalledWith(
				file,
				expect.stringContaining('- [ ] Meeting: Team Standup (10:00 AM)')
			);
			expect(modifySpy).toHaveBeenCalledWith(
				file,
				expect.stringContaining('## Meetings')
			);
		});

		it('should insert multiple meetings', async () => {
			// Arrange
			const initialContent = `## Meetings\n\n`;
			const meetings: IcsEvent[] = [
				{
					summary: 'Team Standup',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				},
				{
					summary: 'Client Call',
					start: new Date('2024-01-15T14:00:00'),
					end: new Date('2024-01-15T15:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(2);
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('- [ ] Meeting: Team Standup (10:00 AM)');
			expect(writtenContent).toContain('- [ ] Meeting: Client Call (2:00 PM)');
		});

		it('should not insert duplicate meetings', async () => {
			// Arrange
			const initialContent = `## Meetings
- [ ] Meeting: Team Standup (10:00 AM)

`;
			const meetings: IcsEvent[] = [
				{
					summary: 'Team Standup',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(0);
			expect(modifySpy).not.toHaveBeenCalled();
		});

		it('should insert only new meetings when some are duplicates', async () => {
			// Arrange
			const initialContent = `## Meetings
- [ ] Meeting: Team Standup (10:00 AM)

`;
			const meetings: IcsEvent[] = [
				{
					summary: 'Team Standup',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				},
				{
					summary: 'Client Call',
					start: new Date('2024-01-15T14:00:00'),
					end: new Date('2024-01-15T15:00:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(1);
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('- [ ] Meeting: Team Standup (10:00 AM)');
			expect(writtenContent).toContain('- [ ] Meeting: Client Call (2:00 PM)');
			// Should only appear once
			expect((writtenContent.match(/Team Standup/g) || []).length).toBe(1);
		});

		it('should handle empty meetings array', async () => {
			// Arrange
			const initialContent = `## Meetings\n\n`;
			const meetings: IcsEvent[] = [];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(0);
			expect(modifySpy).not.toHaveBeenCalled();
		});

		it('should throw SectionNotFoundError when section does not exist', async () => {
			// Arrange
			const initialContent = `# Daily Note\n\n## Tasks\n`;
			const meetings: IcsEvent[] = [
				{
					summary: 'Team Standup',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);

			// Act & Assert
			await expect(insertMeetingsIntoNote(app, file, meetings, 'Meetings')).rejects.toThrow(
				SectionNotFoundError
			);
		});

		it('should preserve existing content in section', async () => {
			// Arrange
			const initialContent = `## Meetings
- [ ] Meeting: Existing Meeting (9:00 AM)

## Tasks
`;
			const meetings: IcsEvent[] = [
				{
					summary: 'New Meeting',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(1);
			const writtenContent = modifySpy.mock.calls[0][1] as string;
			expect(writtenContent).toContain('- [ ] Meeting: Existing Meeting (9:00 AM)');
			expect(writtenContent).toContain('- [ ] Meeting: New Meeting (10:00 AM)');
		});

		it('should handle section with H1 heading', async () => {
			// Arrange
			const initialContent = `# Meetings\n\n`;
			const meetings: IcsEvent[] = [
				{
					summary: 'Team Standup',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(1);
			expect(modifySpy).toHaveBeenCalled();
		});

		it('should handle section at end of file', async () => {
			// Arrange
			const initialContent = `# Daily Note

## Tasks
- Do something

## Meetings
`;
			const meetings: IcsEvent[] = [
				{
					summary: 'Team Standup',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(1);
			expect(modifySpy).toHaveBeenCalled();
		});

		it('should handle malformed markdown gracefully', async () => {
			// Arrange
			const initialContent = `## Meetings
Some random text without proper formatting
## Tasks
`;
			const meetings: IcsEvent[] = [
				{
					summary: 'Team Standup',
					start: new Date('2024-01-15T10:00:00'),
					end: new Date('2024-01-15T10:30:00'),
					isAllDay: false
				}
			];

			vi.spyOn(app.vault, 'read').mockResolvedValue(initialContent);
			const modifySpy = vi.spyOn(app.vault, 'modify').mockResolvedValue();

			// Act
			const result = await insertMeetingsIntoNote(app, file, meetings, 'Meetings');

			// Assert
			expect(result).toBe(1);
			expect(modifySpy).toHaveBeenCalled();
		});
	});

	describe('Error classes', () => {
		it('should have SectionNotFoundError with correct name', () => {
			// Arrange & Act
			const error = new SectionNotFoundError('test message');

			// Assert
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('SectionNotFoundError');
			expect(error.message).toBe('test message');
		});

		it('should have MeetingInsertionError with correct name', () => {
			// Arrange & Act
			const error = new MeetingInsertionError('test message');

			// Assert
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('MeetingInsertionError');
			expect(error.message).toBe('test message');
		});
	});
});
