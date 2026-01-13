# Testing Documentation

This document provides an overview of the testing strategy for the Daily Sync plugin.

## Test Coverage Overview

The plugin employs a comprehensive testing strategy with multiple layers:

1. **Unit Tests** (161 tests) - Test individual functions and modules in isolation
2. **Integration Tests** (14 tests) - Test interactions between modules
3. **End-to-End Tests** (16 tests) - Test complete user workflows with minimal mocking
4. **Manual Tests** (20 test cases) - Verify functionality in real Obsidian environment

**Total Automated Tests**: 191 tests
**Test Framework**: Vitest
**Coverage Target**: >80%

## Running Automated Tests

### Quick Test Run
```bash
make test
```

### Development Mode (Watch)
```bash
make dev
```

### Build Verification
```bash
make build && make lint
```

## Test Organization

### Unit Tests

Located in `src/**/__tests__/` directories:

- `calendar/__tests__/` - ICS parser, Google Calendar fetcher, meeting filter
- `daily-note/__tests__/` - Daily note finder, section creator, meeting inserter
- `sync/__tests__/` - Sync orchestrator
- `errors/__tests__/` - Error handler
- `notifications/__tests__/` - Notification handler
- `settings/__tests__/` - Settings tab
- `__tests__/main.test.ts` - Plugin lifecycle
- `__tests__/framework.test.ts` - Testing framework verification

### Integration Tests

Tests that verify multiple modules working together:

- `google-calendar-integration.test.ts` - Fetcher + Parser integration

### End-to-End Tests

Located in `src/__tests__/e2e.test.ts`:

- Full sync workflow (local ICS → daily note)
- Duplicate prevention
- Error scenarios
- Combined sources
- Section handling
- Date filtering
- Real ICS file parsing

Uses test fixtures from `src/__tests__/fixtures/`:
- `sample-calendar.ics` - Realistic calendar data for E2E testing

## Manual Testing

Manual tests verify functionality that cannot be fully automated:

- **Real Obsidian Environment**: UI interactions, plugin loading, settings persistence
- **External Services**: Actual Google Calendar integration, network scenarios
- **User Experience**: Notification timing, error message clarity, workflow usability
- **Platform-Specific**: Desktop/mobile compatibility, different OS behavior

### How to Execute Manual Tests

1. **Build the plugin**:
   ```bash
   make build
   ```

2. **Follow the manual test guide**:
   - See [../MANUAL_TESTING.md](../MANUAL_TESTING.md) for detailed procedures
   - Use [../MANUAL_TEST_CHECKLIST.md](../MANUAL_TEST_CHECKLIST.md) for quick reference

3. **Required for manual testing**:
   - Obsidian desktop application (latest stable version)
   - Daily Notes plugin enabled
   - Test vault (create a dedicated vault for testing)
   - Test data (ICS files provided in manual testing guide)

4. **Test execution**:
   - Follow each test case in MANUAL_TESTING.md
   - Document results in MANUAL_TEST_CHECKLIST.md
   - Report any issues found

### When to Run Manual Tests

Manual tests should be executed:

- [ ] Before each release
- [ ] After significant UI changes
- [ ] After changes to error handling or notifications
- [ ] When adding new features
- [ ] When testing mobile compatibility
- [ ] After Obsidian API changes

## Test Data

### Automated Test Mocks

The test suite uses comprehensive mocks:

- **Obsidian API**: `src/__mocks__/obsidian.ts`
  - App, Vault, Plugin, Notice, TFile
  - requestUrl for network mocking
- **Daily Notes Interface**: `src/__mocks__/obsidian-daily-notes-interface.ts`
  - Daily notes plugin state
  - Date-to-file mapping

### Manual Test Data

See [../MANUAL_TESTING.md](../MANUAL_TESTING.md) for:
- Sample ICS files (normal, empty, special characters, large)
- Google Calendar test setup
- Edge case scenarios

## Continuous Integration

While not currently implemented, the plugin is designed to support CI/CD:

```yaml
# Suggested CI workflow
- Run: make install
- Run: make lint
- Run: make test
- Run: make build
- Verify: Build artifacts exist
```

