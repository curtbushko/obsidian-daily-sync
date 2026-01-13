# Manual Testing Guide

This document provides comprehensive manual testing procedures for the Daily Sync plugin. These tests verify functionality that cannot be fully automated, including UI interactions, real calendar integrations, and user experience validation.

## Prerequisites

Before beginning manual testing:

1. **Obsidian Installed**: Desktop version (latest stable)
2. **Daily Notes Plugin**: Enabled and configured
3. **Test Vault**: Create a dedicated test vault for testing
4. **Test Data**: Prepare test calendar files (see Test Data section)
5. **Build Plugin**: Run `make build` to create latest plugin bundle

## Test Data Preparation

### Local ICS Files

Create the following test files in your test vault:

**test-calendar-normal.ics** - Normal meetings for today
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Manual Test//EN
BEGIN:VEVENT
DTSTART:20260113T140000Z
DTEND:20260113T150000Z
UID:test-1@manual.test
SUMMARY:Morning Standup
DESCRIPTION:Daily team meeting
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T180000Z
DTEND:20260113T190000Z
UID:test-2@manual.test
SUMMARY:Project Review
DESCRIPTION:Weekly review
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113
DTEND:20260114
UID:test-3@manual.test
SUMMARY:Team Building (All Day)
END:VEVENT
END:VCALENDAR
```

**test-calendar-empty.ics** - No meetings
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Manual Test//EN
END:VCALENDAR
```

**test-calendar-special-chars.ics** - Special characters in meeting names
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Manual Test//EN
BEGIN:VEVENT
DTSTART:20260113T140000Z
DTEND:20260113T150000Z
UID:test-special@manual.test
SUMMARY:Meeting: Q&A Session (R&D) - "Urgent"
DESCRIPTION:Testing special chars: < > & " '
END:VEVENT
END:VCALENDAR
```

**test-calendar-large.ics** - Many meetings (10+ events)
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Manual Test//EN
BEGIN:VEVENT
DTSTART:20260113T080000Z
DTEND:20260113T083000Z
UID:test-1@large.test
SUMMARY:Meeting 1
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T090000Z
DTEND:20260113T093000Z
UID:test-2@large.test
SUMMARY:Meeting 2
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T100000Z
DTEND:20260113T103000Z
UID:test-3@large.test
SUMMARY:Meeting 3
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T110000Z
DTEND:20260113T113000Z
UID:test-4@large.test
SUMMARY:Meeting 4
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T130000Z
DTEND:20260113T133000Z
UID:test-5@large.test
SUMMARY:Meeting 5
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T140000Z
DTEND:20260113T143000Z
UID:test-6@large.test
SUMMARY:Meeting 6
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T150000Z
DTEND:20260113T153000Z
UID:test-7@large.test
SUMMARY:Meeting 7
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T160000Z
DTEND:20260113T163000Z
UID:test-8@large.test
SUMMARY:Meeting 8
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T170000Z
DTEND:20260113T173000Z
UID:test-9@large.test
SUMMARY:Meeting 9
END:VEVENT
BEGIN:VEVENT
DTSTART:20260113T180000Z
DTEND:20260113T183000Z
UID:test-10@large.test
SUMMARY:Meeting 10
END:VEVENT
END:VCALENDAR
```

### Google Calendar Test Link

**Option 1**: Use a real Google Calendar shareable link
1. Create a test Google Calendar
2. Add several events for today
3. Get the shareable iCal link (Settings > Integrate Calendar > Secret address in iCal format)

**Option 2**: Use a mock HTTP server (for network error testing)
- Set up a local server that returns ICS data
- Use URLs like `http://localhost:8080/calendar.ics`

## Manual Test Checklist

### MT-01: Plugin Installation & Loading

**Objective**: Verify plugin loads correctly in Obsidian

**Steps**:
1. Copy plugin files to `.obsidian/plugins/obsidian-daily-sync/`
   - `main.js`
   - `manifest.json`
   - `styles.css` (if exists)
2. Open Obsidian
3. Go to Settings > Community plugins
4. Enable "Daily Sync" plugin

**Expected Result**:
- [ ] Plugin appears in plugin list
- [ ] Plugin enables without errors
- [ ] No console errors in Developer Tools (Ctrl+Shift+I)
- [ ] Plugin settings tab appears under "Plugin Options"

**Actual Result**:
_Document your findings here_

---

### MT-02: Settings Tab UI

**Objective**: Verify settings UI renders and functions correctly

**Steps**:
1. Open Settings > Daily Sync
2. Review all settings fields:
   - Local calendar .ics file path
   - Local calendar section name
   - Google Calendar shareable link
   - Google Calendar section name
