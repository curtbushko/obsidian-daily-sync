# Daily Sync

> Import your daily meetings from local calendar files and Google Calendar into your Obsidian daily notes automatically.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/curtbushko/obsidian-daily-sync/releases)
[![License](https://img.shields.io/badge/license-0--BSD-green.svg)](LICENSE)

## Features

- 📅 **Sync from Local Calendars** - Import meetings from `.ics` calendar files on your computer
- 🌐 **Sync from Google Calendar** - Import meetings from Google Calendar shareable links
- 🔄 **Automatic Duplicate Prevention** - Run sync multiple times without duplicating entries
- 📝 **Customizable Sections** - Choose where meetings appear in your daily notes
- 🕒 **Smart Time Formatting** - Displays meeting times in 12-hour format with AM/PM
- 🎯 **Today Only** - Automatically filters to show only today's meetings
- ✅ **Error Handling** - Clear, actionable error messages when something goes wrong
- 📱 **Mobile Support** - Works on both desktop and mobile Obsidian

## Installation

### From Obsidian Community Plugins (Recommended)

> **Note**: This plugin is not yet published to the Community Plugins directory. Follow manual installation below for now.

1. Open Obsidian Settings
2. Go to **Community plugins**
3. Click **Browse** and search for "Daily Sync"
4. Click **Install**
5. Enable the plugin

### Manual Installation

For testing or development:

1. Download the latest release from [GitHub Releases](https://github.com/curtbushko/obsidian-daily-sync/releases)
2. Extract the files to your vault: `VaultFolder/.obsidian/plugins/obsidian-daily-sync/`
3. Ensure you have these files in the plugin folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`
4. Reload Obsidian (or restart)
5. Go to Settings → Community plugins
6. Enable "Daily Sync"

## Prerequisites

**Required**: [Daily Notes](https://help.obsidian.md/Plugins/Daily+notes) core plugin must be enabled.

The Daily Sync plugin works with Obsidian's Daily Notes plugin to find or create today's note.

## Quick Start

Get started in 5 minutes:

### 1. Enable Daily Notes Plugin

If you haven't already:
- Open Settings → Core plugins
- Enable "Daily notes"
- Configure your daily note preferences (date format, folder location, template)

### 2. Configure Daily Sync

Open Settings → Daily Sync and configure at least one calendar source:

**For Local Calendar**:
- Set "Ics file path" to your calendar file location (e.g., `/Users/you/calendars/work.ics`)
- Set "Section name for local calendar" (default: "Meetings")

**For Google Calendar**:
- Set "Shareable link" to your Google Calendar iCal URL
- Set "Section name" (default: "Meetings")

### 3. Run Your First Sync

1. Open (or create) today's daily note
2. Press `Ctrl+P` (or `Cmd+P` on Mac) to open the Command Palette
3. Type "sync meetings" and select **"Daily Sync: Sync meetings to daily note"**
4. Your meetings will appear in the configured section!

## Configuration

### Settings Overview

| Setting | Description | Example |
|---------|-------------|---------|
| **Local Calendar → Ics file path** | Full path to your `.ics` calendar file | `/home/user/calendar.ics` |
| **Local Calendar → Section name** | Where local meetings appear in daily note | `Work Calendar` |
| **Google Calendar → Shareable link** | Public iCal URL from Google Calendar | `https://calendar.google.com/calendar/ical/...` |
| **Google Calendar → Section name** | Where Google meetings appear in daily note | `Personal Calendar` |

### Local Calendar Setup

**Finding Your .ics File**:

Most calendar applications can export to `.ics` format:

- **macOS Calendar**: File → Export → Export... → Save as `.ics`
- **Outlook**: File → Save Calendar → iCalendar Format (`.ics`)
- **Thunderbird**: Right-click calendar → Export Calendar...

**Path Examples**:
- Windows: `C:\Users\YourName\Documents\calendar.ics`
- macOS: `/Users/YourName/Documents/calendar.ics`
- Linux: `/home/username/Documents/calendar.ics`

**Tips**:
- Use absolute paths (full path from root)
- Ensure the file is readable by Obsidian
- Keep the calendar file updated (sync with your calendar app regularly)

### Google Calendar Setup

**Getting Your Shareable Link**:

1. Open [Google Calendar](https://calendar.google.com/)
2. Find your calendar in the left sidebar
3. Click the three dots (⋮) next to the calendar name
4. Select **Settings and sharing**
5. Scroll to **Integrate calendar**
6. Copy the **Secret address in iCal format** URL

**URL Format**:
```
https://calendar.google.com/calendar/ical/[your-calendar-id]/public/basic.ics
```

**Privacy Note**:
- The iCal link provides read-only access to your calendar
- Anyone with the link can view your calendar events
- Use the "Secret address" (not "Public address") for better privacy
- The link is stored only in your local vault settings
- Revoke access anytime from Google Calendar settings

**Tips**:
- Test the link in a browser first - it should download an `.ics` file
- For personal calendars, use the "Secret address" not "Public URL"
- You can sync multiple calendars by creating separate Google Calendar shareable links

## Usage

### Running Sync Command

**Via Command Palette** (Recommended):
1. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
2. Type "sync meetings"
3. Select "Daily Sync: Sync meetings to daily note"

The plugin will:
1. Find (or create) today's daily note
2. Fetch meetings from configured calendar sources
3. Filter to today's meetings only
4. Create sections if they don't exist
5. Add meetings to the daily note
6. Show a success notification

### Understanding Notifications

You'll see different notifications based on the sync result:

- ✅ **"Synced 3 meetings to daily note"** - Success! Meetings were added
- ℹ️ **"No meetings found for today"** - Sync completed but no meetings matched today's date
- ⚠️ **"Synced 2 meetings from local calendar. Google Calendar failed."** - Partial success
- ❌ **"Sync failed: Calendar File Not Found"** - Error occurred, check settings

### Meeting Format

Meetings appear in your daily note like this:

```markdown
## Meetings

- Meeting: Morning Standup (9:00 AM)
- Meeting: Project Review (2:30 PM)
- Meeting: Team Building (All day)
```

**Format Details**:
- Time-based meetings: `Meeting: <name> (<time>)`
- All-day events: `Meeting: <name> (All day)`
- Times displayed in 12-hour format (AM/PM)
- Times converted to your local timezone
- Sorted by time (earliest first)

## Examples

### Example 1: Local Calendar Only

**Settings**:
```
Local Calendar:
  Ics file path: /Users/alex/work-calendar.ics
  Section name: Work Schedule

Google Calendar:
  Shareable link: (empty)
```

**Daily Note Output**:
```markdown
# 2024-01-15

## Work Schedule

- Meeting: Team Standup (9:00 AM)
- Meeting: Client Call (11:30 AM)
- Meeting: Sprint Planning (2:00 PM)

## Notes
...
```

### Example 2: Google Calendar Only

**Settings**:
```
Local Calendar:
  Ics file path: (empty)

Google Calendar:
  Shareable link: https://calendar.google.com/calendar/ical/.../basic.ics
  Section name: Personal
```

**Daily Note Output**:
```markdown
# 2024-01-15

## Personal

- Meeting: Dentist Appointment (10:00 AM)
- Meeting: Lunch with Sarah (12:30 PM)

## Notes
...
```

### Example 3: Multiple Sources

**Settings**:
```
Local Calendar:
  Ics file path: /Users/alex/work.ics
  Section name: Work Calendar

Google Calendar:
  Shareable link: https://calendar.google.com/calendar/ical/.../basic.ics
  Section name: Personal Calendar
```

**Daily Note Output**:
```markdown
# 2024-01-15

## Work Calendar

- Meeting: Team Standup (9:00 AM)
- Meeting: Sprint Planning (2:00 PM)

## Personal Calendar

- Meeting: Dentist Appointment (10:00 AM)
- Meeting: Gym Class (6:00 PM)

## Notes
...
```

## Features & Details

### Duplicate Prevention

Run the sync command as many times as you want - meetings won't be duplicated!

**How it works**:
- The plugin checks if a meeting already exists in the section
- Matches based on meeting name and time
- Only adds new meetings that aren't already present
- Safe to run multiple times per day

**Note**: Manual edits to meeting entries may prevent duplicate detection if you change the format.

### Date Filtering

Only meetings scheduled for **today** are synced.

- Past meetings: Not included
- Future meetings: Not included
- Today's meetings: Included (based on start date)
- All-day events: Included if they overlap today

### Section Creation

If the specified section doesn't exist in your daily note, it will be created automatically.

**Behavior**:
- Creates level 2 heading: `## Section Name`
- Preserves all existing content in the note
- Appends new section at the end if note has content
- Works with templates from Daily Notes plugin

### Timezone Handling

Meeting times are converted to your local system timezone automatically.

**Example**: Event stored as `14:00 UTC` displays as `9:00 AM EST` (if you're in Eastern Time)

### All-Day Events

All-day events are marked with `(All day)` instead of a time:

```markdown
- Meeting: Company Holiday (All day)
- Meeting: Conference (All day)
```

**Note**: All-day events in `.ics` files span calendar days (00:00 to 00:00), so they may appear on the "wrong" day depending on your timezone.

## Troubleshooting

### "Calendar File Not Found"

**Problem**: The local `.ics` file path is incorrect or the file doesn't exist.

**Solutions**:
- Check the file path in settings is correct (copy-paste the full path)
- Ensure the file exists at that location
- Check file permissions (Obsidian must have read access)
- Try using absolute paths, not relative paths
- On Windows, use forward slashes: `C:/Users/Name/calendar.ics`

### "Google Calendar Failed" or Network Errors

**Problem**: Cannot fetch Google Calendar data.

**Solutions**:
- Verify the shareable link is correct (test it in a browser - should download `.ics`)
- Check your internet connection
- Ensure the link is the "iCal format" URL (ends with `.ics`)
- Try regenerating the shareable link in Google Calendar
- Check if you're behind a firewall or proxy

### No Meetings Appear

**Possible causes**:

1. **No meetings today**: The sync only shows today's meetings
   - Check your calendar has events for today
   - All-day events may be on wrong date due to timezone

2. **Wrong calendar source**:
   - Verify the `.ics` file or Google Calendar link is correct
   - Test opening the calendar in another app

3. **Sync didn't run**:
   - Check for error notifications
   - Open Developer Console (`Ctrl+Shift+I`) and look for errors

4. **Daily Notes plugin disabled**:
   - Enable Daily Notes core plugin
   - Create today's daily note first

### Duplicate Meetings After Sync

This shouldn't happen, but if it does:

**Possible causes**:
- You manually edited meeting entries (changed the format)
- Meeting time changed in calendar between syncs

**Solution**:
- Manually remove duplicates
- Keep meeting format consistent: `- Meeting: Name (Time)`
- Don't edit synced meeting entries

### Wrong Timezone

**Problem**: Meeting times don't match your local time.

**Solutions**:
- Check your system timezone is set correctly
- Verify the calendar source has correct timezone data
- For `.ics` files, ensure events have timezone information

### Permission Denied Errors

**Problem**: Cannot read `.ics` file.

**Solutions**:
- Check file permissions (should be readable by your user)
- On macOS/Linux: `chmod 644 /path/to/calendar.ics`
- Try moving the file to your Obsidian vault folder
- Ensure no other app has locked the file

### Daily Notes Plugin Not Enabled

**Error**: "Daily Notes plugin is not enabled"

**Solution**:
1. Go to Settings → Core plugins
2. Enable "Daily notes"
3. Try syncing again

## Privacy & Data

### What Data is Stored

**Local Storage Only**:
- Your plugin settings (file paths, URLs, section names)
- Settings are stored in `.obsidian/plugins/obsidian-daily-sync/data.json`
- No data leaves your device except when fetching Google Calendar

### What Data is Transmitted

**Google Calendar Sync**:
- When you run sync with Google Calendar configured, the plugin fetches your calendar data via HTTPS
- The shareable link is sent to Google's servers to retrieve the iCal data
- Downloaded calendar data is parsed and immediately added to your daily note
- No calendar data is stored persistently or sent anywhere else

**Local Calendar**:
- Local `.ics` files are read directly from your file system
- No network requests are made for local calendars

### No Telemetry or Tracking

This plugin does **not**:
- Track your usage
- Send analytics data
- Phone home
- Store data on remote servers
- Share your calendar data with anyone

### Security Best Practices

1. **Protect Your Google Calendar Link**: The "Secret address" provides read access to your calendar
2. **Local Vault**: Keep your Obsidian vault secure (it contains the shareable link)
3. **Revoke Access**: If your shareable link is compromised, regenerate it in Google Calendar settings
4. **Review Permissions**: Only share the minimum calendar (not your entire Google Calendar)

## Limitations & Known Issues

### Current Limitations

1. **Today Only**: The plugin only syncs meetings for the current day
   - No support for past or future dates yet
   - No "sync this week" or "sync next week" functionality

2. **One-Way Sync**: Changes in your daily note don't sync back to calendars
   - Editing a meeting in Obsidian won't update your calendar
   - Deletions in the daily note don't remove calendar events

3. **Recurring Events**: Only shows occurrences explicitly in the `.ics` file
   - If your `.ics` file doesn't expand recurring events, they won't appear
   - Some calendar apps only export a single occurrence

4. **Duplicate Detection**: Based on exact matching
   - Changing meeting name or time in calendar won't update the entry
   - Results in old and new entries both present
   - Manual cleanup required

5. **Section Format**: Creates level 2 Markdown headings (`##`)
   - Assumes standard Markdown format
   - May not work with highly customized note formats

6. **All-Day Event Dates**: May appear on unexpected dates
   - Due to timezone handling (all-day events span 00:00 to 00:00 UTC)
   - Events might appear one day early or late depending on your timezone

### Future Enhancements

Potential features for future versions:

- Sync for specific date ranges (next 7 days, this week, etc.)
- Update existing meetings when calendar changes
- Configurable meeting format/template
- Filtering by calendar/category
- Sync on daily note creation (automatic mode)
- Support for more calendar sources

## Development

### Building from Source

Requirements:
- Node.js 16+ (`node --version`)
- npm or yarn

**Build Steps**:

```bash
# Clone the repository
git clone https://github.com/curtbushko/obsidian-daily-sync.git
cd obsidian-daily-sync

# Install dependencies
make install

# Run tests
make test

# Build the plugin
make build

# Development mode (watch for changes)
make dev
```

**Output**: Built files will be in the root directory:
- `main.js` - Plugin code
- `styles.css` - Styles (if any)
- `manifest.json` - Plugin metadata

### Running Tests

```bash
# Run all tests
make test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linter
make lint
```

**Test Suite**: 191 automated tests
- Unit tests
- Integration tests
- End-to-end tests

See [docs/TESTING.md](docs/TESTING.md) for detailed testing documentation.

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `make test && make lint` to verify
6. Submit a pull request

**Development Guidelines**:
- Follow existing code style
- Write tests for new features
- Update documentation
- Keep commits focused and descriptive

## License

This project is licensed under the [0-BSD License](LICENSE) - a very permissive license that allows you to do almost anything with the code.

**Summary**: You can use, modify, and distribute this code freely without restriction.

## Credits

**Author**: [curtbushko](https://github.com/curtbushko)

**Dependencies**:
- [node-ical](https://github.com/jens-maus/node-ical) - ICS file parsing
- [Obsidian API](https://github.com/obsidianmd/obsidian-api) - Plugin framework

## Support

### Getting Help

- **Bug Reports**: [GitHub Issues](https://github.com/curtbushko/obsidian-daily-sync/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/curtbushko/obsidian-daily-sync/issues)
- **Questions**: [GitHub Discussions](https://github.com/curtbushko/obsidian-daily-sync/discussions)

### Reporting Issues

When reporting a bug, please include:
1. Obsidian version
2. Plugin version
3. Operating system
4. Steps to reproduce
5. Expected vs actual behavior
6. Console errors (if any - press `Ctrl+Shift+I` to view)

---

**Made with ❤️ for the Obsidian community**
