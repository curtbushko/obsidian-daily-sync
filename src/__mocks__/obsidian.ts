/**
 * Mock implementation of Obsidian API for testing
 */
import momentLib from 'moment';

// Re-export moment as Obsidian does
export { default as moment } from 'moment';

export class Plugin {
	app: App;
	manifest: PluginManifest;

	constructor(app: App, manifest: PluginManifest) {
		this.app = app;
		this.manifest = manifest;
	}

	async loadData(): Promise<unknown> {
		return {};
	}

	async saveData(data: unknown): Promise<void> {
		// Mock implementation
	}

	addSettingTab(settingTab: PluginSettingTab): void {
		// Mock implementation
	}

	addCommand(command: Command): void {
		// Mock implementation
	}

	addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => void): HTMLElement {
		return document.createElement('div');
	}

	addStatusBarItem(): HTMLElement {
		return document.createElement('div');
	}

	registerDomEvent(el: HTMLElement, type: string, callback: EventListener): void {
		// Mock implementation
	}

	registerInterval(interval: number): number {
		return 0;
	}
}

export class App {
	workspace: Workspace;
	vault: Vault;
	metadataCache: MetadataCache;

	constructor() {
		this.workspace = new Workspace();
		this.vault = new Vault();
		this.metadataCache = new MetadataCache();
	}
}

export class Workspace {
	getActiveViewOfType<T>(type: new (...args: unknown[]) => T): T | null {
		return null;
	}

	getLeaf(newLeaf?: boolean): WorkspaceLeaf {
		return new WorkspaceLeaf();
	}
}

export class WorkspaceLeaf {}

export class Vault {
	async read(file: TFile): Promise<string> {
		return '';
	}

	async modify(file: TFile, data: string): Promise<void> {
		// Mock implementation
	}

	async create(path: string, data: string): Promise<TFile> {
		return new TFile();
	}

	async delete(file: TFile): Promise<void> {
		// Mock implementation
	}

	getAbstractFileByPath(path: string): TAbstractFile | null {
		return null;
	}
}

export class TFile {
	path: string;
	name: string;
	basename: string;
	extension: string;

	constructor(path = 'test.md') {
		this.path = path;
		this.name = path.split('/').pop() || '';
		this.basename = this.name.split('.')[0] || '';
		this.extension = this.name.split('.').pop() || '';
	}
}

export class TAbstractFile {}

export class MetadataCache {
	getFileCache(file: TFile): CachedMetadata | null {
		return null;
	}
}

export interface CachedMetadata {}

export class PluginSettingTab {
	app: App;
	plugin: Plugin;
	containerEl: HTMLElement;

	constructor(app: App, plugin: Plugin) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = document.createElement('div');
	}

	display(): void {
		// Override in subclass
	}

	hide(): void {
		this.containerEl.empty();
	}
}

export class Setting {
	settingEl: HTMLElement;

	constructor(containerEl: HTMLElement) {
		this.settingEl = document.createElement('div');
		containerEl.appendChild(this.settingEl);
	}

	setName(name: string): this {
		return this;
	}

	setDesc(desc: string): this {
		return this;
	}

	setHeading(): this {
		return this;
	}

	addText(cb: (text: TextComponent) => void): this {
		cb(new TextComponent());
		return this;
	}

	addToggle(cb: (toggle: ToggleComponent) => void): this {
		cb(new ToggleComponent());
		return this;
	}

	addDropdown(cb: (dropdown: DropdownComponent) => void): this {
		cb(new DropdownComponent());
		return this;
	}
}

export class TextComponent {
	inputEl: HTMLInputElement;
	value: string = '';

	constructor() {
		this.inputEl = document.createElement('input');
	}

	setPlaceholder(placeholder: string): this {
		this.inputEl.placeholder = placeholder;
		return this;
	}

	setValue(value: string): this {
		this.value = value;
		this.inputEl.value = value;
		return this;
	}

	onChange(callback: (value: string) => void): this {
		this.inputEl.addEventListener('input', () => callback(this.inputEl.value));
		return this;
	}
}