3. Enter test values in each field
4. Change values and verify they update
5. Close settings and reopen

**Expected Result**:
- [ ] All fields render correctly
- [ ] Text inputs accept input
- [ ] Field descriptions are clear
- [ ] Values persist after closing settings
- [ ] No UI layout issues
- [ ] Help text is readable

**Actual Result**:
_Document your findings here_

---

### MT-03: Command Palette Integration

**Objective**: Verify sync command appears and executes from command palette

**Steps**:
1. Press Ctrl+P (Cmd+P on Mac) to open command palette
2. Type "sync meetings"
3. Select "Daily Sync: Sync meetings to daily note"
4. Verify command executes

**Expected Result**:
- [ ] Command appears in palette
- [ ] Command name is clear and descriptive
- [ ] Command executes when selected
- [ ] Notification appears after execution

**Actual Result**:
_Document your findings here_

---

### MT-04: Local ICS - Normal Workflow

**Objective**: Test full sync workflow with local ICS file

**Prerequisites**:
- Daily Notes plugin enabled
- Today's daily note exists OR will be auto-created
- `test-calendar-normal.ics` file created

**Steps**:
1. In settings, set "Local calendar .ics file path" to path of `test-calendar-normal.ics`
   - Update the DTSTART/DTEND dates to today's date
2. Set "Local calendar section name" to "Meetings"
3. Open today's daily note
4. Run "Sync meetings to daily note" command
5. Check daily note content

**Expected Result**:
- [ ] Notification: "✓ Synced 3 meetings from local calendar" (or similar)
- [ ] Daily note contains "## Meetings" section
- [ ] Section contains all 3 meetings:
  - Morning Standup with time
  - Project Review with time
  - Team Building (All Day)
- [ ] Meeting format: "- Meeting: <name> (<time>)"
- [ ] All-day events format: "- Meeting: <name> (All day)"
- [ ] No errors in console

**Actual Result**:
_Document your findings here_

---

### MT-05: Local ICS - Empty Calendar

**Objective**: Test behavior when no meetings found

**Prerequisites**:
- `test-calendar-empty.ics` file created

**Steps**:
1. In settings, set "Local calendar .ics file path" to `test-calendar-empty.ics`
2. Run sync command

**Expected Result**:
- [ ] Notification: "No meetings found for today."
- [ ] Daily note unchanged OR section created but empty
- [ ] No errors in console

**Actual Result**:
_Document your findings here_

---

### MT-06: Local ICS - File Not Found

**Objective**: Test error handling for missing file

**Steps**:
1. In settings, set "Local calendar .ics file path" to `/nonexistent/path/calendar.ics`
2. Run sync command

**Expected Result**:
- [ ] Notification shows error: "Calendar File Not Found" or similar
- [ ] Notification suggests checking file path
- [ ] Console shows error with details
- [ ] Daily note unchanged
- [ ] No crash or unhandled exceptions

**Actual Result**:
_Document your findings here_

---

### MT-07: Local ICS - Special Characters

**Objective**: Test handling of special characters in meeting names

**Prerequisites**:
- `test-calendar-special-chars.ics` file created with today's date

**Steps**:
1. Set local calendar path to `test-calendar-special-chars.ics`
2. Run sync command
3. Check daily note

**Expected Result**:
- [ ] Meeting appears with special characters intact
- [ ] Characters display correctly: `< > & " '`
- [ ] No markdown rendering issues
- [ ] No HTML escaping visible to user

**Actual Result**:
_Document your findings here_

---

### MT-08: Local ICS - Large Calendar

**Objective**: Test performance with many meetings

**Prerequisites**:
- `test-calendar-large.ics` file created with 10+ events for today

**Steps**:
1. Set local calendar path to `test-calendar-large.ics`
2. Run sync command
3. Measure time to completion (approximate)
4. Check daily note

**Expected Result**:
- [ ] Sync completes in < 2 seconds
- [ ] All meetings appear in daily note
- [ ] Notification shows correct count (e.g., "10 meetings")
- [ ] No performance degradation
- [ ] No UI freezing

**Actual Result**:
_Time to complete: ___
_Document your findings here_

---

### MT-09: Google Calendar - Normal Workflow

**Objective**: Test sync with real Google Calendar link

**Prerequisites**:
- Google Calendar with 2-3 events for today
- Shareable iCal link obtained

**Steps**:
1. In settings, set "Google Calendar shareable link" to your test calendar iCal URL
2. Set "Google Calendar section name" to "Google Meetings"
3. Run sync command
4. Check daily note

**Expected Result**:
- [ ] Notification: "✓ Synced X meetings from Google Calendar"
- [ ] Daily note contains "## Google Meetings" section
- [ ] All Google Calendar events for today appear
- [ ] Times are correct (accounting for timezone)
- [ ] All-day events marked as "All day"

