---
name: api-version-upgrade
description: |
  Upgrade API versions for Segment Action Destinations with feature flags, comprehensive breaking change analysis, automated testing, and PR creation.

  Use this skill when the user wants to:
  - Upgrade a destination's API version (e.g., "upgrade Klaviyo to 2026-01-15")
  - Update API endpoints to newer versions
  - Bump version numbers for any action destination
  - Migrate a destination to use versioned APIs
  - Test a new API version with feature flags

  This skill handles the complete workflow: version detection, changelog analysis, feature flag implementation, testing, and PR creation with detailed breaking changes documentation.
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, Bash(git *), Bash(gh *), Bash(yarn *), Bash(nvm *), Bash(source *), Bash(node *), Bash(find *), Bash(ls *), Bash(grep *), Bash(which *)
---

# API Version Upgrade Workflow

This skill automates the complete process of upgrading API versions for Segment Action Destinations, ensuring safe rollouts with feature flags and comprehensive testing.

## Overview

API version upgrades in action-destinations follow a **canary pattern**:

- Stable production version remains unchanged
- New version is deployed behind a feature flag
- Gradual rollout allows safe testing and rollback
- Full breaking changes analysis before merge

## ⚠️ MANDATORY REQUIREMENTS ⚠️

**EVERY API version upgrade MUST include:**

1. **versioning-info.ts file** - If it doesn't exist, CREATE IT. No exceptions.
2. **Feature flag implementation** - ALL upgrades must be behind a feature flag. No direct version changes.
3. **Feature flag tests** - Test both stable (default) and canary (feature flag enabled) versions.

These are not optional. They are required for safe, gradual rollouts and instant rollback capability.

## Step 0: Pre-flight Tool Check

Before doing anything else, verify all required tools are installed. Run each check and report the results in a summary table.

```bash
which git && git --version
which gh && gh --version
which yarn && yarn --version
which node && node --version
which nvm || (source ~/.nvm/nvm.sh && nvm --version)
```

| Tool   | Required | Purpose                            |
| ------ | -------- | ---------------------------------- |
| `git`  | REQUIRED | Branch management, commits         |
| `gh`   | REQUIRED | Pull request creation              |
| `yarn` | REQUIRED | Running tests                      |
| `node` | REQUIRED | Running tests (v18.17+ or v22.13+) |
| `nvm`  | OPTIONAL | Switching Node versions            |

**If any REQUIRED tool is missing, stop immediately and tell the user:**

```
❌ Pre-flight check failed.

Missing required tools:
- <tool>: <install instructions>

Please install the missing tools and re-run the skill.
```

Install hints:

- `gh` not found: `brew install gh` (Mac) or see https://cli.github.com
- `yarn` not found: `npm install -g yarn`
- `git` not found: `brew install git` or install Xcode Command Line Tools
- `node` not found: install via https://nodejs.org or `nvm install 22`
- `nvm` not found (optional): `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`

If `nvm` is missing but node is already at v18.17+ or v22.13+, that is acceptable — skip the `nvm use` step later.

Only continue to the next step after all REQUIRED tools are confirmed present.

## Prerequisites Check

Before starting, verify:

1. You're in the action-destinations repository root
2. Node version is compatible (v18.17+ or v22.13+)
3. Git working directory is clean
4. User has provided:
   - Destination name (e.g., "klaviyo", "google-campaign-manager-360")
   - Target API version (e.g., "2026-01-15", "v5")

If any information is missing, ask the user before proceeding.

## Step 1: Information Gathering

### 1.1 Collect Required Information

Ask the user for:

```
- Destination name: [e.g., klaviyo]
- Current version: [will auto-detect if not provided]
- Target version: [user must provide]
- Changelog URL (optional): [base URL for API docs]
```

### 1.2 Locate Destination Files

Find the destination directory:

```bash
packages/destination-actions/src/destinations/<destination-name>/
```

Key files to check:

- `versioning-info.ts` - version constants (CREATE if missing)
- `config.ts` - may have version constants
- `functions.ts` or `utils.ts` - API request building
- `index.ts` - main destination definition
- `__tests__/` - test files

### 1.3 Detect Current Version

Search for version constants in this order:

1. `versioning-info.ts` (preferred pattern)
2. `config.ts` (simple pattern)
3. Hardcoded in `utils.ts` or `functions.ts`

Common patterns:

```typescript
// Pattern 1: versioning-info.ts (PREFERRED - Google CM360 style)
export const DESTINATION_API_VERSION = 'v4'
export const DESTINATION_CANARY_API_VERSION = 'v5'

// Pattern 2: config.ts (Klaviyo style) - MIGRATE TO versioning-info.ts
export const REVISION_DATE = '2025-01-15'
export const API_URL = 'https://api.example.com'

// Pattern 3: Inline constant - MIGRATE TO versioning-info.ts
const API_VERSION = 'v3'
const BASE_URL = `https://api.example.com/${API_VERSION}`
```

**If versioning-info.ts does NOT exist, you MUST create it in Step 4.**

## Step 2: Changelog Analysis

### 2.1 Determine Changelog Location

Check if `versioning-info.ts` has a changelog URL comment:

```typescript
/** DESTINATION_API_VERSION
 * API version documentation.
 * Changelog: https://developers.example.com/changelog
 */
```

If not present, ask user for changelog URL or look for common patterns:

- `https://developers.{destination}.com/changelog`
- `https://developers.{destination}.com/docs/api-versions`
- `https://{destination}.com/api/reference`

### 2.2 Fetch Changelog

Use WebFetch to retrieve changelog for the version range:

```bash
# Fetch the main changelog page
<use WebFetch tool for changelog URL>

# Look for version-specific pages if needed
<use WebFetch for version-specific documentation>
```

### 2.3 Deep Breaking Changes Analysis

**CRITICAL: This analysis must be thorough. We cannot afford discrepancies.**

For each API change between current and target version, check:

#### Request Changes

- [ ] New required parameters
- [ ] Removed or deprecated parameters
- [ ] Changed parameter types or formats
- [ ] Modified validation rules
- [ ] Different authentication methods
- [ ] New headers required
- [ ] Changed request body structure

#### Response Changes

- [ ] Modified response schema
- [ ] Removed response fields
- [ ] Changed field types
- [ ] Different error codes
- [ ] New error response formats
- [ ] Pagination changes

#### Behavioral Changes

- [ ] Rate limiting differences
- [ ] Batching size limits
- [ ] Timeout changes
- [ ] Retry logic requirements
- [ ] Idempotency key handling

#### Endpoint Changes

- [ ] URL pattern changes
- [ ] Method changes (GET → POST, etc.)
- [ ] Deprecated endpoints
- [ ] New endpoints replacing old ones

Create a structured breaking changes document:

```markdown
## Breaking Changes Analysis: {Current Version} → {Target Version}

### Summary

[High-level overview of changes]

### Critical Breaking Changes

1. **[Category]**: [Description]
   - **Impact**: [How this affects our implementation]
   - **Required Action**: [What needs to be changed]
   - **Risk Level**: HIGH/MEDIUM/LOW

### Non-Breaking Changes

- [List of additive or compatible changes]

### Deprecation Warnings

- [Features deprecated but still functional]

### Testing Requirements

- [Specific scenarios that must be tested]
```

Save this analysis to `breaking-changes-analysis.md` in the destination directory.

## Step 3: Git Branch Setup

### 3.1 Pull Latest Main

```bash
git fetch origin
git checkout main
git pull origin main
```

### 3.2 Create Feature Branch

Use naming convention: `{destination}-api-{target-version}`

```bash
git checkout -b klaviyo-api-2026-01-15
# or
git checkout -b google-cm360-api-v5
```

## Step 4: Implement Version Upgrade with Feature Flag

### ⚠️ CRITICAL: Feature Flag is MANDATORY ⚠️

**ALL API version upgrades MUST be behind a feature flag.**
**If versioning-info.ts does NOT exist, you MUST create it.**

There is NO option to upgrade the version directly without a feature flag.

### 4.1 Check if versioning-info.ts Exists

```bash
ls packages/destination-actions/src/destinations/{destination}/versioning-info.ts
```

**Two possible scenarios:**

---

### 4.2 Scenario A: versioning-info.ts EXISTS

If `versioning-info.ts` already exists, update it:

**Step 1**: Update `versioning-info.ts` with new canary version:

```typescript
/** DESTINATION_API_VERSION
 * {Destination} API version (stable/production).
 * Changelog: {URL}
 */
export const DESTINATION_API_VERSION = '{current-version}'

/** DESTINATION_CANARY_API_VERSION
 * {Destination} API version (canary/feature-flagged).
 * Testing new version {target-version} behind feature flag.
 */
export const DESTINATION_CANARY_API_VERSION = '{target-version}'
```

**Step 2**: Verify or create helper in `utils.ts` or `functions.ts`:

```typescript
import { Features } from '@segment/actions-core'
import { DESTINATION_API_VERSION, DESTINATION_CANARY_API_VERSION } from './versioning-info'

export const API_VERSION = DESTINATION_API_VERSION
export const CANARY_API_VERSION = DESTINATION_CANARY_API_VERSION
export const FLAGON_NAME = '{destination-slug}-canary-version'

export function getApiVersion(features?: Features): string {
  return features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
}
```

**Step 3**: Update all API calls to use `getApiVersion(features)`:

```typescript
// Before
const response = await request(`${API_URL}/${API_VERSION}/endpoint`)

// After
const version = getApiVersion(features)
const response = await request(`${API_URL}/${version}/endpoint`)
```

**Step 4**: Ensure `features` parameter is passed through actions:

```typescript
// In action's perform or performBatch
async perform(request, { payload, settings, features }) {
  const version = getApiVersion(features)
  // use version in API calls
}

async performBatch(request, { payload, settings, features }) {
  const version = getApiVersion(features)
  // use version in API calls
}
```

---

### 4.3 Scenario B: versioning-info.ts DOES NOT EXIST

**If versioning-info.ts doesn't exist, you MUST create it. This is mandatory.**

**Step 1**: Create `versioning-info.ts` file:

```typescript
/** DESTINATION_API_VERSION
 * {Destination} API version (stable/production).
 * Changelog: {changelog-url}
 */
export const DESTINATION_API_VERSION = '{current-version}'

/** DESTINATION_CANARY_API_VERSION
 * {Destination} API version (canary/feature-flagged).
 * Testing new version {target-version} behind feature flag.
 */
export const DESTINATION_CANARY_API_VERSION = '{target-version}'
```

**Step 2**: Find where the current version is defined:

Search for version constants:

```bash
grep -r "REVISION_DATE\|API_VERSION\|VERSION" --include="*.ts" packages/destination-actions/src/destinations/{destination}/ | grep -v test | grep -v node_modules
```

Common locations:

- `config.ts`: `export const REVISION_DATE = '2025-01-15'`
- `utils.ts`: `const API_VERSION = 'v4'`
- Inline in API calls: `https://api.example.com/v4/endpoint`

**Step 3**: Update the file with the old version constant:

If in `config.ts`:

```typescript
// Before
export const REVISION_DATE = '2025-01-15'

// After - import from versioning-info
import { DESTINATION_API_VERSION } from './versioning-info'
export const REVISION_DATE = DESTINATION_API_VERSION
```

If in `utils.ts`:

```typescript
// Before
const API_VERSION = 'v4'

// After - import from versioning-info
import { DESTINATION_API_VERSION } from './versioning-info'
export const API_VERSION = DESTINATION_API_VERSION
```

**Step 4**: Add feature flag helper to `utils.ts` or `functions.ts`:

> ⚠️ **Import order**: All `import` statements must come first. Add `FLAGON_NAME` and `getApiVersion` exports AFTER the last import — never between imports. Violating this triggers the `import/first` lint rule and will fail CI.

```typescript
// All imports first
import { Features } from '@segment/actions-core'
import { DESTINATION_API_VERSION, DESTINATION_CANARY_API_VERSION } from './versioning-info'
// ... all other imports ...

// Exports after all imports
export const API_VERSION = DESTINATION_API_VERSION
export const CANARY_API_VERSION = DESTINATION_CANARY_API_VERSION
export const FLAGON_NAME = '{destination-slug}-canary-version'

export function getApiVersion(features?: Features): string {
  return features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
}
```

**Step 5**: Update all places where version is used:

Find all usage sites:

```bash
grep -r "{old-version-constant}" --include="*.ts" packages/destination-actions/src/destinations/{destination}/
```

Update them to use `getApiVersion(features)`:

```typescript
// Example 1: Direct API call
// Before
const response = await request(`https://api.example.com/v4/endpoint`)

// After
const version = getApiVersion(features)
const response = await request(`https://api.example.com/${version}/endpoint`)

// Example 2: In a helper function
// Before
export function buildUrl(path: string) {
  return `https://api.example.com/v4/${path}`
}

