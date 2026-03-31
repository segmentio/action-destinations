# Feature Flags Best Practices

## Overview

Feature flags (also called "feature toggles" or "feature switches") allow deploying code changes that can be toggled on/off without redeploying. For API version upgrades, they enable safe, gradual rollouts with instant rollback capability.

## Why Feature Flags for API Upgrades?

### Risk Mitigation

- **Instant rollback** - Disable problematic version immediately
- **Gradual rollout** - Test with small percentage before full deployment
- **A/B testing** - Compare performance between versions
- **Safe production testing** - Test in production with real traffic
- **Zero-downtime upgrades** - Switch versions without redeployment

### Business Benefits

- **Reduced deployment risk** - Can deploy anytime without fear
- **Faster iteration** - No need to wait for perfect implementation
- **Customer segmentation** - Roll out to specific customers first
- **Emergency brake** - Quick mitigation if issues arise

## Feature Flag Lifecycle

```
┌─────────────┐
│   Develop   │  Create code with flag, default OFF
└──────┬──────┘
       │
┌──────▼──────┐
│    Merge    │  Flag in codebase, still OFF in production
└──────┬──────┘
       │
┌──────▼──────┐
│   Deploy    │  Code deployed, flag still OFF (no risk)
└──────┬──────┘
       │
┌──────▼──────┐
│  Test (1%)  │  Enable for 1% of traffic, monitor closely
└──────┬──────┘
       │
┌──────▼──────┐
│ Expand (10%)│  Gradually increase percentage
└──────┬──────┘
       │
┌──────▼──────┐
│ Full (100%) │  Enable for all traffic
└──────┬──────┘
       │
┌──────▼──────┐
│   Promote   │  Make new version default (stable)
└──────┬──────┘
       │
┌──────▼──────┐
│   Cleanup   │  Remove flag and old code after validation period
└─────────────┘
```

## Implementation Pattern

### Standard Structure

**versioning-info.ts**:

```typescript
/** DESTINATION_API_VERSION
 * Destination API version (stable/production).
 * Used by default when feature flag is not enabled.
 * Changelog: https://...
 */
export const DESTINATION_API_VERSION = 'v4'

/** DESTINATION_CANARY_API_VERSION
 * Destination API version (canary/testing).
 * Used when feature flag is enabled.
 * Testing migration from v4 to v5.
 */
export const DESTINATION_CANARY_API_VERSION = 'v5'
```

**utils.ts** (or functions.ts):

```typescript
import { Features } from '@segment/actions-core'
import { DESTINATION_API_VERSION, DESTINATION_CANARY_API_VERSION } from './versioning-info'

export const API_VERSION = DESTINATION_API_VERSION
export const CANARY_API_VERSION = DESTINATION_CANARY_API_VERSION

/** Feature flag name for canary API version testing */
export const FLAGON_NAME = 'destination-canary-api-version'

/**
 * Get API version based on feature flag.
 * @param features - Feature flags object from request context
 * @returns API version to use (stable or canary)
 */
export function getApiVersion(features?: Features): string {
  return features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
}
```

### Usage in Code

**Action implementation**:

```typescript
export default {
  perform: async (request, { payload, settings, features }) => {
    const version = getApiVersion(features)

    const response = await request(`https://api.example.com/${version}/endpoint`, {
      method: 'POST',
      json: payload
    })

    return response
  }
}
```

**Shared utilities**:

```typescript
export function buildHeaders(authKey: string, features?: Features) {
  const version = getApiVersion(features)

  return {
    Authorization: `Bearer ${authKey}`,
    'X-API-Version': version,
    'Content-Type': 'application/json'
  }
}
```

**Request extension**:

```typescript
export default {
  extendRequest({ settings, features }) {
    return {
      headers: buildHeaders(settings.api_key, features)
    }
  }
}
```

## Naming Conventions

### Feature Flag Names

**Format**: `{destination-slug}-canary-api-version`

**Examples**:

- `klaviyo-canary-api-version`
- `google-cm360-canary-api-version`
- `facebook-custom-audiences-canary-api-version`
- `the-trade-desk-crm-canary-api-version`

**Rules**:

- Use destination slug (kebab-case)
- Always suffix with `-canary-api-version`
- Keep consistent across all destinations
- Document in code as `FLAGON_NAME` constant

### Constant Names

**versioning-info.ts**:

```typescript
// Pattern: {DESTINATION}_API_VERSION
export const KLAVIYO_API_VERSION = '2025-01-15'
export const KLAVIYO_CANARY_API_VERSION = '2026-01-15'

export const GOOGLE_CM360_API_VERSION = 'v4'
export const GOOGLE_CM360_CANARY_API_VERSION = 'v5'
```

**Function names**:

```typescript
// Pattern: getApiVersion
export function getApiVersion(features?: Features): string

