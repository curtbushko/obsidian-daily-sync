# Manual Test Checklist - Quick Reference

This is a quick reference checklist for manual testing. For detailed test procedures, see [MANUAL_TESTING.md](./MANUAL_TESTING.md).

**Test Date**: ___________
**Tester**: ___________
**Plugin Version**: ___________
**Obsidian Version**: ___________
**OS**: ___________

## Pre-Test Setup

- [ ] Build plugin: `make build`
- [ ] Copy plugin to test vault: `.obsidian/plugins/obsidian-daily-sync/`
- [ ] Daily Notes plugin enabled
- [ ] Test calendar files created (see MANUAL_TESTING.md)
- [ ] Developer console open (Ctrl+Shift+I) for error monitoring

## Core Functionality Tests

### Installation & Configuration
- [ ] **MT-01**: Plugin loads without errors
- [ ] **MT-02**: Settings tab renders correctly
- [ ] **MT-02**: Settings persist after close/reopen
- [ ] **MT-03**: Command appears in command palette

### Local ICS Calendar
- [ ] **MT-04**: Normal workflow (3 meetings sync correctly)
- [ ] **MT-05**: Empty calendar (no meetings message)
- [ ] **MT-06**: File not found (error handled gracefully)
- [ ] **MT-07**: Special characters display correctly
- [ ] **MT-08**: Large calendar (10+ meetings, < 2sec)

### Google Calendar
- [ ] **MT-09**: Real Google Calendar syncs correctly
- [ ] **MT-10**: Network error handled gracefully
- [ ] **MT-10**: Invalid URL shows helpful error

### Combined Sources
- [ ] **MT-11**: Both sources sync to separate sections
- [ ] **MT-12**: Partial failure (one source succeeds)

### Data Integrity
- [ ] **MT-13**: Duplicate prevention (3 runs, no duplicates)
- [ ] **MT-14A**: Section created in empty note
- [ ] **MT-14B**: Section added without disrupting content
- [ ] **MT-14C**: Existing manual entries preserved

### Integration & Persistence
- [ ] **MT-15**: Settings persist across Obsidian restart
- [ ] **MT-16**: Works with Daily Notes plugin
- [ ] **MT-17**: Timezone conversion correct

### User Experience
- [ ] **MT-18**: Success notifications (4s, clear message)
- [ ] **MT-18**: Partial failure notifications (6s, informative)
- [ ] **MT-18**: Complete failure notifications (8s, actionable)
- [ ] **MT-19**: All error messages are user-friendly
- [ ] **MT-19**: Errors include helpful suggestions

### Optional
- [ ] **MT-20**: Mobile compatibility (iOS/Android)

## Edge Cases to Verify

- [ ] Very long meeting names (100+ chars)
- [ ] Unicode/emoji in meeting names
- [ ] Concurrent sync executions
- [ ] All-day events formatted correctly
- [ ] Time display (12-hour format with AM/PM)
- [ ] Multiple meetings at same time
- [ ] Meeting name with markdown characters (*, -, #)

## Critical Issues Found

Issue #1:
- **Severity**: Critical / Major / Minor
- **Description**:
- **Steps to Reproduce**:
- **Expected**:
- **Actual**:

Issue #2:
- **Severity**: Critical / Major / Minor
- **Description**:
- **Steps to Reproduce**:
- **Expected**:
- **Actual**:

_Add more as needed_

## Minor Issues / Improvements

1.
2.
3.

## Test Summary

**Total Tests**: 28
**Passed**: ___
**Failed**: ___
**Skipped**: ___
**Pass Rate**: ___%

**Overall Assessment**: ☐ Ready for Release  ☐ Needs Fixes  ☐ Major Issues

**Sign-off**: ___________  **Date**: ___________

---

## Quick Smoke Test (5 minutes)

For rapid verification after changes:

1. [ ] Enable plugin
2. [ ] Configure local ICS file path (use quick-test.ics from MANUAL_TESTING.md)
3. [ ] Update dates in ICS to today
4. [ ] Run "Sync meetings to daily note"
5. [ ] Verify:
   - Success notification appears
   - Meeting appears in daily note under "## Meetings"
   - No console errors
   - Running sync again doesn't duplicate meeting

**Smoke Test Result**: ☐ Pass  ☐ Fail

**Notes**:
