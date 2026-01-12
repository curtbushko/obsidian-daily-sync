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

# Task Tracking System

## Naming Convention

This project uses a hierarchical naming system for tracking work:

**Format**: `P##.F##.T##`

- **P##** = Phase number (e.g., P01, P02, P03)
- **F##** = Feature number within that phase (e.g., F01, F02, F03)
- **T##** = Task number within that feature (e.g., T01, T02, T03)

## Examples

- `P01.F01.T01` = Phase 01, Feature 01, Task 01 (Project Setup - Build Config - Investigate)
- `P02.F01.T03` = Phase 02, Feature 01, Task 03 (Local ICS - Parser - Test)
- `P05.F03.T05` = Phase 05, Feature 03, Task 05 (Command & UX - Error Handling - Validate)

## How to Reference Work

When discussing or tracking work, always use the full identifier:

```
✓ "Working on P02.F01.T03" - CORRECT
✗ "Working on the parser tests" - TOO VAGUE
✗ "Working on Task 3" - AMBIGUOUS
```

## Task States

Each task has a checkbox status:
- `[ ]` = Not started / Pending
- `[x]` = Completed

## TDD Task Structure

Each feature follows the standard 6-task TDD workflow:
1. **T01: Investigate** - Understand requirements, review code, identify dependencies
2. **T02: Plan** - Design interface/API, identify edge cases, plan approach
3. **T03: Test** - Write failing tests first (Red phase)
4. **T04: Implement** - Write minimal code to pass tests (Green phase)
5. **T05: Validate** - Run all tests, check coverage, verify no regressions
6. **T06: Finalize** - Refactor, clean up, document, commit

## Progress Tracking

To find current work:
1. Look for the first `[ ]` (uncompleted) task in sequence
2. Reference it by its full P##.F##.T## identifier
3. Complete tasks in order within each feature
4. Mark with `[x]` when complete

## Phase Overview

- **P01**: Project Setup & Infrastructure (6 features) - ✓ COMPLETED
- **P02**: Calendar Integration - Local ICS (2 features)
- **P03**: Calendar Integration - Google Calendar (2 features)
- **P04**: Daily Note Integration (3 features)
- **P05**: Command & UX (4 features)
- **P06**: Integration Testing & Validation (2 features)
- **P07**: Documentation (2 features)

**Total**: 7 Phases, 19 Features, 114 Tasks (6 tasks per feature)

# Implementation Todo List

**TDD Approach**: Each feature follows the 6-phase TDD workflow. Features are only complete after passing all phases.

**IMPORTANT**: All build, test, and lint operations MUST use the make commands:
- Use `make build` for all builds (NOT npm run build, tsc, esbuild directly)
- Use `make test` for all tests (NOT npm test, jest, vitest directly)
- Use `make lint` for all linting (NOT npm run lint, eslint directly)

**TDD Workflow Phases**:
1. **Investigate** - Understand requirement, review existing code, identify dependencies, document acceptance criteria
2. **Reproduce/Plan** - For bugs: create minimal reproduction; For features: design interface/API, identify edge cases
3. **Test** - Write failing tests FIRST (Red phase), use AAA pattern (Arrange, Act, Assert), include positive/negative cases
4. **Implement** - Write minimal code to pass tests (Green phase), follow SOLID principles, keep functions small and focused
5. **Validate** - Run all tests (no regressions), check coverage (aim >80%), run linter, verify error handling
6. **Finalize** - Refactor for clarity, remove dead code, update documentation, commit with descriptive message

**Development Commands**:
- `make install` - Install dependencies
- `make test` - Run test suite
- `make build` - Build the plugin
- `make lint` - Check code quality
- `make lint-fix` - Fix linting issues automatically
- `make dev` - Run development build with watch mode

## P01: Phase 01: Project Setup & Infrastructure

### P01.F01: Feature 01: Project Structure & Build Configuration
- [x] P01.F01.T01: Task 01: **Investigate**: Review Obsidian plugin requirements, TypeScript setup, esbuild configuration
- [x] P01.F01.T02: Task 02: **Plan**: Design project structure, identify required dependencies, define build pipeline
- [x] P01.F01.T03: Task 03: **Test**: Write tests for build output validation (main.js exists, manifest.json valid, no TS errors)
- [x] P01.F01.T04: Task 04: **Implement**: Set up TypeScript, esbuild, manifest.json with proper configuration
- [x] P01.F01.T05: Task 05: **Validate**: Run `make build` and `make lint`, verify all tests pass, check coverage
- [x] P01.F01.T06: Task 06: **Finalize**: Clean up config files, document build process, commit

