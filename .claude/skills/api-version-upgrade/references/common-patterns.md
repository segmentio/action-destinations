# Common API Versioning Patterns in Action Destinations

This document catalogs the different patterns used for API versioning across Segment Action Destinations.

## Pattern 1: Canary with versioning-info.ts (Preferred)

**Used by**: Google Campaign Manager 360, The Trade Desk CRM

**Structure**:

```
destination/
├── versioning-info.ts    # Version constants
├── utils.ts              # Helper with getApiVersion()
└── actions/
    └── someAction/
        └── index.ts      # Uses getApiVersion(features)
```

**versioning-info.ts**:

```typescript
/** DESTINATION_API_VERSION
 * Destination API version (stable/production).
 * API reference: https://...
 */
export const DESTINATION_API_VERSION = 'v4'

/** DESTINATION_CANARY_API_VERSION
 * Destination API version (canary/feature-flagged).
 */
export const DESTINATION_CANARY_API_VERSION = 'v5'
```

**utils.ts** (or functions.ts):

```typescript
import { Features } from '@segment/actions-core'
import { DESTINATION_API_VERSION, DESTINATION_CANARY_API_VERSION } from './versioning-info'

export const API_VERSION = DESTINATION_API_VERSION
export const CANARY_API_VERSION = DESTINATION_CANARY_API_VERSION
export const FLAGON_NAME = 'destination-canary-api-version'

export function getApiVersion(features?: Features): string {
  return features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
}

// Usage in API calls
export async function send(request, settings, payload, features) {
  const version = getApiVersion(features)
  const response = await request(`${BASE_URL}/${version}/endpoint`, {
    method: 'POST',
    json: payload
  })
  return response
}
```

**index.ts** (destination definition):

```typescript
extendRequest({ settings, features }) {
  return {
    headers: buildHeaders(settings.api_key, features)
  }
}
```

**Advantages**:

- Clean separation of version config
- Feature flag allows safe testing
- Easy to promote canary to stable
- Consistent pattern across destinations
- Gradual rollout capability

## Pattern 2: Simple Constant in config.ts

**Used by**: Klaviyo (before migration)

**Structure**:

```
destination/
├── config.ts             # Version constant
├── functions.ts          # Uses version in buildHeaders()
└── actions/
    └── someAction/
        └── index.ts      # Uses buildHeaders()
```

**config.ts**:

```typescript
export const API_URL = 'https://a.klaviyo.com/api'
export const REVISION_DATE = '2025-01-15'
```

**functions.ts**:

```typescript
import { API_URL, REVISION_DATE } from './config'

export function buildHeaders(authKey: string) {
  return {
    Authorization: `Klaviyo-API-Key ${authKey}`,
    Accept: 'application/json',
    revision: REVISION_DATE, // ← Used as HTTP header
    'Content-Type': 'application/json'
  }
}
```

**index.ts**:

```typescript
extendRequest({ settings }) {
  return {
    headers: buildHeaders(settings.api_key)
  }
}
```

**Limitations**:

- No feature flag support
- No canary testing capability
- Direct change to production version
- Harder to roll back if issues arise

**Migration path**: Convert to Pattern 1

## Pattern 3: Inline Constants

**Used by**: Some older destinations

**Structure**:

```typescript
// Directly in utils.ts or functions.ts
const API_VERSION = 'v3'
const BASE_URL = `https://api.example.com/${API_VERSION}`

export async function sendData(request, payload) {
  return await request(`${BASE_URL}/endpoint`, {
    method: 'POST',
    json: payload
  })
}
```

**Limitations**:

- Hardcoded, scattered across codebase
- No feature flag support
- Difficult to test multiple versions
- Hard to track version changes

**Migration path**:

1. Extract to config.ts
2. Then migrate to Pattern 1 (versioning-info.ts)

## Pattern 4: Version in URL Path vs Header

Some APIs use version differently:

### URL Path Version

```typescript
const BASE_URL = `https://api.example.com/${API_VERSION}`
// Results in: https://api.example.com/v4/users
```

### Header Version (Klaviyo)

```typescript
headers: {
  'revision': '2025-01-15'  // ← Version as header
}
// URL stays: https://a.klaviyo.com/api/profiles/
```

### Query Parameter Version

```typescript
const url = `${BASE_URL}/endpoint?api-version=${API_VERSION}`
// Results in: https://api.example.com/endpoint?api-version=v4
```

## Feature Flag Naming Convention

**Pattern**: `{destination-slug}-canary-api-version`

**Examples**:

- `cm360-canary-api-version` (Google Campaign Manager 360)
- `klaviyo-canary-api-version` (Klaviyo)
- `the-trade-desk-crm-canary-api-version` (The Trade Desk CRM)

**Usage in code**:

```typescript
export const FLAGON_NAME = 'destination-canary-api-version'

