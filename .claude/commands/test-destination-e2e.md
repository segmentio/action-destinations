---
name: test-destination-e2e
description: Generate a Jest e2e test file for a Segment Actions destination. Reads destination code, derives all test cases, and writes a test file that makes real HTTP calls to the local serve server.
argument-hint: [destination-slug]
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion, Agent, Write
---

# Segment Destination E2E Test Suite Generator

Reads the destination code and generates a Jest e2e test file covering every testable code path. The test file makes real HTTP calls to a running local serve server (`./bin/run serve`).

## Step 1: Get the Destination Slug

If `$ARGUMENTS` is provided use it as the slug. Otherwise ask the user for it.

## Step 2: Build a Complete Map of the Destination

Read EVERY file in `packages/destination-actions/src/destinations/<slug>/` and any shared libraries it imports. The goal is to understand everything the code does so that the test file tests all of it.

### 2a. Root `index.ts`

Path: `packages/destination-actions/src/destinations/<slug>/index.ts`

Extract:

- **Authentication scheme** — custom, oauth2, basic
- **Every authentication field** — name, type, required, description
- **`testAuthentication` function** — what it calls, what errors it can throw
- **`extendRequest`** — if present, what it adds to requests
- **Every action registered** — list of action names

### 2b. Each Action `index.ts`

Path: `packages/destination-actions/src/destinations/<slug>/<action>/index.ts`

Extract:

- **`defaultSubscription`** — which event types
- **Every field** — name, type, required, default, min, max, choices, description
- **`perform` function** — what it calls, what arguments it passes
- **`performBatch` function** — whether it exists, what it calls
- **`batch_size`** — default and max values

### 2c. Utils / Helper Files / All Other Source Files

Path: `packages/destination-actions/src/destinations/<slug>/utils.ts` and any other `.ts` files

Read EVERY source file. Extract:

- **Every function** — name, parameters, what it does
- **Every code branch** — every `if/else`, `try/catch`, `switch`, ternary, `||`, `??`
- **Every error map/class** — retryable errors, non-retryable errors, status codes
- **Every external call** — SDK clients, HTTP requests, what they send
- **Every metric** — `statsContext?.statsClient` calls with metric names
- **Every log statement** — what gets logged, whether any variables could contain sensitive data

### 2d. Shared Libraries

Follow every import to shared code (e.g. `src/lib/AWS/sts.ts`, `packages/core/src/errors.ts`). Extract:

- **What the shared code does** — function signatures, error types, credential chains
- **Multi-step flows** — e.g. credential assumption chains with multiple steps

### 2e. Generated Types

Path: `packages/destination-actions/src/destinations/<slug>/generated-types.ts` and `<action>/generated-types.ts`

Extract:

- **Settings interface** — field names and types
- **Payload interface** — field names and types

### 2f. Generate Numbered Test Plan

For every item found in 2a–2e, generate one numbered test line. Items that cannot be triggered via HTTP get a SKIP line with the reason.

**Coverage requirement:** The goal is full code coverage via HTTP requests. Every line of code that can be reached by an HTTP request must have a test. This means independently deriving from the code itself — every auth field variation, every required/optional field, every event type in `defaultSubscription`, every `if/else`/`try/catch`/ternary branch, every entry in every error map, every min/max constraint, every `perform` and `performBatch` path.

### 2g. Self-Verify the Test Plan

Before generating any files, cross-reference the test plan against the code:

- Go back through every file read in 2a–2e
- For each function, branch, field, error map entry, and event type — confirm there is a corresponding test line or SKIP
- If anything is missing, add it now

Do not proceed to Step 3 until this cross-check is complete.

## Step 3: Identify Required Variables

From the code map, identify every value that varies per environment:

- Every **authentication field** (e.g. `IAM_ROLE_ARN`, `IAM_EXTERNAL_ID`, `API_KEY`)
- Every **destination-specific mapping field** (e.g. `STREAM_NAME`, `QUEUE_URL`, `AWS_REGION`)
- **Base URL** → always `BASE_URL`, defaults to `http://localhost:3000`

These will be read from environment variables in the test file.

## Step 4: Generate the Jest E2E Test File

Write the test file to:
`packages/destination-actions/src/destinations/<slug>/__tests__/e2e.test.ts`

### Test file structure

```typescript
/**
 * E2E tests for <Destination Name>
 *
 * These tests make real HTTP calls to a running local serve server.
 * They are NOT run in CI — they require real infrastructure credentials.
 *
 * Prerequisites:
 *   1. Start the serve server:
 *      ./bin/run serve --destination <slug> --noUI
 *
 *   2. Set environment variables (or create a .env file):
 *      export BASE_URL=http://localhost:3000
 *      export <VAR_1>=<value>
 *      export <VAR_2>=<value>
 *
 *   3. Run the tests:
 *      yarn cloud jest --testPathPattern="<slug>/__tests__/e2e"
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
// Extract all other env vars needed

// Helper to POST JSON to the serve server
async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return {
    status: res.status,
    body: await res.json()
  }
}

// Helper to GET from the serve server
async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`)
  return {
    status: res.status,
    body: await res.json()
  }
}

describe('<Destination Name> E2E', () => {
  // Check server is running before all tests
  beforeAll(async () => {
    try {
      await get('/manifest')
    } catch {
      throw new Error('Serve server is not running. Start it with:\n' + '  ./bin/run serve --destination <slug> --noUI')
    }
  })

  describe('Authentication', () => {
    // Auth tests here — POST to /authenticate
  })

  describe('<Action Name>', () => {
    // Action tests here — POST to /<action-slug>
    // Group by: single events, batch events, validation errors, error paths
  })

  describe('Skipped (not testable via HTTP)', () => {
    // Skipped tests with .skip and comments explaining why
  })
})
```

### Test patterns

#### Authentication tests

```typescript
it('returns ok:true for valid credentials', async () => {
  const res = await post('/authenticate', {
    iamRoleArn: IAM_ROLE_ARN,
    iamExternalId: IAM_EXTERNAL_ID
  })
  expect(res.status).toBe(200)
  expect(res.body.ok).toBe(true)
})