// After
export function buildUrl(path: string, features?: Features) {
  const version = getApiVersion(features)
  return `https://api.example.com/${version}/${path}`
}
```

**Step 6**: Update `extendRequest` in `index.ts` if needed:

If the version is used in headers or base URL:

```typescript
// Add features parameter
extendRequest({ settings, features }) {
  const version = getApiVersion(features)
  return {
    headers: {
      'api-version': version,
      // ... other headers
    }
  }
}
```

**Step 7**: Update action perform functions to pass `features`:

```typescript
// In each action file (e.g., conversionUpload/index.ts)
async perform(request, { payload, settings, features }) {
  // Make sure to pass features to any helper functions
  return await sendRequest(request, settings, payload, features)
}

async performBatch(request, { payload, settings, features }) {
  return await sendRequest(request, settings, payload, features)
}
```

---

### 4.4 Verify Feature Flag Implementation

**MANDATORY CHECKLIST** - verify ALL items before proceeding:

```markdown
- [ ] versioning-info.ts file EXISTS with both DESTINATION_API_VERSION and DESTINATION_CANARY_API_VERSION
- [ ] FLAGON_NAME constant defined with format '{destination-slug}-canary-version'
- [ ] FLAGON_NAME and getApiVersion are placed AFTER all import statements (import/first lint rule)
- [ ] getApiVersion(features) helper function implemented in utils.ts or functions.ts
- [ ] All API calls use getApiVersion(features) instead of hardcoded version
- [ ] extendRequest passes features parameter if version is used there
- [ ] All action perform/performBatch functions accept features parameter
- [ ] Features parameter is passed to all helper functions that need it
- [ ] No hardcoded version strings remain in the codebase
- [ ] Tests can toggle feature flag
```

**If ANY item is not checked, the implementation is INCOMPLETE.**

## Step 5: Update Tests

### 5.1 Auto-Detect Test Pattern

The test path follows the pattern:

```
packages/destination-actions/src/destinations/{destination}/__tests__/
```

Find test files:

```bash
find packages/destination-actions/src/destinations/{destination} -name "*.test.ts" -o -name "*.test.js"
```

### 5.2 Update Existing Tests

Update existing tests to use `API_VERSION` constant instead of hardcoded version strings:

```typescript
// Before
import Destination from '../../index'

nock('https://api.example.com/v4/endpoint').post('').reply(200, {})

// After
import Destination from '../../index'
import { API_VERSION } from '../../utils'

nock(`https://api.example.com/${API_VERSION}/endpoint`).post('').reply(200, {})
```

### 5.3 Add Feature Flag Tests (MANDATORY)

**Add a new test suite** for feature flag behavior:

```typescript
describe('API Version Feature Flag', () => {
  it('should use stable API version by default', async () => {
    const event = createTestEvent({
      // ... event data
    })

    nock(`https://api.example.com/${API_VERSION}/endpoint`).post('').reply(200, {})

    const responses = await testDestination.testAction('actionName', {
      event,
      mapping: {
        // ... required mappings
      },
      useDefaultMappings: true,
      settings
      // NO features parameter = uses stable version
    })

    expect(responses[0].status).toBe(200)
  })

  it('should use canary API version when feature flag is enabled', async () => {
    const event = createTestEvent({
      // ... same event data
    })

    // Should call canary version endpoint
    nock(`https://api.example.com/${CANARY_API_VERSION}/endpoint`).post('').reply(200, {})

    const responses = await testDestination.testAction('actionName', {
      event,
      mapping: {
        // ... same mappings
      },
      useDefaultMappings: true,
      settings,
      features: { [FLAGON_NAME]: true } // Feature flag enabled
    })

    expect(responses[0].status).toBe(200)
  })
})
```

**IMPORTANT**: Add these tests for EVERY action in the destination (conversionUpload, identify, track, etc.)

### 5.4 Run Tests

Switch to compatible Node version and run tests:

```bash
# Switch Node version if needed
source ~/.nvm/nvm.sh && nvm use 22.13.1