### P01.F02: Feature 02: Testing Framework Configuration
- [x] P01.F02.T01: Task 01: **Investigate**: Research testing frameworks for TypeScript (Jest, Vitest), mock requirements for Obsidian API
- [x] P01.F02.T02: Task 02: **Plan**: Design test setup, identify testing utilities needed, plan for mocking Obsidian API
- [x] P01.F02.T03: Task 03: **Test**: Write meta-test to verify test framework runs and can mock Obsidian
- [x] P01.F02.T04: Task 04: **Implement**: Configure testing framework with TypeScript support and Obsidian mocks
- [x] P01.F02.T05: Task 05: **Validate**: Run `make test`, verify tests execute correctly, check configuration
- [x] P01.F02.T06: Task 06: **Finalize**: Document testing approach, commit configuration

### P01.F03: Feature 03: ESLint Configuration
- [x] P01.F03.T01: Task 01: **Investigate**: Review TypeScript ESLint rules, Obsidian plugin best practices
- [x] P01.F03.T02: Task 02: **Plan**: Select strict ruleset, identify security plugins (if applicable)
- [x] P01.F03.T03: Task 03: **Test**: Write test with intentional violations to verify rules work
- [x] P01.F03.T04: Task 04: **Implement**: Configure ESLint with strict rules and TypeScript support
- [x] P01.F03.T05: Task 05: **Validate**: Run `make lint`, verify rules catch issues, test auto-fix capability
- [x] P01.F03.T06: Task 06: **Finalize**: Document linting standards, commit configuration

### P01.F04: Feature 04: Settings Interface
- [x] P01.F04.T01: Task 01: **Investigate**: Review Obsidian settings API, understand data persistence requirements
- [x] P01.F04.T02: Task 02: **Plan**: Design settings interface (ics file path, local section, google link, google section), define defaults and validation
- [x] P01.F04.T03: Task 03: **Test**: Write tests for settings defaults, validation rules, edge cases (empty strings, invalid URLs)
- [x] P01.F04.T04: Task 04: **Implement**: Create settings interface with proper types and defaults
- [x] P01.F04.T05: Task 05: **Validate**: Run `make test`, `make build`, `make lint` - verify all pass with >80% coverage
- [x] P01.F04.T06: Task 06: **Finalize**: Refactor for clarity, remove console.logs, document settings schema, commit

### P01.F05: Feature 05: Plugin Lifecycle (main.ts)
- [x] P01.F05.T01: Task 01: **Investigate**: Review Obsidian plugin lifecycle hooks, settings persistence patterns
- [x] P01.F05.T02: Task 02: **Plan**: Design main plugin class structure, identify onload/onunload responsibilities
- [x] P01.F05.T03: Task 03: **Test**: Write tests for plugin lifecycle (onload called, settings loaded, onunload cleans up)
- [x] P01.F05.T04: Task 04: **Implement**: Create minimal main.ts with plugin lifecycle and settings persistence
- [x] P01.F05.T05: Task 05: **Validate**: Run all tests, verify no memory leaks, check build output, run linter
- [x] P01.F05.T06: Task 06: **Finalize**: Refactor for maintainability, document lifecycle, commit

### P01.F06: Feature 06: Settings Tab UI
- [x] P01.F06.T01: Task 01: **Investigate**: Review Obsidian settings tab API, UI component patterns
- [x] P01.F06.T02: Task 02: **Plan**: Design settings UI layout, plan validation feedback, identify UX requirements
- [x] P01.F06.T03: Task 03: **Test**: Write tests for settings tab rendering, user input validation, save functionality
- [x] P01.F06.T04: Task 04: **Implement**: Create settings tab UI with validation and user feedback
- [x] P01.F06.T05: Task 05: **Validate**: Run all tests, manual UI testing, verify settings persistence, run linter
- [x] P01.F06.T06: Task 06: **Finalize**: Refactor UI code, improve accessibility, document UI components, commit

## P02: Phase 02: Calendar Integration - Local ICS