it('returns ok:false for invalid ARN format', async () => {
  const res = await post('/authenticate', {
    iamRoleArn: 'not-an-arn',
    iamExternalId: IAM_EXTERNAL_ID
  })
  expect(res.status).toBe(200)
  expect(res.body.ok).toBe(false)
})
```

#### Action tests (single event)

```typescript
it('delivers a track event via perform()', async () => {
  const res = await post('/send', {
    settings: {
      iamRoleArn: IAM_ROLE_ARN,
      iamExternalId: IAM_EXTERNAL_ID
    },
    payload: {
      type: 'track',
      event: 'Test Event',
      messageId: 'msg-e2e-track',
      userId: 'user-1'
    },
    mapping: {
      payload: { '@path': '$.' },
      partitionKey: { '@path': '$.messageId' },
      streamName: STREAM_NAME,
      awsRegion: AWS_REGION
    }
  })
  expect(res.status).toBe(200)
  expect(Array.isArray(res.body)).toBe(true)
})
```

#### Action tests (batch)

```typescript
it('delivers batch events via performBatch()', async () => {
  const res = await post('/send', {
    settings: {
      iamRoleArn: IAM_ROLE_ARN,
      iamExternalId: IAM_EXTERNAL_ID
    },
    payload: [
      { type: 'track', event: 'Event 1', messageId: 'msg-1', userId: 'user-1' },
      { type: 'track', event: 'Event 2', messageId: 'msg-2', userId: 'user-2' }
    ],
    mapping: {
      payload: { '@path': '$.' },
      partitionKey: { '@path': '$.messageId' },
      streamName: STREAM_NAME,
      awsRegion: AWS_REGION
    }
  })
  expect(res.status).toBe(200)
  expect(Array.isArray(res.body)).toBe(true)
})
```

#### Validation error tests

```typescript
it('returns validation error for missing required field', async () => {
  const res = await post('/send', {
    settings: {
      iamRoleArn: IAM_ROLE_ARN,
      iamExternalId: IAM_EXTERNAL_ID
    },
    payload: {
      type: 'track',
      event: 'Test Event',
      messageId: 'msg-1',
      userId: 'user-1'
    },
    mapping: {
      payload: { '@path': '$.' },
      partitionKey: { '@path': '$.messageId' },
      // streamName intentionally omitted
      awsRegion: AWS_REGION
    }
  })
  expect(res.status).toBe(200)
  expect(res.body[0].message).toContain('streamName')
})
```

#### Skipped tests

```typescript
// Cannot trigger AccessDeniedException from Kinesis via HTTP.
// This branch fires when error.name === 'AccessDeniedException' from the Kinesis PutRecordsCommand.
it.skip('handleError AccessDeniedException branch → 403', () => {})
```

### Test assertions

- For successful auth: `expect(res.body.ok).toBe(true)`
- For failed auth: `expect(res.body.ok).toBe(false)` and optionally check `res.body.error`
- For successful send: `expect(res.status).toBe(200)` and `expect(Array.isArray(res.body)).toBe(true)`
- For validation errors: check `res.body[0].message` contains the expected field name
- For error paths: check `res.body[0].message` contains the expected error string and `res.body[0].statusCode`
- Use Jest matchers (`toBe`, `toContain`, `toEqual`, `toHaveProperty`) — NOT Chai-style (`to.equal`, `to.include`)

### Test timeouts

Set a generous timeout for the entire test suite since e2e tests make real network calls:

```typescript
// At the top level of describe, or in jest config
jest.setTimeout(30000) // 30 seconds per test
```

## Step 5: Print Usage Instructions

After writing the test file, print to the user:

```
Generated: packages/destination-actions/src/destinations/<slug>/__tests__/e2e.test.ts

1. Start the serve server (in a separate terminal):
   ./bin/run serve --destination <slug> --noUI

2. Set environment variables:
   export BASE_URL=http://localhost:3000
   export <VAR>=<description>
   ...

3. Run the tests:
   yarn cloud jest --testPathPattern="<slug>/__tests__/e2e"

Environment variables:
  <list each variable with a one-line description>
```

## Rules

### Testing philosophy

- **The code is the source of truth.** Every test must be derived from something found in Step 2. If the code doesn't do it, don't test it.
- **Every item in the code map gets a test.** Every auth field, every action field, every error map entry, every code branch — if it exists in the code, it gets tested or marked as untestable with a reason.
- **Do not follow a fixed checklist.** The number and type of tests depends entirely on what the code contains.

### Serve endpoint contract

- For `/authenticate`, send settings fields at the **root level** of the request body (not nested under `settings`)
- For `/<action>`, send `payload`, `settings`, and `mapping` as separate keys in the request body
- For batch tests, send `payload` as an **array** — the serve endpoint auto-detects batch vs single
- The serve endpoint returns `[]` for successful SDK-based calls

### File rules

- **One test file per destination.** All e2e tests go in `__tests__/e2e.test.ts`.
- **Never hardcode credentials.** All auth/config values must come from environment variables.
- **Hardcode everything else.** Event payloads, field names, error message patterns come from the code — not the user.
- **Do NOT read or reference existing test files** (`__tests__/*.test.ts`) — derive everything from source code directly.
- **Do NOT generate or modify destination source code** — this skill only generates e2e test files.
- **Use `fetch` for HTTP calls** — it's available natively in Node 18+. Do not add dependencies.
- **Group tests logically** — by auth, then by action, then by test type (single, batch, validation, error, skipped).