// In actions
async perform(request, { payload, settings, features }) {
  const version = getApiVersion(features)
  // use version...
}
```

## Testing Both Versions

**Standard pattern**:

```typescript
import { FLAGON_NAME } from '../utils'

describe('SomeAction', () => {
  it('should use stable version by default', async () => {
    const responses = await testDestination.testAction('actionName', {
      event,
      mapping,
      settings
      // features undefined = stable version
    })

    expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining(API_VERSION))
  })

  it('should use canary version with feature flag', async () => {
    const responses = await testDestination.testAction('actionName', {
      event,
      mapping,
      settings,
      features: { [FLAGON_NAME]: true } // ← Enable canary
    })

    expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining(CANARY_API_VERSION))
  })
})
```

## Migration Checklist: Simple → Canary Pattern

When migrating from Pattern 2/3 to Pattern 1:

- [ ] Create `versioning-info.ts` with both versions
- [ ] Export stable version with current value
- [ ] Export canary version with new value
- [ ] Add JSDoc comments with changelog URL
- [ ] Create `getApiVersion(features)` helper
- [ ] Define `FLAGON_NAME` constant
- [ ] Update `config.ts` to import from versioning-info
- [ ] Update all API call sites to use `getApiVersion()`
- [ ] Add `features` parameter to helper functions
- [ ] Update `extendRequest` to pass features
- [ ] Update action `perform` functions to receive features
- [ ] Add tests for both versions
- [ ] Verify feature flag toggles correctly
- [ ] Document in PR

## Real-World Examples

### Google Campaign Manager 360

```typescript
// versioning-info.ts
export const GOOGLE_CM360_API_VERSION = 'v4' // stable
export const GOOGLE_CM360_CANARY_API_VERSION = 'v5' // canary

// utils.ts
export const FLAGON_NAME = 'cm360-canary-api-version'
export function getApiVersion(features?: Features): string {
  return features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
}

// Usage
const version = getApiVersion(features)
const url = `https://dfareporting.googleapis.com/dfareporting/${version}/userprofiles/...`
```

### The Trade Desk CRM

```typescript
// versioning-info.ts
export const THE_TRADE_DESK_CRM_API_VERSION = 'v3'

// functions.ts
const BASE_URL = `https://api.thetradedesk.com/${THE_TRADE_DESK_CRM_API_VERSION}`
export const TTD_LEGACY_FLOW_FLAG_NAME = 'actions-the-trade-desk-crm-legacy-flow'
```

### Klaviyo (Simple → Canary Migration)

```typescript
// BEFORE (config.ts)
export const REVISION_DATE = '2025-01-15'

// AFTER (versioning-info.ts)
export const KLAVIYO_API_VERSION = '2025-01-15'
export const KLAVIYO_CANARY_API_VERSION = '2026-01-15'

// AFTER (config.ts) - maintain compatibility
import { KLAVIYO_API_VERSION } from './versioning-info'
export const REVISION_DATE = KLAVIYO_API_VERSION

// AFTER (functions.ts) - add feature flag support
export const FLAGON_NAME = 'klaviyo-canary-api-version'
export function getApiRevision(features?: Features): string {
  return features && features[FLAGON_NAME] ? KLAVIYO_CANARY_API_VERSION : KLAVIYO_API_VERSION
}

export function buildHeaders(authKey: string, features?: Features) {
  return {
    Authorization: `Klaviyo-API-Key ${authKey}`,
    Accept: 'application/json',
    revision: getApiRevision(features), // ← Dynamic based on feature flag
    'Content-Type': 'application/json'
  }
}
```

## Key Takeaways

1. **Always use Pattern 1** (canary with versioning-info.ts) for new destinations
2. **Migrate older patterns** when doing version upgrades
3. **Feature flags are mandatory** for API version changes
4. **Test both versions** in your test suite
5. **Document changelog URL** in version constant comments
6. **Use consistent naming** for feature flags
7. **Pass features through** the entire call chain
