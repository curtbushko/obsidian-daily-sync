# Plugin Metadata Plan - P07.F02

## Current State Analysis

### manifest.json (Current)
```json
{
	"id": "obsidian-daily-sync",
	"name": "Daily Sync",
	"version": "0.1.0",
	"minAppVersion": "0.15.0",
	"description": "Import daily meetings from local .ics calendar files and Google Calendar into your daily notes.",
	"author": "curtbushko",
	"authorUrl": "https://github.com/curtbushko",
	"isDesktopOnly": false
}
```

### versions.json (Current)
```json
{
	"1.0.0": "0.15.0"
}
```

**Issue**: Version mismatch between manifest.json (0.1.0) and versions.json (1.0.0)

## Obsidian Requirements

### Required Fields ✅
- [x] `id` - Unique plugin identifier (must match in submission)
- [x] `name` - Display name in plugin list
- [x] `version` - Semantic versioning (x.y.z format only)
- [x] `minAppVersion` - Minimum Obsidian version required
- [x] `description` - Long description of plugin purpose
- [x] `author` - Author name
- [x] `isDesktopOnly` - Whether plugin uses NodeJS/Electron APIs

### Optional Fields
- [x] `authorUrl` - Author website/GitHub profile
- [ ] `fundingUrl` - Link for donations/support (optional, not required)

### Additional Requirements
- [x] LICENSE file present (0-BSD)
- [x] README.md present (comprehensive, 588 lines)
- [x] manifest.json in repository root
- [ ] manifest.json in release assets (when creating release)

## Version Number Decision

### Option 1: Keep 0.1.0 (Pre-release)
**Pros**:
- Signals this is an initial release
- Allows for breaking changes before 1.0.0
- Conservative approach

**Cons**:
- Plugin is feature-complete
- All 191 tests passing
- Documentation complete
- May imply instability

### Option 2: Use 1.0.0 (Stable) ✅ RECOMMENDED
**Pros**:
- Plugin is feature-complete per plan.md
- All planned features implemented (P01-P07)
- 191/191 tests passing (unit, integration, E2E)
- Comprehensive documentation (README, TESTING, MANUAL_TESTING)
- Error handling complete
- User notifications implemented
- Follows semantic versioning (first stable release)

**Cons**:
- None - the plugin meets all criteria for a stable release

**Decision**: Use **1.0.0** for first stable release

## Semantic Versioning Strategy

