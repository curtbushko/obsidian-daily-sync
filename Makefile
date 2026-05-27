.PHONY: help install build dev test lint lint-fix clean validate-build dist

# Default target
help:
	@echo "Obsidian Daily Sync Plugin - Available targets:"
	@echo "  make install       - Install npm dependencies"
	@echo "  make build         - Build the plugin for production"
	@echo "  make dev           - Run development build with watch mode"
	@echo "  make test          - Run test suite"
	@echo "  make lint          - Run ESLint to check code quality"
	@echo "  make lint-fix      - Run ESLint and automatically fix issues"
	@echo "  make validate-build - Validate build outputs"
	@echo "  make dist          - Create distribution directory for release"
	@echo "  make clean         - Remove build artifacts and node_modules"

# Install dependencies
install:
	npm install

# Production build
build:
	npm run build
	@node scripts/validate-build.mjs

# Development build with watch
dev:
	npm run dev

# Run tests
test:
	npm test

# Lint code
lint:
	npm run lint

# Lint and fix
lint-fix:
	npm run lint -- --fix

# Validate build outputs
validate-build:
	@node scripts/validate-build.mjs

# Create distribution directory
dist: build
	@echo "Creating distribution package..."
	@npm run build:cli
	@cp manifest.json dist/
	@cp styles.css dist/
	@echo "Distribution created in dist/ directory"
	@ls -lh dist/

# Clean build artifacts
clean:
	@mkdir -p .trash
	@grep -q "^\.trash/$$" .gitignore 2>/dev/null || echo ".trash/" >> .gitignore
	@[ -d node_modules ] && mv node_modules .trash/ || true
	@[ -d dist ] && mv dist .trash/ || true
	@find . -maxdepth 1 -name "*.map" -exec mv {} .trash/ \;