# Run destination-specific tests
# NOTE: `yarn cloud jest --testPathPattern` fails in newer Jest versions with
# "Option was replaced by --testPathPatterns". Use npx jest directly instead:
cd packages/destination-actions && TZ=UTC npx jest "{destination}" --no-coverage
```

**Expected outcome**: All tests must pass. If tests fail:

1. Review breaking changes analysis
2. Update implementation to handle differences
3. Re-run tests until all pass

### 5.5 Handle Test Failures

If tests fail due to breaking changes:

1. **Identify failure cause** from test output
2. **Check breaking changes analysis** for related changes
3. **Update implementation**:

   - Modify request/response handling
   - Add new required fields
   - Update validation logic
   - Adjust error handling

4. **Add regression tests** for the specific breaking change
5. **Re-run tests**

Repeat until all tests pass.

## Step 5.5: Run API Validation Against Real Endpoints

This step makes real HTTP calls to both the stable and canary revisions and structurally diffs the responses. It catches breaking changes that mocked unit tests cannot detect.

### Prerequisites

- `KLAVIYO_TEST_API_KEY` (or equivalent) set in env — use a test account, never production
- A pre-existing test list ID for the destination

### Run the validation script

```bash
KLAVIYO_TEST_API_KEY=xxx \
KLAVIYO_TEST_LIST_ID=your-list-id \
npx ts-node packages/destination-actions/src/destinations/{destination}/__validation__/validate.ts
```

When chamber is available:

```bash
chamber exec {destination}-test -- npx ts-node .../validate.ts
```

### What it does

- Fires each fixture against **both** revisions sequentially (stable first, then canary)
- Each write fixture uses revision-scoped identifiers (`revisionEmail(revision)`) so calls never conflict
- Normalizes non-deterministic fields (IDs, timestamps) before diffing
- Writes `__validation__/validation-report.md` — **commit this to the PR**
- Exits non-zero if any structural differences are found

### Expected outcome

```
✅ All N endpoints are structurally identical across both revisions. Safe to promote canary.
```

If differences are found, review `validation-report.md` for the specific fields that changed and update the implementation accordingly before proceeding.

### Notes

- `validation-report.md` is gitignored by default but should be **force-added** to the upgrade PR as evidence
- Delete it during the cleanup phase (Step 8) when the canary is promoted to stable
- The script uses a `RUN_ID` timestamp so repeated runs never collide on the same test profiles/events

## Step 6: Commit Changes

### 6.1 Review Changes

```bash
git status
git diff
```

Verify:

- versioning-info.ts created or updated correctly
- Feature flag implemented properly
- All usages updated to use getApiVersion()
- Tests updated and passing
- No unintended changes

### 6.2 Stage and Commit

```bash
# Stage all changes
git add packages/destination-actions/src/destinations/{destination}/

# Commit with descriptive message
git commit -m "feat({destination}): upgrade API to {target-version} behind feature flag

- Add/update versioning-info.ts with canary version {target-version}
- Implement feature flag '{flagon-name}'
- Update API calls to use getApiVersion() helper
- Add tests for both stable and canary versions
- All tests passing

Breaking changes analysis in breaking-changes-analysis.md

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Step 7: Push and Create PR

### 7.1 Push Branch

```bash
git push origin {branch-name} -u
```

### 7.2 Create Pull Request

Use GitHub CLI to create PR with comprehensive description:

```bash
gh pr create --title "feat({destination}): Upgrade API to {target-version} with feature flag" --body "$(cat <<'EOF'
## Summary

Upgrades {Destination} API from **{current-version}** to **{target-version}**, deployed behind feature flag `{flagon-name}`.

## Changes

### Version Management
- ✅ Created/updated `versioning-info.ts` with canary pattern
- ✅ Implemented `getApiVersion(features)` helper function
- ✅ Updated all API calls to use feature-flagged version
- ✅ Added feature flag constant: `{flagon-name}`

### Testing
- ✅ All existing tests pass
- ✅ Added tests for both stable and canary versions
- ✅ Test pattern: `destinations/{destination}`
- ✅ Test results: **{X} test suites passed, {Y} tests passed**

## Breaking Changes

{Insert breaking changes analysis here - read from breaking-changes-analysis.md}

### Critical Breaking Changes
{List high-priority breaking changes}

### Medium Priority Changes
{List medium-priority changes}

### Low Priority / Informational
{List low-priority changes}

## Testing Plan

### Manual Testing Required
- [ ] Test with feature flag disabled (stable version)
- [ ] Test with feature flag enabled (canary version)
- [ ] Verify no regression in existing functionality
- [ ] Test edge cases identified in breaking changes

### Automated Testing
- [x] Unit tests passing
- [x] Integration tests passing (if applicable)
- [x] Snapshot tests updated (if applicable)

## Rollout Plan

1. **Phase 1**: Merge PR, feature flag off by default
2. **Phase 2**: Enable for internal testing
3. **Phase 3**: Gradual rollout to subset of customers
4. **Phase 4**: Full rollout, promote canary to stable
5. **Phase 5**: Remove feature flag, clean up old version

## Risk Assessment

**Risk Level**: {HIGH/MEDIUM/LOW}

**Mitigation**:
- Feature flag allows instant rollback
- Comprehensive test coverage
- Breaking changes documented and addressed
- Gradual rollout prevents widespread impact

## Additional Notes

{Any additional context, concerns, or considerations}

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 7.3 Update Breaking Changes Section

After creating PR, read `breaking-changes-analysis.md` and manually insert the detailed breaking changes into the PR description by editing it:

```bash
gh pr edit --body "$(cat <updated-description-with-breaking-changes>)"
```

## Step 8: Final Verification

### 8.1 Verify PR Created Successfully

```bash
gh pr view --web
```

Check:

- PR title is descriptive
- Breaking changes section is complete
- All checkboxes are present
- Test results are included
- Feature flag name is documented

### 8.2 Report to User

Provide summary:

```markdown
✅ **API Version Upgrade Complete**