**Actual Result**:
_Document your findings here_

---

### MT-10: Google Calendar - Network Error

**Objective**: Test error handling for network failures

**Steps**:
1. Set Google Calendar link to invalid URL: `https://invalid.example.com/calendar.ics`
2. Run sync command

**Expected Result**:
- [ ] Notification shows error related to network/fetch failure
- [ ] Error message suggests checking URL or network connection
- [ ] Console shows detailed error
- [ ] No crash

**Actual Result**:
_Document your findings here_

---

### MT-11: Combined Sources - Both Succeed

**Objective**: Test sync from both local ICS and Google Calendar

**Prerequisites**:
- Local ICS file with 2 meetings
- Google Calendar with 2 meetings
- Both configured in settings

**Steps**:
1. Configure both local and Google calendar sources
2. Set different section names (e.g., "Local Meetings" and "Google Meetings")
3. Run sync command
4. Check daily note

**Expected Result**:
- [ ] Notification: "✓ Synced 4 meetings to daily note" (total count)
- [ ] Daily note has both sections:
  - ## Local Meetings (2 meetings)
  - ## Google Meetings (2 meetings)
- [ ] All meetings appear in correct sections
- [ ] No cross-contamination between sections

**Actual Result**:
_Document your findings here_

---

### MT-12: Combined Sources - Partial Failure

**Objective**: Test behavior when one source fails

**Steps**:
1. Configure valid local ICS file
2. Configure invalid Google Calendar URL
3. Run sync command

**Expected Result**:
- [ ] Notification shows partial success: "✓ Synced 2 meetings from local calendar. Google Calendar failed."
- [ ] Local meetings appear in daily note
- [ ] Google Calendar section not created OR empty
- [ ] Error details in console

**Actual Result**:
_Document your findings here_

---

### MT-13: Duplicate Prevention

**Objective**: Test that running sync multiple times doesn't duplicate meetings

**Steps**:
1. Configure local ICS with 3 meetings
2. Run sync command
3. Note the daily note content
4. Run sync command again (without changing calendar)
5. Run sync command a third time

**Expected Result**:
- [ ] First sync: 3 meetings added
- [ ] Second sync: No new meetings added
- [ ] Third sync: No new meetings added
- [ ] Daily note content identical after each subsequent sync
- [ ] Each meeting appears exactly once

**Actual Result**:
_Document your findings here_

---

### MT-14: Section Creation

**Objective**: Test section creation in various daily note states

**Test Cases**:

**A. Empty Daily Note**
1. Create empty daily note (just title or completely empty)
2. Run sync
3. Expected: Section created, meetings added

**B. Daily Note with Other Sections**
1. Create daily note with:
   ```
   # Daily Note

   ## Tasks
   - Task 1

   ## Notes
   Some notes here
   ```
2. Run sync
3. Expected: Meetings section added without disrupting existing sections

**C. Daily Note with Existing Meetings Section**
1. Create daily note with:
   ```
   # Daily Note

   ## Meetings
   - Manual meeting entry
   ```
2. Run sync
3. Expected: New meetings appended, manual entry preserved

**Expected Result**:
- [ ] Case A: Section created in empty note
- [ ] Case B: Section added without disrupting content
- [ ] Case C: Existing content preserved
- [ ] No content loss in any case

**Actual Result**:
_Document your findings for each case_

---

### MT-15: Settings Persistence

**Objective**: Verify settings persist across Obsidian restarts

**Steps**:
1. Configure all settings with test values:
   - Local ICS path: `/path/to/test.ics`
   - Local section: "Work Calendar"
   - Google link: `https://example.com/calendar`
   - Google section: "Personal Calendar"
2. Close Obsidian completely
3. Reopen Obsidian
4. Open plugin settings

**Expected Result**:
- [ ] All settings values preserved exactly as entered
- [ ] No values reset to defaults
- [ ] Settings load immediately (no delay)

**Actual Result**:
_Document your findings here_

---

### MT-16: Daily Note Plugin Integration

**Objective**: Test integration with Daily Notes plugin

**Prerequisites**:
- Daily Notes plugin enabled
- Daily Notes configured with custom:
  - Date format
  - Note location
  - Template

**Steps**:
1. Configure Daily Notes with custom settings
2. Create today's daily note using Daily Notes plugin
3. Run Daily Sync command
4. Check that meetings are added correctly

**Expected Result**:
- [ ] Daily Sync finds note created by Daily Notes plugin
- [ ] Meetings added to correct note
- [ ] Daily Notes template preserved
- [ ] No conflicts between plugins

**Actual Result**:
_Document your findings here_

