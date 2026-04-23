# Testing Guide for API Version Upgrades

## Overview

This guide covers testing strategies for API version upgrades in Segment Action Destinations, including running tests, interpreting results, and handling failures.

## Test Organization

### Directory Structure

```
packages/destination-actions/src/destinations/{destination}/
├── __tests__/
│   ├── index.test.ts              # Main destination tests
│   ├── snapshot.test.ts           # Snapshot tests
│   └── multistatus.test.ts        # Multi-status response tests
├── {action1}/
│   └── __tests__/
│       ├── index.test.ts          # Action-specific tests
│       └── snapshot.test.ts       # Action snapshots
└── {action2}/
    └── __tests__/
        └── index.test.ts
```

## Running Tests

### Prerequisites

#### Node Version

Action destinations require Node 18.17+ or 22.13+:

```bash
# Check current version
node --version

# Switch if needed (nvm)
source ~/.nvm/nvm.sh
nvm use 22.13.1

# Verify
node --version  # Should show v22.13.1
```

### Test Commands

#### Run All Destination Tests

```bash
# From repository root
TZ=UTC yarn test --testPathPattern="destinations/{destination}" --no-coverage
```

#### Run Specific Test File

```bash
TZ=UTC yarn test --testPathPattern="destinations/{destination}/__tests__/index.test.ts"
```

#### Run With Coverage

```bash
yarn test --testPathPattern="destinations/{destination}" --coverage
```

#### Run in Watch Mode

```bash
yarn test --testPathPattern="destinations/{destination}" --watch
```

### Auto-Detecting Test Pattern

The skill should automatically detect the destination name and construct the pattern:

```typescript
// Given destination name: "klaviyo"
const testPattern = `destinations/${destinationName}`
// Results in: destinations/klaviyo

// Run tests
const command = `TZ=UTC yarn test --testPathPattern="${testPattern}" --no-coverage`
```

## Test Output Interpretation

### Success Output

```
PASS src/destinations/klaviyo/__tests__/index.test.ts (20.435 s)
PASS src/destinations/klaviyo/upsertProfile/__tests__/index.test.ts (21.627 s)

Test Suites: 14 passed, 14 total
Tests:       133 passed, 133 total
Snapshots:   24 passed, 24 total
Time:        26.888 s
```

**Green flags**:

- All test suites passed
- All tests passed
- All snapshots passed
- Exit code 0

### Failure Output

```
FAIL src/destinations/klaviyo/upsertProfile/__tests__/index.test.ts
  ● upsertProfile › should create profile with new API version

    Expected request to be called with URL containing "2026-01-15"
    but got "2025-01-15"

      102 |     expect(mockRequest).toHaveBeenCalledWith(
      103 |       expect.stringContaining('2026-01-15')
    > 104 |     )
```

**Red flags**:

- FAIL markers
- Expected vs Received mismatches
- Snapshot mismatches
- Exit code 1

### Common Test Patterns

#### Testing Feature Flag Toggle

```typescript
import { FLAGON_NAME, API_VERSION, CANARY_API_VERSION } from '../utils'

describe('API Version Feature Flag', () => {
  const testDestination = createTestIntegration(Definition)

  beforeEach(() => {
    nock('https://api.example.com')
      .post(/v4|v5/) // Accept both versions
      .reply(200, { success: true })
  })

  it('uses stable version by default', async () => {
    await testDestination.testAction('actionName', {
      event: createTestEvent({}),
      mapping: { field: 'value' },
      settings: { api_key: 'test-key' }
      // No features parameter = stable version
    })

    expect(nock.pendingMocks()).toHaveLength(0)
    // Verify stable version was called
  })

  it('uses canary version when feature flag enabled', async () => {
    await testDestination.testAction('actionName', {
      event: createTestEvent({}),
      mapping: { field: 'value' },
      settings: { api_key: 'test-key' },
      features: { [FLAGON_NAME]: true } // ← Enable canary
    })

    expect(nock.pendingMocks()).toHaveLength(0)
    // Verify canary version was called
  })
})
```

#### Testing Request URL

```typescript
it('should call correct API endpoint with canary version', async () => {
  const scope = nock('https://api.example.com')
    .post('/v5/users') // Canary version
    .reply(200, { id: '123' })

  await testDestination.testAction('actionName', {
    event,
    mapping,
    settings,
    features: { [FLAGON_NAME]: true }
  })

  expect(scope.isDone()).toBeTruthy()
})
```

#### Testing Request Headers

```typescript
it('should send correct revision header with canary version', async () => {
  const scope = nock('https://api.example.com')
    .post('/endpoint')
    .matchHeader('revision', '2026-01-15') // Canary revision
    .reply(200, {})

  await testDestination.testAction('actionName', {
    event,
    mapping,
    settings,
    features: { [FLAGON_NAME]: true }
  })

  expect(scope.isDone()).toBeTruthy()
})
```

#### Testing Response Handling

```typescript
it('should handle canary version response format', async () => {
  nock('https://api.example.com')
    .post('/v5/users')
    .reply(200, {
      data: { id: '123', status: 'active' },
      // New response format in canary
      metadata: { version: 'v5' }
    })

  const responses = await testDestination.testAction('actionName', {
    event,
    mapping,
    settings,
    features: { [FLAGON_NAME]: true }
  })

  expect(responses[0].status).toBe(200)
  expect(responses[0].data).toHaveProperty('metadata')
})
```

## Handling Test Failures

### Failure Analysis Workflow

1. **Read the error message carefully**

   - What was expected?
   - What was received?
   - Which line failed?

