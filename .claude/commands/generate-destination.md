---
name: generate-destination
description: Generate a complete Segment Actions Destination with production-ready code, tests, and types. Reads existing destinations in the repo for patterns.
argument-hint: [destination-name]
allowed-tools: Read, Write, Bash, Glob, Grep, Agent
---

# Generate Segment Actions Destination

You are a Segment Actions Destination code generator. Given a destination name and its requirements, you produce a complete, production-ready destination by following the exact patterns from this repository.

## Reference

**You MUST read existing destinations in `packages/destination-actions/src/destinations/` before generating code.** Browse 2-3 similar destinations to understand the current patterns for:

- Root `index.ts` (DestinationDefinition) structure
- Action `index.ts` (ActionDefinition) structure
- `generated-types.ts` files
- `__tests__/index.test.ts` patterns
- How `extendRequest`, `authentication`, `presets`, and `actions` are wired up
- How `testAuthentication` validates fields and verifies credentials

Use the actual repo code as your template — not hardcoded templates.

## Input Requirements

1. **Destination name** — passed as `$ARGUMENTS`
2. **Destination requirements** — ask the user to provide one of:
   - A spec document (file path or pasted text)
   - A PRD with API details
   - API documentation
   - Any description of the actions, fields, endpoints, and auth needed

If any input is missing, ask the user before proceeding.

## Step-by-Step Process

### Step 1: Study the Repo

Read 2-3 existing destinations similar to what's being built (e.g., same auth type, similar action patterns). Note the exact code conventions used.

### Step 2: Parse the Requirements

Extract: authentication type/fields/settings, base URL, API version, all actions with names/descriptions/subscriptions/fields/endpoints/special logic, error handling, Engage/RETL flags.

### Step 3: Determine Output Location

The destination goes in `packages/destination-actions/src/destinations/<destination-slug>/`. Confirm with the user.

### Step 4: Create Folder Structure

```
<destination-slug>/
├── index.ts                          # Main DestinationDefinition
├── generated-types.ts                # Settings interface
├── <action-kebab-case>/              # One folder per action
│   ├── index.ts                      # ActionDefinition
│   ├── generated-types.ts            # Payload interface
│   └── __tests__/
│       └── index.test.ts
└── __tests__/
    └── index.test.ts                 # Destination-level tests
```

### Step 5: Generate Files

Generate in this order:

1. `generated-types.ts` (root Settings)
2. `index.ts` (root DestinationDefinition)
3. For each action: `generated-types.ts`, `index.ts`, `__tests__/index.test.ts`
4. `__tests__/index.test.ts` (root)

Follow the patterns from the destinations you read in Step 1.

### Step 6: Register the Destination

Add the new destination to `packages/destination-actions/src/index.ts`.

### Step 7: Generate Types

Run `yarn types --path packages/destination-actions/src/destinations/<destination-slug>` to regenerate types.

### Step 8: Validate

Run tests: `yarn cloud jest --testPathPattern="<destination-slug>"`

Print file listing and summary table of all actions with event types, endpoints, field counts.

## Spec-to-Code Mapping Rules

### Authentication

| Spec Auth Type | Code Pattern                                 |
| -------------- | -------------------------------------------- |
| OAuth 2.0      | `scheme: 'oauth2'` with `refreshAccessToken` |
| API Key        | `scheme: 'custom'` with key in `fields`      |
| Basic Auth     | `scheme: 'basic'` with username/password     |

### Event Types

| Spec Event             | `defaultSubscription`                       |
| ---------------------- | ------------------------------------------- |
| identify               | `'type = "identify"'`                       |
| track                  | `'type = "track"'`                          |
| track + identify       | `'type = "track" or type = "identify"'`     |
| track (specific event) | `'type = "track" and event = "Event Name"'` |

### Field Types

| Spec Type                             | Actions Field Type                     |
| ------------------------------------- | -------------------------------------- |
| String / Email / Phone / URL / Select | `type: 'string'`                       |
| Number / Integer                      | `type: 'number'`                       |
| Boolean                               | `type: 'boolean'`                      |
| Date / DateTime                       | `type: 'datetime'`                     |
| Object / JSON                         | `type: 'object'`                       |
| Array of objects                      | `type: 'object'` with `multiple: true` |

### Default Paths

| Segment Field | `@path` Expression       |
| ------------- | ------------------------ |
| traits.\*     | `'$.traits.<field>'`     |
| properties.\* | `'$.properties.<field>'` |
| userId        | `'$.userId'`             |
| anonymousId   | `'$.anonymousId'`        |
| event         | `'$.event'`              |
| timestamp     | `'$.timestamp'`          |

### Action Pattern Detection

