# Project description

This project is an obsidian plugin named obsidian-daily-sync that is used for importing daily meetings from both local .ics calendar files and a Google Calendar shareable link.

The workflow is the following:

1) User opens a daily note
2) If the note is not created yet, Obsidian creates the daily note automatically.
3) User runs a command or button from this plugin (obsidian-daily-sync).
4) The plugin, in the background, opens the .ics calendar, finds today and extracts the meetings from the file.
5) The plugin adds an entry to the daily note in the format of "Meeting: <topic> (<time>)".
6) The adds an entry for every meeting found for the day under a specific section of the daily note as defined in the plugin options.
7) The plugin, in the background, opens the Google Calendar link, finds today and extracts the meetings from the file.
8) The plugin adds an entry to the daily note in the format of "Meeting: <topic> (<time>)".
9) The adds an entry for every meeting found for the day under a specific section of the daily note as defined in the plugin options.

The plugin should have options for:

- name of the local .ics file
- the section to place the daily meetings for the local calendar
- google calendar shareable link
- the section to place the daily meetings for the google calendar

# Implementation Todo List

**TDD Approach**: Each feature follows Test → Implement → Build → Lint cycle. Features are only complete after passing `make build` and `make lint` checks.

**Development Commands**:
- `make install` - Install dependencies
- `make test` - Run test suite
- `make build` - Build the plugin
- `make lint` - Check code quality
- `make lint-fix` - Fix linting issues automatically
- `make dev` - Run development build with watch mode

## Project Setup & Infrastructure

- [ ] Set up project structure with TypeScript, esbuild, and manifest.json
- [ ] Configure testing framework (Jest or similar for TypeScript)
- [ ] Configure ESLint with strict rules
- [ ] Write tests for settings interface defaults and validation
- [ ] Implement settings interface with defaults (ics file path, local section, google link, google section)
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for main.ts lifecycle (onload, onunload, settings persistence)
- [ ] Implement minimal main.ts with plugin lifecycle
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for settings tab UI rendering and validation
- [ ] Implement settings tab UI for user configuration
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues

## Calendar Integration - Local ICS

- [ ] Write tests for ICS parser (valid files, invalid files, empty files)
- [ ] Implement ICS parser module to read and parse local .ics files
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for extracting today's meetings (multiple meetings, no meetings, different timezones)
- [ ] Implement function to extract today's meetings from ICS data
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues

## Calendar Integration - Google Calendar

- [ ] Write tests for Google Calendar fetcher (mock HTTP responses, network errors, invalid URLs)
- [ ] Implement Google Calendar integration module to fetch iCal data from shareable link
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for parsing Google Calendar iCal format (various event formats)
- [ ] Implement function to parse Google Calendar iCal format and extract today's meetings
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues

## Daily Note Integration

- [ ] Write tests for daily note finder (note exists, note doesn't exist, various date formats)
- [ ] Implement daily note integration module to find/create current daily note
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for meeting insertion (section exists, section missing, duplicate prevention)
- [ ] Implement function to insert meetings under specified section in daily note
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for section creation (various markdown heading levels)
- [ ] Implement section creation if specified section doesn't exist in daily note
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues

## Command & UX

- [ ] Write tests for sync command orchestration (both sources, one source fails, both fail)
- [ ] Implement main sync command that orchestrates all calendar sources
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for command registration and execution
- [ ] Register command in main.ts with stable ID and clear name
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for error handling scenarios (file not found, network errors, parsing failures)
- [ ] Implement error handling for file not found, network errors, and parsing failures
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues
- [ ] Write tests for user notifications (success messages, error messages)
- [ ] Implement user notifications for success and error states
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and fix any issues

## Integration Testing & Validation

- [ ] Run `make build` and copy main.js to test vault
- [ ] Manual test with local .ics file containing multiple meetings for today
- [ ] Manual test with Google Calendar shareable link
- [ ] Manual test edge cases (no meetings, empty sections, invalid file paths, network failures)
- [ ] Manual test settings persistence across Obsidian restarts
- [ ] Manual test duplicate prevention (running sync command multiple times)
- [ ] Verify mobile compatibility settings (isDesktopOnly flag if needed)
- [ ] Run `make test` and verify all tests pass
- [ ] Run `make build` and verify success
- [ ] Run `make lint` and verify success

## Documentation

- [ ] Create README.md with usage instructions and privacy disclosure
- [ ] Update manifest.json with final version and description