2. **Identify the root cause**

   - Breaking API change?
   - Implementation bug?
   - Test needs updating?

3. **Check breaking changes analysis**

   - Does this align with documented breaking changes?
   - Is this an expected difference?

4. **Fix and retest**
   - Update implementation OR
   - Update test expectations OR
   - Both

### Common Failure Scenarios

#### Scenario 1: URL Format Changed

**Error**:

```
Expected URL: https://api.example.com/v5/users
Received URL: https://api.example.com/v5/user
```

**Cause**: API endpoint renamed (users → user)

**Fix**: Update endpoint in implementation:

```typescript
// Before
const url = `${BASE_URL}/${version}/users`

// After
const url = `${BASE_URL}/${version}/user` // Singular
```

#### Scenario 2: Required Field Added

**Error**:

```
API returned 400: Missing required field 'client_id'
```

**Cause**: New API version requires additional field

**Fix**: Add field to request:

```typescript
// Before
const payload = {
  user_id: userId,
  email: email
}

// After
const payload = {
  user_id: userId,
  email: email,
  client_id: settings.client_id // New required field
}
```

#### Scenario 3: Response Schema Changed

**Error**:

```
TypeError: Cannot read property 'data' of undefined
```

**Cause**: Response structure changed

**Fix**: Update response handling:

```typescript
// Before
const userId = response.data.id

// After
const userId = response.result?.user?.id // New structure
```

#### Scenario 4: Authentication Method Changed

**Error**:

```
401 Unauthorized: Invalid authentication method
```

**Cause**: API changed from API key to Bearer token

**Fix**: Update authentication:

```typescript
// Before
headers: {
  'X-API-Key': settings.api_key
}

// After
headers: {
  'Authorization': `Bearer ${settings.api_token}`
}
```

### Snapshot Test Updates

If snapshots need updating (when changes are intentional):

```bash
# Update snapshots
yarn test --testPathPattern="destinations/{destination}" --updateSnapshot

# Review changes
git diff
```

**⚠️ Warning**: Only update snapshots if you understand and approve the changes. Don't blindly update.

## Testing Checklist

Before marking tests as complete:

### Pre-Test

- [ ] Node version is compatible (18.17+ or 22.13+)
- [ ] All dependencies installed (`yarn install`)
- [ ] Working directory is clean
- [ ] No other tests running (can cause conflicts)

### During Test

- [ ] All test suites pass
- [ ] All individual tests pass
- [ ] All snapshots match
- [ ] No warnings or deprecation notices
- [ ] Tests run in reasonable time (<5 min)

### Post-Test

- [ ] Stable version tests pass (no feature flag)
- [ ] Canary version tests pass (with feature flag)
- [ ] Both versions tested in same test run
- [ ] No test files were skipped
- [ ] Coverage is adequate (if checking)

### Breaking Changes Validation

- [ ] Each documented breaking change has a test
- [ ] Tests verify new behavior works correctly
- [ ] Tests verify old behavior still works (stable version)
- [ ] Edge cases are covered

## Debugging Test Failures

### Enable Verbose Output

```bash
yarn test --testPathPattern="destinations/{destination}" --verbose
```

### Run Single Test

```bash
yarn test --testPathPattern="destinations/{destination}" --testNamePattern="specific test name"
```

### Add Debug Logging

Temporarily add console.log in tests:

```typescript
it('should do something', async () => {
  console.log('Request:', JSON.stringify(mockRequest.mock.calls, null, 2))
  console.log('Response:', JSON.stringify(responses, null, 2))
  // ... test assertions
})
```

### Check Nock Mocks

```typescript
afterEach(() => {
  if (!nock.isDone()) {
    console.log('Pending mocks:', nock.pendingMocks())
  }
  nock.cleanAll()
})
```

### Validate Request Matching

```typescript
// Be specific with nock matchers
nock('https://api.example.com')
  .post('/v5/users', (body) => {
    console.log('Request body:', body)
    return true // Return false to reject
  })
  .reply(200, {})
```

## Performance Considerations

### Timeouts

Increase timeout for slow tests:

```typescript
it('should handle large batch', async () => {
  // ... test
}, 30000) // 30 second timeout
```

### Parallel Execution

Tests run in parallel by default. If this causes issues:

```bash
yarn test --testPathPattern="destinations/{destination}" --runInBand
```

### Test Isolation

Ensure tests don't affect each other:

```typescript
beforeEach(() => {
  // Reset state
  nock.cleanAll()
})

afterEach(() => {
  // Clean up
  nock.cleanAll()
})
```

## CI/CD Integration

Tests must pass in CI before merge:

### Local Pre-Push Check

```bash
# Run what CI will run
TZ=UTC yarn test --testPathPattern="destinations/{destination}" --no-coverage --ci

# Check exit code
echo $?  # Should be 0
```

### CI Environment Differences

CI environments may:

- Use different Node versions
- Have stricter timeout limits
- Run more tests in parallel
- Have network restrictions

Test locally in conditions similar to CI when possible.

## Best Practices

1. **Test both versions** - Always verify stable and canary work
2. **Use realistic data** - Test with production-like payloads
3. **Test error cases** - Don't just test happy paths
4. **Keep tests focused** - One thing per test
5. **Use descriptive names** - Test names should explain what's tested
6. **Clean up mocks** - Prevent test interference
7. **Document assumptions** - Explain why tests are written that way
8. **Run multiple times** - Ensure tests aren't flaky
9. **Check coverage** - Ensure new code paths are tested
10. **Update regularly** - Keep tests in sync with implementation