### P02.F01: Feature 01: ICS File Parser
- [x] P02.F01.T01: Task 01: **Investigate**: Research ICS format specification, identify parser libraries (ical.js, node-ical), understand Obsidian file system API
- [x] P02.F01.T02: Task 02: **Plan**: Design parser interface, define acceptance criteria (valid/invalid files, empty files), plan error handling
- [x] P02.F01.T03: Task 03: **Test**: Write failing tests for ICS parsing (valid files, malformed files, empty files, missing file, permission errors)
- [x] P02.F01.T04: Task 04: **Implement**: Create ICS parser module with proper error handling and validation
- [x] P02.F01.T05: Task 05: **Validate**: Run `make test` (>80% coverage), `make build`, `make lint` - verify all pass, no regressions
- [x] P02.F01.T06: Task 06: **Finalize**: Refactor parser for clarity, remove debug code, document parser API, commit

### P02.F02: Feature 02: Extract Today's Meetings from ICS
- [x] P02.F02.T01: Task 01: **Investigate**: Review ICS event structure, understand timezone handling, identify edge cases (all-day events, recurring events)
- [x] P02.F02.T02: Task 02: **Plan**: Design meeting extraction interface, define date comparison logic, plan timezone handling
- [x] P02.F02.T03: Task 03: **Test**: Write tests for today's meetings extraction (multiple meetings, no meetings, different timezones, all-day events, recurring events, past events)
- [x] P02.F02.T04: Task 04: **Implement**: Create function to filter and extract today's meetings with timezone awareness
- [x] P02.F02.T05: Task 05: **Validate**: Run all tests, verify timezone edge cases, run build and lint, check coverage >80%
- [x] P02.F02.T06: Task 06: **Finalize**: Refactor date logic, optimize performance, document timezone handling, commit

## P03: Phase 03: Calendar Integration - Google Calendar

### P03.F01: Feature 01: Google Calendar Fetcher
- [x] P03.F01.T01: Task 01: **Investigate**: Research Google Calendar shareable link format, HTTP fetch requirements, understand Obsidian's RequestUrl API
- [x] P03.F01.T02: Task 02: **Plan**: Design fetcher interface, identify error scenarios (network errors, invalid URLs, 404, timeout), plan retry logic
- [x] P03.F01.T03: Task 03: **Test**: Write tests with mocked HTTP responses (success, network errors, invalid URLs, 404, timeout, malformed response)
- [x] P03.F01.T04: Task 04: **Implement**: Create Google Calendar fetcher module with proper error handling and timeout
- [x] P03.F01.T05: Task 05: **Validate**: Run all tests, verify error handling, run build and lint, check coverage >80%
- [x] P03.F01.T06: Task 06: **Finalize**: Refactor for maintainability, document API usage and limitations, commit

### P03.F02: Feature 02: Parse Google Calendar iCal Format ✅
- [x] P03.F02.T01: Task 01: **Investigate**: Review Google Calendar iCal format differences from standard ICS, identify event variations (meetings, all-day, recurring)
- [x] P03.F02.T02: Task 02: **Plan**: Design parser to handle Google-specific iCal features, plan event extraction and filtering
- [x] P03.F02.T03: Task 03: **Test**: Write tests for Google Calendar parsing (various event formats, timezone handling, recurring events, all-day events, cancelled events)
- [x] P03.F02.T04: Task 04: **Implement**: Create function to parse Google Calendar iCal and extract today's meetings
- [x] P03.F02.T05: Task 05: **Validate**: Run all tests (>80% coverage), verify edge cases, run build and lint, no regressions
- [x] P03.F02.T06: Task 06: **Finalize**: Refactor parsing logic, optimize performance, document Google Calendar specifics, commit

## P04: Phase 04: Daily Note Integration