**Destination**: {destination}
**Version**: {current-version} → {target-version}
**Feature Flag**: `{flagon-name}`
**Branch**: `{branch-name}`
**PR**: {pr-url}

**Test Results**:

- ✅ {X} test suites passed
- ✅ {Y} tests passed
- ⏱️ Duration: {duration}s

**Breaking Changes**: {number} identified and documented

**Next Steps**:

1. Review PR and breaking changes analysis
2. Manual testing with feature flag
3. Gradual rollout plan
4. Monitor for issues

The version upgrade is safely deployed behind the feature flag `{flagon-name}` and ready for testing.
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with authentication errors

- **Solution**: Check if auth headers changed in new version
- **Action**: Update authentication implementation

**Issue**: Tests fail with schema validation errors

- **Solution**: Review request/response schema changes
- **Action**: Update payload types and validation

**Issue**: Can't find current version

- **Solution**: Search more broadly for version strings
- **Action**: Check all .ts files in destination directory

**Issue**: Feature flag not working

- **Solution**: Verify features parameter is passed through
- **Action**: Check extendRequest and perform functions

**Issue**: Breaking changes analysis incomplete

- **Solution**: Fetch additional documentation pages
- **Action**: Search for migration guides, release notes

## Best Practices

1. **Always create versioning-info.ts if it doesn't exist** - No exceptions
2. **Always use feature flags for version upgrades** - No direct version changes
3. **Always add tests for both versions** - Stable and canary
4. **Never skip breaking changes analysis** - Be thorough
5. **Run tests multiple times** to ensure consistency
6. **Document all assumptions** in PR description
7. **Keep stable version unchanged** until canary is validated
8. **Use descriptive feature flag names** with destination prefix
9. **Update changelog URL** in versioning-info.ts comments
10. **Plan gradual rollout** in PR description

## Success Criteria

Before marking complete, verify:

- [ ] versioning-info.ts file exists (created or updated)
- [ ] Feature flag implemented correctly
- [ ] getApiVersion(features) helper function exists
- [ ] All API calls use getApiVersion(features)
- [ ] Tests for both stable and canary versions added
- [ ] All tests passing (100% pass rate)
- [ ] Breaking changes documented thoroughly
- [ ] PR created with comprehensive description
- [ ] Branch pushed to remote
- [ ] No merge conflicts
- [ ] Code review requested (automatic)
- [ ] User understands rollout plan

## Reference Files

The skill may need to read these for context:

- `references/common-patterns.md` - Common destination patterns
- `references/feature-flags.md` - Feature flag best practices
- `references/testing-guide.md` - Testing strategies

## Notes

- **versioning-info.ts is MANDATORY** - Create it if it doesn't exist
- **Feature flags are MANDATORY** - All upgrades must be behind a flag
- **Tests for both versions are MANDATORY** - No exceptions
- Feature flags are managed by Segment's infrastructure team
- Reviewer assignment is automatic via CODEOWNERS
- Breaking changes analysis is the most critical step
- When in doubt, be more thorough, not less
- This workflow protects production systems - don't rush