---

### MT-17: Timezone Handling

**Objective**: Verify timezone handling for events

**Prerequisites**:
- ICS file with events in different timezones
- System timezone set to known value

**Steps**:
1. Create ICS file with event in UTC:
   - DTSTART:20260113T140000Z (9:00 AM EST / 2:00 PM UTC)
2. Run sync
3. Check displayed time in daily note

**Expected Result**:
- [ ] Time converted to local timezone
- [ ] Time displayed in 12-hour format with AM/PM
- [ ] Time matches expected local time

**Actual Result**:
_Local timezone: ___
_Expected time: ___
_Displayed time: ___

---

### MT-18: Notification UX

**Objective**: Evaluate notification clarity and timing

**Steps**:
1. Test each notification scenario:
   - Success (both sources)
   - Success (local only)
   - Success (Google only)
   - No meetings found
   - Partial failure
   - Complete failure
2. Observe notification duration and readability

**Expected Result**:
- [ ] Success notifications: 4 seconds duration
- [ ] Partial failure: 6 seconds duration
- [ ] Complete failure: 8 seconds duration
- [ ] All messages clear and actionable
- [ ] Emoji usage appropriate (✓ for success)
- [ ] No technical jargon in user-facing messages

**Actual Result**:
_Document clarity and timing of each notification type_

---

### MT-19: Error Message Clarity

**Objective**: Test that error messages are helpful

**Test Error Scenarios**:
1. File not found
2. Invalid file path
3. Malformed ICS file
4. Network error
5. Invalid URL
6. Daily Notes plugin not enabled

**Expected Result**:
- [ ] Each error has clear, user-friendly message
- [ ] Errors include actionable suggestions
- [ ] Technical details available in console
- [ ] No confusing error codes or stack traces shown to user

**Actual Result**:
_Document each error message and its clarity_

---

### MT-20: Mobile Compatibility (Optional)

**Objective**: Test plugin on Obsidian Mobile

**Prerequisites**:
- Obsidian Mobile installed (iOS or Android)
- Plugin transferred to mobile vault

**Steps**:
1. Enable plugin on mobile
2. Configure settings
3. Run sync command
4. Test with local ICS file (if accessible on mobile)

**Expected Result**:
- [ ] Plugin loads on mobile
- [ ] Settings UI renders correctly
- [ ] Command executes successfully
- [ ] Notifications appear correctly
- [ ] No mobile-specific crashes

**Actual Result**:
_Mobile platform: ___
_Document your findings here_

**Note**: Google Calendar sync expected to work. Local ICS may have file access limitations on mobile.

---

## Edge Cases Documentation

### Known Edge Cases

1. **Very Long Meeting Names**
   - Meetings with 100+ character names
   - Expected: Text wraps or truncates gracefully

2. **Unicode Characters**
   - Meetings with emoji: "🎉 Team Party"
   - Meetings with non-Latin scripts: "会议"
   - Expected: Characters display correctly

3. **Concurrent Sync Executions**
   - User triggers sync multiple times rapidly
   - Expected: Graceful handling, no data corruption

4. **Daily Note Locked/Read-Only**
   - Daily note file is read-only
   - Expected: Clear error message about file permissions

5. **Calendar with Past Events Only**
   - ICS file with only past events
   - Expected: "No meetings found for today"

6. **Malformed ICS Data**
   - ICS file missing END:VCALENDAR
   - ICS file with invalid date formats
   - Expected: Parse error with helpful message

7. **Network Timeout**
   - Google Calendar fetch takes > 30 seconds
   - Expected: Timeout error with suggestion to retry

8. **Leap Year / DST Boundaries**
   - Events on date when DST changes
   - Events on Feb 29 (leap year)
   - Expected: Correct date filtering

## Test Results Summary

After completing all tests, fill out this summary:

**Test Date**: ___________
**Obsidian Version**: ___________
**Plugin Version**: ___________
**Operating System**: ___________
**Tests Passed**: ___ / 20
**Tests Failed**: ___
**Tests Skipped**: ___

### Critical Issues Found
_List any critical bugs that prevent core functionality_

### Minor Issues Found
_List any minor bugs or UX improvements needed_

### Recommendations
_Suggest any improvements or additional testing needed_

### Known Limitations
_Document any expected limitations of the plugin_

---

## Appendix: Quick Test Data

For quick smoke testing, use this minimal test calendar:

**quick-test.ics**
```ics
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260113T150000Z
DTEND:20260113T160000Z
UID:quick@test
SUMMARY:Quick Test Meeting
END:VEVENT
END:VCALENDAR
```

Update DTSTART/DTEND to today's date, configure in settings, and run sync. Should see 1 meeting added to daily note.