### P04.F01: Feature 01: Daily Note Finder/Creator
- [ ] P04.F01.T01: Task 01: **Investigate**: Review Obsidian daily notes API, understand date formats and file path resolution
- [ ] P04.F01.T02: Task 02: **Plan**: Design note finder interface, identify scenarios (note exists, doesn't exist, various date formats), plan note creation logic
- [ ] P04.F01.T03: Task 03: **Test**: Write tests for finding/creating daily notes (note exists, note doesn't exist, different date formats, file permission errors)
- [ ] P04.F01.T04: Task 04: **Implement**: Create daily note finder module with automatic creation fallback
- [ ] P04.F01.T05: Task 05: **Validate**: Run all tests (>80% coverage), verify file operations, run build and lint
- [ ] P04.F01.T06: Task 06: **Finalize**: Refactor for clarity, document API usage, commit

### P04.F02: Feature 02: Meeting Insertion into Daily Note
- [ ] P04.F02.T01: Task 01: **Investigate**: Review Obsidian file modification API, understand markdown section parsing, identify duplicate detection strategies
- [ ] P04.F02.T02: Task 02: **Plan**: Design insertion interface, plan section search algorithm, define duplicate prevention logic
- [ ] P04.F02.T03: Task 03: **Test**: Write tests for meeting insertion (section exists, section missing, duplicate prevention, multiple meetings, empty section, malformed markdown)
- [ ] P04.F02.T04: Task 04: **Implement**: Create function to insert meetings under specified section with duplicate prevention
- [ ] P04.F02.T05: Task 05: **Validate**: Run all tests, verify no content corruption, run build and lint, check coverage >80%
- [ ] P04.F02.T06: Task 06: **Finalize**: Refactor insertion logic, optimize markdown parsing, document insertion behavior, commit

### P04.F03: Feature 03: Section Creation in Daily Note
- [ ] P04.F03.T01: Task 01: **Investigate**: Review markdown heading levels, understand section insertion strategies (top, bottom, after specific heading)
- [ ] P04.F03.T02: Task 02: **Plan**: Design section creation logic, plan heading level handling (H1-H6), define insertion position strategy
- [ ] P04.F03.T03: Task 03: **Test**: Write tests for section creation (various heading levels, empty note, note with existing sections, preserve existing content)
- [ ] P04.F03.T04: Task 04: **Implement**: Create section creator that adds missing sections without disrupting existing content
- [ ] P04.F03.T05: Task 05: **Validate**: Run all tests, verify content preservation, run build and lint, check coverage >80%
- [ ] P04.F03.T06: Task 06: **Finalize**: Refactor section logic, document heading conventions, commit

## P05: Phase 05: Command & UX

### P05.F01: Feature 01: Sync Command Orchestration
- [ ] P05.F01.T01: Task 01: **Investigate**: Review all calendar and note integration modules, understand async orchestration patterns, identify failure scenarios
- [ ] P05.F01.T02: Task 02: **Plan**: Design orchestration flow (parallel vs sequential), plan error aggregation, define success/failure criteria
- [ ] P05.F01.T03: Task 03: **Test**: Write tests for sync orchestration (both sources succeed, one source fails, both fail, partial success handling, timeout scenarios)
- [ ] P05.F01.T04: Task 04: **Implement**: Create main sync command that orchestrates all calendar sources with proper error handling
- [ ] P05.F01.T05: Task 05: **Validate**: Run all tests (>80% coverage), verify no data loss on partial failures, run build and lint
- [ ] P05.F01.T06: Task 06: **Finalize**: Refactor orchestration logic, optimize async operations, document flow, commit

### P05.F02: Feature 02: Command Registration
- [ ] P05.F02.T01: Task 01: **Investigate**: Review Obsidian command API, understand command ID stability requirements, research UX best practices
- [ ] P05.F02.T02: Task 02: **Plan**: Design command interface, define stable command ID, plan command palette integration
- [ ] P05.F02.T03: Task 03: **Test**: Write tests for command registration (command appears in palette, executes correctly, handles concurrent calls)
- [ ] P05.F02.T04: Task 04: **Implement**: Register sync command in main.ts with stable ID and clear user-facing name
- [ ] P05.F02.T05: Task 05: **Validate**: Run all tests, manual test command in palette, verify execution, run build and lint
- [ ] P05.F02.T06: Task 06: **Finalize**: Refactor registration code, document command usage, commit

### P05.F03: Feature 03: Comprehensive Error Handling
- [ ] P05.F03.T01: Task 01: **Investigate**: Identify all possible error scenarios across modules (file I/O, network, parsing, validation)
- [ ] P05.F03.T02: Task 02: **Plan**: Design error hierarchy, plan user-friendly error messages, define recovery strategies
- [ ] P05.F03.T03: Task 03: **Test**: Write tests for all error scenarios (file not found, network errors, parsing failures, permission denied, timeout, invalid settings)
- [ ] P05.F03.T04: Task 04: **Implement**: Implement centralized error handling with user-friendly messages and recovery logic
- [ ] P05.F03.T05: Task 05: **Validate**: Run all error tests, verify messages are clear, run build and lint, check coverage >80%
- [ ] P05.F03.T06: Task 06: **Finalize**: Refactor error handling, improve error messages, document error types, commit

### P05.F04: Feature 04: User Notifications
- [ ] P05.F04.T01: Task 01: **Investigate**: Review Obsidian Notice API, understand notification best practices (timing, content, actions)
- [ ] P05.F04.T02: Task 02: **Plan**: Design notification strategy (success, partial success, failure), plan message content and duration
- [ ] P05.F04.T03: Task 03: **Test**: Write tests for notifications (success messages, error messages, partial success, no meetings found, settings missing)
- [ ] P05.F04.T04: Task 04: **Implement**: Create notification system with appropriate messages for all states
- [ ] P05.F04.T05: Task 05: **Validate**: Run all tests, manual testing of notification UX, run build and lint
- [ ] P05.F04.T06: Task 06: **Finalize**: Refactor notification logic, improve message clarity, commit

## P06: Phase 06: Integration Testing & Validation

### P06.F01: Feature 01: End-to-End Integration Testing
- [ ] P06.F01.T01: Task 01: **Investigate**: Review all implemented features, identify critical user workflows, understand Obsidian testing environment
- [ ] P06.F01.T02: Task 02: **Plan**: Design E2E test scenarios, plan test vault setup, define success criteria for each workflow
- [ ] P06.F01.T03: Task 03: **Test**: Create E2E test suite covering full workflows (local ICS sync, Google Calendar sync, combined sync, error recovery)
- [ ] P06.F01.T04: Task 04: **Implement**: Set up test vault and automated E2E tests where possible
- [ ] P06.F01.T05: Task 05: **Validate**: Run all E2E tests, verify workflows complete successfully, run `make test`, `make build`, `make lint`
- [ ] P06.F01.T06: Task 06: **Finalize**: Document E2E test setup, commit test infrastructure

### P06.F02: Feature 02: Manual Testing & Edge Cases
- [ ] P06.F02.T01: Task 01: **Investigate**: Identify untestable scenarios requiring manual verification, list all edge cases
- [ ] P06.F02.T02: Task 02: **Plan**: Create manual test checklist, plan test data (ICS files, calendar links), define expected outcomes
- [ ] P06.F02.T03: Task 03: **Test**: Execute manual tests:
  - [ ] Local .ics file with multiple meetings for today
  - [ ] Google Calendar shareable link with various event types
  - [ ] No meetings found scenarios
  - [ ] Empty or missing sections in daily note
  - [ ] Invalid file paths and network failures
  - [ ] Settings persistence across Obsidian restarts
  - [ ] Duplicate prevention (multiple sync command executions)
  - [ ] Mobile compatibility (if applicable)
- [ ] P06.F02.T04: Task 04: **Validate**: Document test results, verify all scenarios pass, run full test suite (`make test`, `make build`, `make lint`)
- [ ] P06.F02.T05: Task 05: **Finalize**: Create test report, document any limitations or known issues, commit

## P07: Phase 07: Documentation

### P07.F01: Feature 01: User Documentation
- [ ] P07.F01.T01: Task 01: **Investigate**: Review all features, understand user setup requirements, identify privacy considerations
- [ ] P07.F01.T02: Task 02: **Plan**: Design README structure (installation, setup, usage, troubleshooting, privacy), plan examples
- [ ] P07.F01.T03: Task 03: **Test**: Review documentation for completeness, verify instructions are accurate
- [ ] P07.F01.T04: Task 04: **Implement**: Create comprehensive README.md with usage instructions and privacy disclosure
- [ ] P07.F01.T05: Task 05: **Validate**: Follow README from scratch to verify setup works, check all links and examples
- [ ] P07.F01.T06: Task 06: **Finalize**: Refine documentation based on testing, commit final README

### P07.F02: Feature 02: Plugin Metadata
- [ ] P07.F02.T01: Task 01: **Investigate**: Review manifest.json requirements for Obsidian plugin submission
- [ ] P07.F02.T02: Task 02: **Plan**: Define final version number, write clear description, set appropriate metadata
- [ ] P07.F02.T03: Task 03: **Test**: Validate manifest.json format and required fields
- [ ] P07.F02.T04: Task 04: **Implement**: Update manifest.json with final version, description, and metadata
- [ ] P07.F02.T05: Task 05: **Validate**: Verify manifest passes Obsidian's validation, test plugin loads correctly
- [ ] P07.F02.T06: Task 06: **Finalize**: Review all metadata, commit final manifest
