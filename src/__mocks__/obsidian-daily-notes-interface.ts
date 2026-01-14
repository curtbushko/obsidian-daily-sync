/**
 * Mock implementation of obsidian-daily-notes-interface for testing
 */
import type { Moment } from 'moment';
import { TFile } from './obsidian';

// Mock state
let mockPluginLoaded = true;
let mockDailyNotes: Record<string, TFile> = {};
let mockCreateShouldFail = false;

export function appHasDailyNotesPluginLoaded(): boolean {
	return mockPluginLoaded;
}

export function getAllDailyNotes(): Record<string, TFile> {
	return mockDailyNotes;
}

export function getDailyNote(date: Moment, allDailyNotes: Record<string, TFile>): TFile | null {
	const dateStr = date.format('YYYYMMDD');
	return allDailyNotes[dateStr] || null;
}

export async function createDailyNote(date: Moment): Promise<TFile> {
	if (mockCreateShouldFail) {
		throw new Error('Failed to create daily note: Permission denied');
	}
	const dateStr = date.format('YYYYMMDD');
	const file = new TFile(`Daily Notes/${dateStr}.md`);
	mockDailyNotes[dateStr] = file;
	return file;
}

// Test helpers
export function setPluginLoaded(loaded: boolean): void {
	mockPluginLoaded = loaded;
}

export function setDailyNotes(notes: Record<string, TFile>): void {
	mockDailyNotes = notes;
}

export function setCreateShouldFail(shouldFail: boolean): void {
	mockCreateShouldFail = shouldFail;
}

export function resetMocks(): void {
	mockPluginLoaded = true;
	mockDailyNotes = {};
	mockCreateShouldFail = false;
}