// Alternative patterns (less common):
export function getRevision(features?: Features): string
export function getVersion(features?: Features): string
```

## Testing with Feature Flags

### Test Structure

```typescript
import { FLAGON_NAME, API_VERSION, CANARY_API_VERSION } from '../utils'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'

const testDestination = createTestIntegration(Definition)

describe('API Version Feature Flag', () => {
  describe('Stable Version (default)', () => {
    it('should use stable version when flag not set', async () => {
      const scope = nock('https://api.example.com').post(`/${API_VERSION}/endpoint`).reply(200, { success: true })

      await testDestination.testAction('actionName', {
        event: createTestEvent({}),
        mapping: { field: 'value' },
        settings: { api_key: 'test' }
        // features not provided = stable version
      })

      expect(scope.isDone()).toBeTruthy()
    })

    it('should use stable version when flag explicitly false', async () => {
      const scope = nock('https://api.example.com').post(`/${API_VERSION}/endpoint`).reply(200, { success: true })

      await testDestination.testAction('actionName', {
        event: createTestEvent({}),
        mapping: { field: 'value' },
        settings: { api_key: 'test' },
        features: { [FLAGON_NAME]: false } // Explicitly disabled
      })

      expect(scope.isDone()).toBeTruthy()
    })
  })

  describe('Canary Version (feature flag enabled)', () => {
    it('should use canary version when flag enabled', async () => {
      const scope = nock('https://api.example.com')
        .post(`/${CANARY_API_VERSION}/endpoint`)
        .reply(200, { success: true })

      await testDestination.testAction('actionName', {
        event: createTestEvent({}),
        mapping: { field: 'value' },
        settings: { api_key: 'test' },
        features: { [FLAGON_NAME]: true } // ← Enable canary
      })

      expect(scope.isDone()).toBeTruthy()
    })

    it('should handle canary-specific response format', async () => {
      nock('https://api.example.com')
        .post(`/${CANARY_API_VERSION}/endpoint`)
        .reply(200, {
          // New response format in canary
          result: { status: 'success' },
          metadata: { version: CANARY_API_VERSION }
        })

      const responses = await testDestination.testAction('actionName', {
        event: createTestEvent({}),
        mapping: { field: 'value' },
        settings: { api_key: 'test' },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses[0].status).toBe(200)
      expect(responses[0].data.metadata.version).toBe(CANARY_API_VERSION)
    })
  })

  describe('Feature Flag Isolation', () => {
    it('should not affect other feature flags', async () => {
      const scope = nock('https://api.example.com').post(`/${CANARY_API_VERSION}/endpoint`).reply(200, {})

      await testDestination.testAction('actionName', {
        event: createTestEvent({}),
        mapping: { field: 'value' },
        settings: { api_key: 'test' },
        features: {
          [FLAGON_NAME]: true, // Enable this flag
          'other-feature-flag': false, // Other flags unaffected
          'another-flag': true
        }
      })

      expect(scope.isDone()).toBeTruthy()
    })
  })
})
```

### Test Best Practices

1. **Test both states** - Always test with flag on AND off
2. **Test default behavior** - Verify stable version is default
3. **Test explicit false** - Verify false value works same as undefined
4. **Test isolation** - Verify flag doesn't affect unrelated behavior
5. **Test edge cases** - Invalid flag values, missing features object
6. **Test combinations** - Multiple feature flags together

## Rollout Strategy

### Phase 1: Development (0%)

- Code merged with flag OFF
- Feature in production but inactive
- No user impact
- **Duration**: Immediate (with PR merge)

### Phase 2: Internal Testing (0.1%)

- Enable for Segment internal workspaces
- Monitor errors, latency, correctness
- Gather feedback from internal users
- **Duration**: 1-3 days

### Phase 3: Beta Customers (1-5%)

- Enable for select early-adopter customers
- Monitor closely for issues
- Collect feedback and metrics
- **Duration**: 3-7 days

### Phase 4: Gradual Rollout (5-50%)

- Incrementally increase percentage
- Monitor error rates, performance
- Steps: 5% → 10% → 25% → 50%
- **Duration**: 7-14 days

### Phase 5: Majority Rollout (50-95%)

- Most users now on new version
- Old version still available as fallback
- Continue monitoring
- **Duration**: 7-14 days

### Phase 6: Full Rollout (100%)

- All users on new version
- Keep flag in case rollback needed
- Validate everything works
- **Duration**: 7-30 days (observation period)

### Phase 7: Promotion

- Make new version the stable default
- Update `DESTINATION_API_VERSION` to canary value
- Prepare new canary for next upgrade
- **Duration**: Immediate (code change)

### Phase 8: Cleanup

- Remove feature flag logic
- Remove old version constant
- Clean up conditional code
- **Duration**: 1-2 weeks (next sprint)

## Monitoring and Metrics

### Key Metrics to Track

**Error Rates**:

```
error_rate_stable = errors_stable / requests_stable
error_rate_canary = errors_canary / requests_canary
delta = error_rate_canary - error_rate_stable
```

**Latency**:

```
p50_stable vs p50_canary
p95_stable vs p95_canary
p99_stable vs p99_canary
```

**Success Rates**:

```
success_rate = successful_requests / total_requests
compare: stable vs canary
```

**Request Volume**:

```
requests_per_minute_stable
requests_per_minute_canary
total_requests (both combined)
```

### Alert Thresholds

**Error rate spike**:

- **Warning**: Canary error rate > Stable error rate + 5%
- **Critical**: Canary error rate > Stable error rate + 10%
- **Action**: Investigate immediately, prepare rollback

**Latency degradation**:

- **Warning**: Canary p95 > Stable p95 + 20%
- **Critical**: Canary p95 > Stable p95 + 50%
- **Action**: Analyze slow requests, consider rollback

**Success rate drop**:

- **Warning**: Canary success rate < Stable success rate - 2%
- **Critical**: Canary success rate < Stable success rate - 5%
- **Action**: Rollback immediately

### Rollback Triggers

Automatic rollback if:

1. Canary error rate > 10% absolute
2. Canary error rate > 2x stable error rate
3. Canary success rate < 90%
4. Multiple critical alerts in short timeframe
5. Customer escalation for canary users

## Documentation Requirements

### PR Description Template

```markdown
## Feature Flag Details

**Flag Name**: `destination-canary-api-version`

**Stable Version**: v4
**Canary Version**: v5

**Default State**: OFF (stable version)

**Rollout Plan**:

- Phase 1: Internal testing (0.1%)
- Phase 2: Beta customers (1-5%)
- Phase 3: Gradual rollout (5-50%)
- Phase 4: Full rollout (100%)
- Phase 5: Promotion to stable
- Phase 6: Cleanup

**Monitoring**:

- Error rates (stable vs canary)
- Latency (p50, p95, p99)
- Success rates
- Request volume

**Rollback Criteria**:

- Error rate > 10%
- Success rate < 90%
- Customer escalation
- Critical alerts

**Breaking Changes**: See below

## Breaking Changes

[... detailed analysis ...]
```

### Code Comments

```typescript
/** DESTINATION_CANARY_API_VERSION
 * Canary API version for gradual rollout testing.
 *
 * This version is behind the feature flag 'destination-canary-api-version'.
 *
 * Rollout status: [UPDATE THIS]
 * - Phase: Internal testing
 * - Enabled: 0.1% of traffic
 * - Started: 2026-03-14
 * - Expected full rollout: 2026-04-14
 *
 * Known issues: None
 * Breaking changes: See breaking-changes-analysis.md
 */
export const DESTINATION_CANARY_API_VERSION = 'v5'
```

## Common Pitfalls

### ❌ Don't: Default to new version

```typescript
// WRONG - New version is default
export function getApiVersion(features?: Features): string {
  return features && features[FLAGON_NAME] ? API_VERSION : CANARY_API_VERSION
}
```

### ✅ Do: Default to stable version

```typescript
// CORRECT - Stable version is default
export function getApiVersion(features?: Features): string {
  return features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
}
```

### ❌ Don't: Forget to pass features through

```typescript
// WRONG - features lost in chain
export function buildHeaders(authKey: string) {
  return {
    'X-API-Version': API_VERSION // Always stable!
  }
}
```

### ✅ Do: Thread features through call chain

```typescript
// CORRECT - features passed through
export function buildHeaders(authKey: string, features?: Features) {
  return {
    'X-API-Version': getApiVersion(features)
  }
}
```

### ❌ Don't: Remove flag too quickly

```typescript
// WRONG - Remove flag same day as 100% rollout
// What if there's a production issue tomorrow?
```

### ✅ Do: Keep flag for observation period

```typescript
// CORRECT - Keep flag 2-4 weeks after 100%
// Allows safe rollback if issues arise
```

## Best Practices Summary

1. **Always default to stable** - New version should require opt-in
2. **Test both versions** - Comprehensive test coverage for both paths
3. **Document thoroughly** - Clear comments, PR descriptions, rollout plans
4. **Monitor closely** - Track metrics during rollout
5. **Rollout gradually** - Don't jump from 0% to 100%
6. **Keep escape hatch** - Maintain ability to rollback
7. **Plan promotion** - Have strategy for making canary stable
8. **Schedule cleanup** - Don't leave flags forever
9. **Communicate status** - Keep team informed of rollout progress
10. **Learn from incidents** - Document issues and improvements

## Resources

- **Feature Flags at Segment**: [Internal docs link]
- **Rollout best practices**: [Internal docs link]
- **Monitoring dashboards**: [Dashboard links]
- **On-call runbooks**: [Runbook links]