| Spec Pattern          | Code Pattern                                        |
| --------------------- | --------------------------------------------------- |
| "upsert"              | Query API then create/update                        |
| "batch" / "bulk"      | `performBatch` with batch config fields (see below) |
| "hash" / "SHA-256"    | `crypto.createHash('sha256')` helper                |
| "archive" / "delete"  | PATCH with `{archived: true}` or DELETE             |
| "create if not found" | try/catch with 404 fallback to POST                 |

## Batch Configuration Fields

When implementing `performBatch`, always include ALL of these platform batch fields:

- `enable_batching` — `type: 'boolean'`, `unsafe_hidden: true`, `default: true`
- `batch_size` — `type: 'number'`, set `default` and `maximum` to the API's per-request item limit
  - If customer should control it: `unsafe_hidden: false` with `minimum` and `maximum` validation
  - If not: `unsafe_hidden: true`
  - Add `disabledInputMethods: ['variable', 'function', 'freeform', 'enrichment']`
- `batch_bytes` — `type: 'number'`, `unsafe_hidden: true`, `required: true`
  - Set `default` to the API's request body size limit (e.g. `1000000` for 1MB)
  - If unknown, default to `4000000` (4MB)
- `batch_keys` — `type: 'string'`, `multiple: true`, `unsafe_hidden: true`
  - Set `default` to the field names that events MUST share within a single batch
  - Think: "if two events have different values for this field, would performBatch break?"
  - Example: if all events must go to the same stream → `default: ['streamName', 'awsRegion']`
  - Example: if all events must target the same endpoint → `default: ['endpoint_url']`

These are the only 4 platform batch fields. No others exist.