## Test Coverage by Feature

| Feature | Unit Tests | Integration | E2E | Manual |
|---------|-----------|-------------|-----|--------|
| ICS Parser | ✅ 15 tests | ✅ | ✅ | ✅ MT-04 to MT-08 |
| Google Calendar Fetcher | ✅ 17 tests | ✅ 14 tests | ⚠️ Mocked | ✅ MT-09, MT-10 |
| Meeting Filter | ✅ 15 tests | ✅ | ✅ | ✅ |
| Daily Note Finder | ✅ 13 tests | ✅ | ✅ | ✅ MT-14, MT-16 |
| Section Creator | ✅ 17 tests | ✅ | ✅ | ✅ MT-14 |
| Meeting Inserter | ✅ 17 tests | ✅ | ✅ | ✅ MT-13 |
| Sync Orchestrator | ✅ 13 tests | ✅ | ✅ | ✅ MT-11, MT-12 |
| Error Handling | ✅ 22 tests | ✅ | ✅ | ✅ MT-19 |
| Notifications | ✅ 14 tests | ✅ | ⚠️ Visual only | ✅ MT-18 |
| Settings | ✅ 5 tests | ✅ | ⚠️ UI only | ✅ MT-02, MT-15 |
| Plugin Lifecycle | ✅ 12 tests | ✅ | ⚠️ UI only | ✅ MT-01, MT-03 |

**Legend**:
- ✅ = Fully covered
- ⚠️ = Partially covered (UI/network mocked)
- ❌ = Not covered

## Known Testing Limitations

1. **Obsidian UI**: Cannot fully test UI rendering in automated tests
   - Settings tab rendering
   - Command palette integration
   - Notification visual appearance

2. **Real Network Calls**: Google Calendar fetching is mocked in automated tests
   - Network error scenarios are mocked
   - Real timezone handling tested manually

3. **File System**: Real file operations mocked in automated tests
   - File permissions tested manually
   - Large file performance tested manually

4. **Mobile Platform**: No automated mobile testing
   - Mobile compatibility requires manual testing on iOS/Android

5. **Cross-Plugin Integration**: Limited testing with other plugins
   - Daily Notes plugin integration tested manually

## Debugging Tests

### View Test Output
```bash
make test
```

### Run Specific Test File
```bash
npx vitest run src/calendar/__tests__/ics-parser.test.ts
```

### Run Tests in Watch Mode
```bash
npx vitest
```

### View Console Output
Add `console.log()` statements in tests or source code. Output will appear during test runs.

### Debug in VS Code
1. Set breakpoints in test files
2. Run "Debug Current Test File" from VS Code testing panel
3. Or use launch configuration:
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Vitest Tests",
     "runtimeExecutable": "npm",
     "runtimeArgs": ["run", "test"],
     "console": "integratedTerminal"
   }
   ```

## Test Maintenance

### Adding New Tests

1. **Unit Test**: Create test file alongside source:
   ```
   src/feature/my-module.ts
   src/feature/__tests__/my-module.test.ts
   ```

2. **Follow AAA Pattern**:
   ```typescript
   it('should do something', () => {
     // Arrange
     const input = createTestInput();

     // Act
     const result = functionUnderTest(input);

     // Assert
     expect(result).toBe(expected);
   });
   ```

3. **Mock Dependencies**:
   ```typescript
   import { vi } from 'vitest';

   vi.mock('obsidian', () => ({
     Notice: vi.fn()
   }));
   ```

### Updating Manual Tests

When adding new features:

1. Add test case to `MANUAL_TESTING.md`
2. Add checklist item to `MANUAL_TEST_CHECKLIST.md`
3. Update this document's coverage table
4. Document any new test data needed

## Quality Gates

Before merging/releasing:

- [ ] All automated tests pass (`make test`)
- [ ] Build succeeds (`make build`)
- [ ] Linter passes (`make lint`)
- [ ] Test coverage >80% (check Vitest output)
- [ ] No new console errors
- [ ] Manual tests executed and documented
- [ ] No critical issues in manual test results

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
