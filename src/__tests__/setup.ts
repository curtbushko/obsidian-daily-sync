/**
 * Test setup - extends DOM with Obsidian-specific methods
 */

// Extend HTMLElement with Obsidian-specific methods
declare global {
	interface HTMLElement {
		empty(): void;
		addClass(className: string): void;
		removeClass(className: string): void;
	}
}

HTMLElement.prototype.empty = function() {
	while (this.firstChild) {
		this.removeChild(this.firstChild);
	}
};

HTMLElement.prototype.addClass = function(className: string) {
	this.classList.add(className);
};

HTMLElement.prototype.removeClass = function(className: string) {
	this.classList.remove(className);
};

export {};