Additionally, add `disabledInputMethods: ['variable', 'function', 'freeform', 'enrichment']` to any field that should be static configuration (region selectors, batch fields, fields where dynamic per-event computation doesn't make sense).

## Code Style Rules

- Use `import type` for type-only imports
- Use `async/await` in all perform functions
- Use `request()` from actions-core (not `fetch`)
- Use `json` option on request (not `body: JSON.stringify(...)`)
- Action names: `camelCase` in code, `kebab-case` for folders
- Always `export default` for actions and destination
- Shared helpers go in a root-level utility file
- Follow error handling patterns from `packages/core/src/errors.ts`
- Always include `testAuthentication`. It must: (1) validate field formats if the field has a known format constraint, (2) make a lightweight API call to verify credentials work. Use `IntegrationError(message, 'ERROR_CODE', statusCode)` for errors — never `InvalidAuthenticationError`.
- Always destructure at the point of use:
  - Settings: `const { apiKey, region } = settings`
  - Payload: `const { userId, email, phone } = payload`
  - Perform context: `{ settings, payload, statsContext, logger, signal }`
  - Never use property chains like `settings.apiKey` or `payload.userId`

## Platform Context Parameters

Every `perform` and `performBatch` function MUST destructure and pass these platform parameters:

```typescript
perform: async (_request, { settings, payload, statsContext, logger, signal }) => {
  await send(settings, [payload], statsContext, logger, signal)
},
performBatch: async (_request, { settings, payload, statsContext, logger, signal }) => {
  await send(settings, payload, statsContext, logger, signal)
}
```

In the shared send/utility function:

- Use `statsContext?.statsClient?.incr()` for counters (request hits, errors by type)
- Use `statsContext?.statsClient?.histogram()` for batch sizes
- Use `logger?.crit()` for critical failures
- Pass `signal` to any SDK client or HTTP call that supports AbortSignal
- Handle `AbortError` by throwing `RequestTimeoutError`

```typescript
import { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { RequestTimeoutError, MultiStatusResponse, IntegrationError, JSONLikeObject } from '@segment/actions-core'

export const send = async (
  settings: Settings,
  payloads: Payload[],
  statsContext: StatsContext | undefined,
  logger: Logger | undefined,
  signal?: AbortSignal
): Promise<MultiStatusResponse> => {
  statsContext?.statsClient?.histogram('actions_<slug>.batch_size', payloads.length, statsContext?.tags)
  statsContext?.statsClient?.incr('actions_<slug>.request_hit', 1, statsContext?.tags)

  try {
    const response = await client.send(command, { abortSignal: signal })
    // handle response...
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new RequestTimeoutError()
    }
    logger?.crit('Failed to send batch:', error)
    handleError(error, statsContext)
  }
}
```

## MultiStatusResponse Format

When building MultiStatusResponse:

- `sent` = the original Segment payload as `JSONLikeObject` — **NOT** `JSON.stringify()`
- `body` = the API response object as-is — **NOT** `JSON.stringify()`
- Always include BOTH `sent` and `body` on every response (success and error)

```typescript
// CORRECT:
multiStatusResponse.setSuccessResponseAtIndex(index, {
  status: 200,
  body: record,
  sent: payloads[index] as unknown as JSONLikeObject
})

multiStatusResponse.setErrorResponseAtIndex(index, {
  status: statusCode,
  errormessage: record.ErrorMessage,
  sent: payloads[index] as unknown as JSONLikeObject,
  body: record
})

// WRONG — never stringify:
// sent: JSON.stringify(event)    ← NO
// body: JSON.stringify(record)   ← NO
```

## Error Code Status Map

When the destination API returns specific error codes, create a map with per-code HTTP status codes. Do NOT collapse all errors into "retryable" (429) vs "non-retryable" (400). Each error type needs a specific status so the platform takes the correct action.

```typescript
const ERROR_CODE_STATUS_MAP: Record<string, number> = {
  // Throttling → 429 (platform retries automatically)
  ThrottlingException: 429,
  RateLimitExceeded: 429,
  ProvisionedThroughputExceededException: 429,

  // Auth/Permission → 403 (surfaces as auth issue to customer)
  AccessDeniedException: 403,
  Forbidden: 403,

  // Not found → 404 (surfaces as config issue)
  ResourceNotFoundException: 404,

  // Token expired → 511 (triggers re-auth)
  ExpiredTokenException: 511,
  InvalidIdentityTokenException: 511,

  // Server errors → 503 (platform retries with backoff)
  InternalFailure: 503,
  ServiceUnavailable: 503
}

const convertErrorCodeToStatus = (code?: string): number => {
  if (!code) return 500
  return ERROR_CODE_STATUS_MAP[code.trim()] ?? 500
}
```

Use per-error metrics: `statsContext?.statsClient?.incr(\`actions\_<slug>.error.${errorCode}\`, 1, statsContext?.tags)`

## Authentication Error Handling

- **NEVER** import or use `InvalidAuthenticationError` — it has no error code or status code fields
- **ALWAYS** use `IntegrationError(message, 'ERROR_CODE', statusCode)` for ALL errors including auth errors
- Do NOT import `InvalidAuthenticationError` from `@segment/actions-core`

```typescript
// WRONG — do NOT do this:
import { InvalidAuthenticationError } from '@segment/actions-core'
throw new InvalidAuthenticationError('Invalid credentials')

// CORRECT — always do this:
import { IntegrationError } from '@segment/actions-core'
throw new IntegrationError('The provided IAM Role ARN format is not valid', 'INVALID_IAM_ROLE_ARN_FORMAT', 400)
```

## testAuthentication Pattern

`testAuthentication` must do TWO things in order:

1. **Validate field formats locally** (fast, no network call):

   - Derive the correct validation from the API docs or known field constraints
   - Examples: regex for structured IDs, prefix check for API keys, URL format for endpoints
   - If invalid → throw `IntegrationError` with descriptive code BEFORE making any API call

2. **Make a lightweight API call** (verifies credentials actually work):
   - Use cheapest possible call (list 1 item, get account info, etc.)
   - If it fails → throw `IntegrationError` with the API's error message

The validation in step 1 is destination-specific. Figure out the right check from the API docs:

```typescript
// Example: AWS ARN field → regex
if (!/^arn:aws:iam::\d{12}:role\/[A-Za-z0-9+=,.@_\-/]+$/.test(iamRoleArn)) {
  throw new IntegrationError('Invalid IAM Role ARN format', 'INVALID_IAM_ROLE_ARN_FORMAT', 400)
}

// Example: API key with known prefix → prefix check
if (!apiKey.startsWith('sk_')) {
  throw new IntegrationError('API key must start with sk_', 'INVALID_API_KEY_FORMAT', 400)
}

// Example: endpoint URL → URL format
if (!endpoint.startsWith('https://')) {
  throw new IntegrationError('Endpoint must use HTTPS', 'INVALID_ENDPOINT_FORMAT', 400)
}
```

## Constraints

- **DO NOT** use hardcoded templates — read the actual repo for patterns
- **DO NOT** hardcode credentials or secrets
- **DO NOT** skip tests — every action needs at least 2 tests (happy path + edge case)
- **DO NOT** skip registering the destination in the index

## Quality Checklist

- [ ] All actions from the spec are implemented
- [ ] Every action has fields with proper types and defaults
- [ ] Every action has a `perform` function hitting the correct endpoint
- [ ] Every action has at least 2 tests
- [ ] Root `index.ts` imports and registers all actions
- [ ] `generated-types.ts` files match field definitions
- [ ] Destination is registered in `packages/destination-actions/src/index.ts`
- [ ] Tests pass
- [ ] No hardcoded credentials or secrets

## Post-Output

After generating all files, print a summary:

```
Destination generated for <Destination Name>
   Location: packages/destination-actions/src/destinations/<slug>/
   Actions: <count>
   Tests: <count>
   Registered in index: Yes

To verify:
   yarn types --path packages/destination-actions/src/destinations/<slug>
   yarn cloud jest --testPathPattern="<slug>"
```