Following [Semantic Versioning 2.0.0](https://semver.org/):

- **Major (X.0.0)**: Breaking changes (incompatible API changes)
- **Minor (1.X.0)**: New features (backward-compatible)
- **Patch (1.0.X)**: Bug fixes (backward-compatible)

**First Release**: 1.0.0
- First stable release
- All core features implemented
- Backward compatibility not applicable (first version)

## Metadata Fields Plan

### Required Fields - Final Values

| Field | Current | Planned | Status | Notes |
|-------|---------|---------|--------|-------|
| `id` | obsidian-daily-sync | obsidian-daily-sync | ✅ Keep | Unique, descriptive |
| `name` | Daily Sync | Daily Sync | ✅ Keep | Clear, concise |
| `version` | 0.1.0 | 1.0.0 | ⚠️ Update | Match versions.json |
| `minAppVersion` | 0.15.0 | 0.15.0 | ✅ Keep | Conservative choice |
| `description` | [current] | [current] | ✅ Keep | Accurate, complete |
| `author` | curtbushko | curtbushko | ✅ Keep | Correct |
| `authorUrl` | [current] | [current] | ✅ Keep | Valid GitHub URL |
| `isDesktopOnly` | false | false | ✅ Keep | Works on mobile |

### Optional Fields - Decision

| Field | Current | Planned | Decision | Rationale |
|-------|---------|---------|----------|-----------|
| `fundingUrl` | (not present) | (omit) | Skip | Not required, can add later |

## versions.json Plan

**Current**:
```json
{
	"1.0.0": "0.15.0"
}
```

**Status**: ✅ Already correct!

**Format**: `{"<plugin-version>": "<min-obsidian-version>"}`

This maps plugin version 1.0.0 to minimum Obsidian version 0.15.0.

**No changes needed** - versions.json is already set up correctly for 1.0.0 release.

## minAppVersion Analysis

**Current**: "0.15.0"

**Considerations**:
- Obsidian 0.15.0 released: August 31, 2022
- Provides good backward compatibility
- Our plugin uses standard APIs available in 0.15.0+
- Daily Notes plugin (prerequisite) available in 0.15.0+

**Decision**: Keep "0.15.0" ✅

## Description Analysis

**Current**: "Import daily meetings from local .ics calendar files and Google Calendar into your daily notes."

**Character count**: 108 characters

**Evaluation**:
- ✅ Clear and concise
- ✅ Mentions both calendar sources
- ✅ Indicates destination (daily notes)
- ✅ Action-oriented ("Import")
- ✅ Under character limit (typically ~150-200 char recommended)

**Decision**: Keep current description ✅

## Implementation Plan

### Changes Required

1. **Update manifest.json**:
   - Change `version` from "0.1.0" to "1.0.0"
   - All other fields remain unchanged

2. **Verify versions.json**:
   - Already correct: `{"1.0.0": "0.15.0"}`
   - No changes needed

3. **Update package.json** (for consistency):
   - Change `version` from "0.1.0" to "1.0.0"

### Validation Checklist

- [ ] manifest.json version is "1.0.0"
- [ ] versions.json has "1.0.0": "0.15.0"
- [ ] package.json version is "1.0.0"
- [ ] All three version fields match
- [ ] README.md badge shows correct version
- [ ] `make build` succeeds
- [ ] `make test` passes (191/191)
- [ ] `make lint` passes
- [ ] manifest.json is valid JSON
- [ ] All required fields present

## Submission Preparation (Future)

When ready to submit to Obsidian Community Plugins:

### Pre-submission Checklist
- [ ] Create GitHub release with tag "1.0.0" (no "v" prefix)
- [ ] Upload release assets:
  - [ ] main.js
  - [ ] manifest.json
  - [ ] styles.css
- [ ] Ensure repository has:
  - [ ] README.md (comprehensive) ✅
  - [ ] LICENSE file ✅
  - [ ] manifest.json in root ✅
- [ ] Fork obsidianmd/obsidian-releases
- [ ] Add plugin to community-plugins.json
- [ ] Submit pull request
- [ ] Wait for review by Obsidian team

### Repository Requirements (All Met) ✅
- [x] README.md describes purpose and usage
- [x] LICENSE file (0-BSD)
- [x] manifest.json in repository root
- [x] Build produces valid main.js
- [x] No telemetry or data collection (privacy compliant)

## Quality Assurance

### Code Quality ✅
- 191 automated tests (unit, integration, E2E)
- ESLint configured and passing
- TypeScript strict mode
- Comprehensive error handling

### Documentation ✅
- User documentation (README.md - 588 lines)
- Developer documentation (TESTING.md, MANUAL_TESTING.md)
- Test report (TEST_REPORT.md)
- Inline code documentation (JSDoc comments)

### Features ✅
- All planned features implemented (P01-P07)
- Local calendar sync (.ics files)
- Google Calendar sync (shareable links)
- Duplicate prevention
- Error handling with user-friendly messages
- Visual notifications
- Customizable sections
- Mobile support

## References

- [Obsidian Submission Requirements](https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins)
- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian Manifest Reference](https://docs.obsidian.md/Reference/Manifest)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [Sample Plugin Manifest](https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/manifest.json)

## Conclusion

**Recommendation**: Update version to **1.0.0** and release as first stable version.

**Rationale**:
- Plugin is feature-complete
- All tests passing
- Documentation comprehensive
- Error handling robust
- Meets all Obsidian requirements
- Ready for community use

**Risk**: Low - the plugin has been thoroughly tested and documented.
