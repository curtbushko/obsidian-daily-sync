# README.md Structure Outline

## Planned Sections

### 1. Header & Description
- Plugin name with badge/version
- One-sentence description
- Features list (bullet points)
- Screenshot/demo GIF (optional, can add later)

### 2. Installation
- From Obsidian Community Plugins (when published)
- Manual installation (for testing/development)
- Prerequisites (Daily Notes plugin)

### 3. Quick Start
- 5-minute setup guide
- Minimal configuration to get started
- First sync execution

### 4. Configuration
- Settings overview with all 4 options explained
- Local calendar configuration
  - How to find .ics file path
  - Section name customization
- Google Calendar configuration
  - How to get shareable link
  - Privacy considerations
  - Section name customization

### 5. Usage
- Running sync command (Command Palette)
- What happens during sync
- Understanding notifications
- Daily note format/output

### 6. Examples
- Example: Local ICS only
- Example: Google Calendar only
- Example: Both sources with different sections
- Example daily note output

### 7. Features & Details
- Duplicate prevention
- Date filtering (today only)
- Section creation
- All-day event handling
- Timezone handling
- Error handling

### 8. Troubleshooting
- Common issues:
  - File not found
  - Google Calendar link not working
  - No meetings appear
  - Daily Notes plugin not enabled
  - Wrong timezone
  - Permissions errors
- How to check console for errors

### 9. Privacy & Data
- What data is stored (settings only, local to vault)
- What data is transmitted (Google Calendar fetch only when sync runs)
- No telemetry or tracking
- Calendar data stays in your vault

### 10. Limitations & Known Issues
- Only syncs today's meetings (no past/future)
- Duplicate detection based on exact match
- Recurring events must be in ICS file
- All-day events may span dates due to timezone
- Manual edits not synced back to calendar

### 11. Development
- Building from source
- Running tests
- Contributing guidelines (reference CONTRIBUTING.md if we create one)

### 12. License & Credits
- 0-BSD License
- Dependencies acknowledgment
- Author information

### 13. Support
- GitHub issues for bug reports
- Feature requests
- Questions/discussions

## Key Writing Guidelines

1. **Clear and Concise**: Short sentences, active voice
2. **User-Focused**: Speak to "you" not "the user"
3. **Examples First**: Show, then explain
4. **Visual Hierarchy**: Use headings, lists, code blocks
5. **Actionable**: Every section should help user accomplish something
6. **No Jargon**: Explain technical terms
7. **Error Prevention**: Warn about common mistakes

## Content Requirements

### Must Include:
- [x] Installation steps
- [x] Configuration for both calendar types
- [x] Privacy disclosure (Google Calendar)
- [x] Troubleshooting common issues
- [x] Meeting format examples
- [x] License information

### Should Include:
- [ ] Screenshot or demo GIF (can add later)
- [ ] Video tutorial link (can add later)
- [ ] FAQ section (can expand over time)

### Nice to Have:
- [ ] Changelog link
- [ ] Roadmap/future features
- [ ] Comparison with similar plugins

## Tone & Style

- **Friendly but professional**
- **Helpful, not condescending**
- **Practical examples**
- **Acknowledge limitations honestly**

## Length Target

- Aim for 500-800 lines
- Comprehensive but skimmable
- Use collapsible sections for optional details (if needed)