export class ToggleComponent {
	toggleEl: HTMLInputElement;
	value: boolean = false;

	constructor() {
		this.toggleEl = document.createElement('input');
		this.toggleEl.type = 'checkbox';
	}

	setValue(value: boolean): this {
		this.value = value;
		this.toggleEl.checked = value;
		return this;
	}

	onChange(callback: (value: boolean) => void): this {
		this.toggleEl.addEventListener('change', () => callback(this.toggleEl.checked));
		return this;
	}
}

export class DropdownComponent {
	selectEl: HTMLSelectElement;

	constructor() {
		this.selectEl = document.createElement('select');
	}

	addOption(value: string, display: string): this {
		const option = document.createElement('option');
		option.value = value;
		option.textContent = display;
		this.selectEl.appendChild(option);
		return this;
	}

	setValue(value: string): this {
		this.selectEl.value = value;
		return this;
	}

	onChange(callback: (value: string) => void): this {
		this.selectEl.addEventListener('change', () => callback(this.selectEl.value));
		return this;
	}
}

export class Notice {
	message: string;
	timeout: number;

	constructor(message: string, timeout = 5000) {
		this.message = message;
		this.timeout = timeout;
	}
}

export class Modal {
	app: App;
	contentEl: HTMLElement;

	constructor(app: App) {
		this.app = app;
		this.contentEl = document.createElement('div');
	}

	open(): void {
		this.onOpen();
	}

	close(): void {
		this.onClose();
	}

	onOpen(): void {
		// Override in subclass
	}

	onClose(): void {
		// Override in subclass
	}
}

export class MarkdownView {
	app: App;

	constructor(app: App) {
		this.app = app;
	}
}

export class Editor {}

export interface PluginManifest {
	id: string;
	name: string;
	version: string;
	minAppVersion: string;
	description: string;
	author: string;
	authorUrl?: string;
	isDesktopOnly: boolean;
}

export interface Command {
	id: string;
	name: string;
	callback?: () => void;
	checkCallback?: (checking: boolean) => boolean | void;
	editorCallback?: (editor: Editor, view: MarkdownView) => void;
}

export interface RequestUrlParam {
	url: string;
	method?: string;
	contentType?: string;
	body?: string | ArrayBuffer;
	headers?: Record<string, string>;
	throw?: boolean;
}

export interface RequestUrlResponse {
	status: number;
	headers: Record<string, string>;
	arrayBuffer: ArrayBuffer;
	json: unknown;
	text: string;
}

export interface RequestUrlResponsePromise extends Promise<RequestUrlResponse> {
	arrayBuffer: Promise<ArrayBuffer>;
	json: Promise<unknown>;
	text: Promise<string>;
}

// Global mock for requestUrl
let mockRequestUrlImplementation: (request: RequestUrlParam | string) => Promise<RequestUrlResponse> =
	async () => {
		throw new Error('requestUrl not mocked');
	};

export function requestUrl(request: RequestUrlParam | string): RequestUrlResponsePromise {
	// Create a wrapper promise that won't create unhandled rejections
	const wrappedPromise = (async () => {
		return await mockRequestUrlImplementation(request);
	})() as RequestUrlResponsePromise;

	// Add convenience accessors that lazily evaluate
	Object.defineProperty(wrappedPromise, 'arrayBuffer', {
		get() {
			return wrappedPromise.then(r => r.arrayBuffer);
		}
	});
	Object.defineProperty(wrappedPromise, 'json', {
		get() {
			return wrappedPromise.then(r => r.json);
		}
	});
	Object.defineProperty(wrappedPromise, 'text', {
		get() {
			return wrappedPromise.then(r => r.text);
		}
	});

	return wrappedPromise;
}

// Test helper to mock requestUrl
export function mockRequestUrl(implementation: (request: RequestUrlParam | string) => Promise<RequestUrlResponse>): void {
	mockRequestUrlImplementation = implementation;
}

// Test helper to reset requestUrl mock
export function resetRequestUrlMock(): void {
	mockRequestUrlImplementation = async () => {
		throw new Error('requestUrl not mocked');
	};
}
