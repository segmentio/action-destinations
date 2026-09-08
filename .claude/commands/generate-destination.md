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
- `__tests__/index.test.ts` and `__tests__/snapshot.test.ts` patterns
- How `extendRequest`, `authentication`, `presets`, and `actions` are wired up
- **File organization**: hand-written `types.ts`, `constants.ts`, and `utils.ts` at the destination root (e.g. `braze/`, `klaviyo/`, `amazon-amc/`)
- **Batching**: `performBatch` + `enable_batching` / `batch_size` / `batch_keys` field definitions (e.g. `klaviyo/removeProfileFromList/`, `klaviyo/properties.ts`)

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
├── generated-types.ts                # Settings interface (auto-generated)
├── constants.ts                      # Base URL, endpoint paths, enums, defaults
├── types.ts                          # Hand-written request/response interfaces
├── utils.ts                          # Send-event logic, transforms, batch builders
├── <action-kebab-case>/              # One folder per action
│   ├── index.ts                      # ActionDefinition (perform + performBatch)
│   ├── generated-types.ts            # Payload interface (auto-generated)
│   └── __tests__/
│       └── index.test.ts
└── __tests__/
    ├── index.test.ts                 # Destination-level tests
    └── snapshot.test.ts              # Snapshot tests (all actions, required + all fields)
```

> **File-organization rule (do NOT inline everything into the action `index.ts`):**
>
> - `constants.ts` — the API base URL, endpoint path constants (include BOTH the single and batch endpoint paths when a batch endpoint exists), and any fixed enums (e.g. allowed action values). Import these into the action instead of hardcoding string literals inline.
> - `types.ts` — explicit TypeScript interfaces for **every request body and API response object** the destination sends or receives. Never send an untyped inline object or read an `any` response.
> - `utils.ts` — the actual "send event" logic and payload transforms (single + batch). The action `index.ts` `perform`/`performBatch` should be thin wrappers that build the typed payload and delegate to a `utils.ts` function.
>
> For a genuinely trivial single-action destination you may keep `constants.ts`/`types.ts`/`utils.ts` minimal, but they should still exist and hold the endpoint constant, the request/response types, and the send logic respectively — do not collapse them back into the action file.

### Step 5: Generate Files

Generate in this order:

1. `constants.ts` (base URL, endpoint paths, enums, defaults)
2. `types.ts` (request body + API response interfaces)
3. `utils.ts` (send-event logic, transforms, batch payload builders — imports from `constants.ts`/`types.ts`)
4. `generated-types.ts` (root Settings)
5. `index.ts` (root DestinationDefinition)
6. For each action: `generated-types.ts`, `index.ts` (thin `perform`/`performBatch` delegating to `utils.ts`), `__tests__/index.test.ts`
7. `__tests__/index.test.ts` (root)
8. `__tests__/snapshot.test.ts` (root) — see Snapshot Tests section

Follow the patterns from the destinations you read in Step 1.

### Step 6: Do NOT register a destination ID

**Do NOT add a `register('<id>', './<slug>')` line to `packages/destination-actions/src/destinations/index.ts`.**

The metadata ID is a real MongoDB ObjectId assigned when the destination is created in Segment's production control plane, and IDs must match across environments (synced via `sprout`). Inventing a placeholder ID and committing it to the registry is incorrect — it pollutes the shared registry with a fake ID and can collide or break staging sync.

Instead:

- Leave `destinations/index.ts` untouched.
- In the post-output summary and the PR description, add a clearly-marked **TODO**: "Register this destination in `destinations/index.ts` with the production-assigned metadata ID before merging" and explain that the ID comes from creating the destination in production.

If the user explicitly says they already have a production metadata ID, register with that real ID — never a generated/random one.

### Step 7: Generate Types

Run `yarn types --path packages/destination-actions/src/destinations/<destination-slug>` to regenerate types.

### Step 8: Validate

Run tests. Note the repo has a Jest version quirk: the `yarn cloud jest` wrapper may resolve to an incompatible root Jest. If you hit a `Cannot read properties of undefined (reading 'bind')` error, run the package-local binary directly instead:

```bash
cd packages/destination-actions && TZ=UTC ./node_modules/.bin/jest --testPathPattern="<destination-slug>"
```

Run both the unit tests and the snapshot tests. On first snapshot run, snapshots are written; review the generated `__snapshots__/` output to confirm the request bodies look correct, then commit them.

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

| Spec Pattern                         | Code Pattern                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| "upsert"                             | Query API then create/update                                                                   |
| Any event-sending action             | Implement BOTH `perform` and `performBatch` (see Batching section)                             |
| Action has a batch/bulk endpoint     | `performBatch` posts the array to the **batch endpoint** (not a loop over the single endpoint) |
| Single & batch body shapes identical | `perform`/`performBatch` reuse ONE `utils.ts` builder (see "When can they reuse")              |
| "hash" / "SHA-256"                   | `crypto.createHash('sha256')` helper                                                           |
| "archive" / "delete"                 | PATCH with `{archived: true}` or DELETE                                                        |
| "create if not found"                | try/catch with 404 fallback to POST                                                            |

## Batching (REQUIRED for event-sending actions)

Every action that sends events/records to an API MUST implement batching unless the API genuinely has no way to accept more than one record per call (rare — confirm before skipping, and note it in the PR if you do).

**Note:** Segment's platform does the actual chunking before calling `performBatch` — you do NOT implement chunking logic. You implement the field declarations and a `performBatch` handler that sends an array.

**Field declarations** (add to the action's `fields`, mirroring `klaviyo/properties.ts`):

```typescript
enable_batching: {
  type: 'boolean',
  label: 'Batch Data',
  description: 'When enabled, sends events to the API in batches.',
  default: true
},
batch_size: {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: false,
  unsafe_hidden: true,
  default: 1000
  // add minimum/maximum only if the API documents record-count limits
},
batch_keys: {
  label: 'Batch Keys',
  description: 'The keys to use for batching the events.',
  type: 'string',
  unsafe_hidden: true,
  required: false,
  multiple: true,
  default: ['<low-cardinality-grouping-field>']  // e.g. ['list_id'] — omit if not needed
}
```

- `batch_keys` groups events that must be sent together (e.g. same list/audience). Use a **low-cardinality** field. Omit `batch_keys` entirely if the API endpoint has no per-group requirement.
- Keep `batch_size` and `batch_keys` `unsafe_hidden: true` unless the customer genuinely needs control. Only expose `batch_size` with `minimum`/`maximum` when the API documents a records-per-request limit.

### Prefer the batch endpoint for `performBatch`

If the endpoint-mapping / spec identifies a dedicated **batch/bulk endpoint** for an action (see the `batchEndpoint` object in `endpoint-mapping.json`), `performBatch` MUST target that endpoint — not loop the single-record endpoint. Use the mapping's `arrayWrapperKey` to shape the body (root array vs `{ "<key>": [...] }`) and honor `maxRecordsPerRequest` when setting `batch_size` limits.

Decision order for `performBatch`:

1. **Dedicated batch endpoint exists** → post the array (wrapped per `arrayWrapperKey`) to the batch endpoint in a single request. Preferred.
2. **Single endpoint accepts an array** (`sameAsSingle: true`) → post the array to that same endpoint.
3. **Only a single-record endpoint exists** → fan out with `Promise.all` over the single endpoint as a fallback, and note in the PR that the API has no native batch endpoint.

Never send a batch to the single-record endpoint when a batch endpoint is available.

### Handler shape — reuse ONE builder when the payloads are identical

`perform` and `performBatch` should delegate to the same `utils.ts` builder **whenever the single and batch request bodies are the same shape** (i.e. the single path is just a batch of one). This is the common case and keeps the two paths from drifting:

```typescript
perform: (request, { payload, settings }) => {
  return sendEvents(request, settings, [payload])
},
performBatch: (request, { payload, settings }) => {
  // payload is an array here
  return sendEvents(request, settings, payload)
}
```

Where `sendEvents(request, settings, payloads: Payload[])` lives in `utils.ts`, maps each payload to the typed request body (from `types.ts`), and posts to the batch endpoint constant (from `constants.ts`).

**When can `perform` and `performBatch` reuse the same function?** Reuse a single `payloads: Payload[]` builder when ALL of these hold:

- The single and batch endpoints share the **same request body element shape** (each record serializes identically whether alone or in a batch).
- The batch endpoint accepts an **array of those same records** (root array or a simple `{ "<key>": [...] }` wrapper) — no per-record fan-out, no different envelope.
- The single call is semantically "a batch of one" — same auth, same path params (or params derived per-record inside the builder), same response handling.

When these hold, write ONE `sendEvents(request, settings, payloads)` function and have both handlers call it (`perform` with `[payload]`, `performBatch` with `payload`).

**Do NOT force reuse — split into separate functions — when any of these differ:**

- The single endpoint and batch endpoint have **different body shapes or envelopes** that aren't just "wrap the array" (e.g. single is `{ user: {...} }` but batch is `{ operations: [{ method, body }] }`).
- The batch path requires **per-record metadata** (per-record method/op, per-record path) that the single path doesn't.
- **No batch endpoint exists** and `performBatch` must fan out over the single endpoint (`Promise.all`) — keep the single-record builder shared and let `performBatch` map over it, rather than pretending it's one call.
- Response handling or error semantics differ between the two (e.g. batch returns per-record status; single throws directly).

In those cases, still keep both builders in `utils.ts` (e.g. `buildSingleRequest` and `buildBatchRequest`), and have each handler delegate to its own. The goal is: reuse when the shapes are genuinely the same, split cleanly when they aren't — never inline the logic into the action `index.ts`, and never duplicate identical mapping logic across the two handlers.

## Typed Requests and Responses (REQUIRED)

Do NOT build inline untyped objects or read `any` responses. In `types.ts`, define an interface for **every** request body and API response shape, then use them:

```typescript
// types.ts
export interface ConversionEventRequest {
  eid: string
  a: string
  aid: string
  ts: number
  // ...
}

export interface ConversionEventResponse {
  status: string
  id?: string
}
```

```typescript
// utils.ts
import type { ConversionEventRequest, ConversionEventResponse } from './types'

export function sendEvents(request: RequestClient, settings: Settings, payloads: Payload[]) {
  const body: ConversionEventRequest[] = payloads.map((p) => ({
    /* typed mapping */
  }))
  return request<ConversionEventResponse>(ENDPOINT, { method: 'POST', json: body })
}
```

- The request body variable must be annotated with the request interface.
- Type the `request<ResponseType>(...)` call with the response interface so `response.data` is typed.

## Snapshot Tests (REQUIRED)

In addition to `__tests__/index.test.ts` (happy path + edge cases), generate `__tests__/snapshot.test.ts` following the repo convention (see `trackey`, `metronome`, `movable-ink`). It uses the shared `generateTestData` helper, loops over every action, and snapshots the request body for both "required fields" and "all fields":

```typescript
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-<slug>'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({ properties: eventData })
      const responses = await testDestination.testAction(actionSlug, {
        event,
        mapping: event.properties,
        settings: settingsData,
        auth: undefined
      })

      const request = responses[0].request
      const rawBody = await request.text()
      try {
        const json = JSON.parse(rawBody)
        expect(json).toMatchSnapshot()
        return
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }
      expect(request.headers).toMatchSnapshot()
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({ properties: eventData })
      const responses = await testDestination.testAction(actionSlug, {
        event,
        mapping: event.properties,
        settings: settingsData,
        auth: undefined
      })

      const request = responses[0].request
      const rawBody = await request.text()
      try {
        const json = JSON.parse(rawBody)
        expect(json).toMatchSnapshot()
        return
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }
    })
  }
})
```

Adjust the `destinationSlug` constant to match the destination's `slug`. Run the suite once to generate `__snapshots__/`, review it, and commit the snapshots.

## Code Style Rules

- Use `import type` for type-only imports
- Use `async/await` in all perform functions
- Use `request()` from actions-core (not `fetch`)
- Use `json` option on request (not `body: JSON.stringify(...)`)
- Action names: `camelCase` in code, `kebab-case` for folders
- Always `export default` for actions and destination
- Endpoint URLs and fixed enums live in `constants.ts` — never hardcode string literals inline
- Request bodies and API responses are typed via interfaces in `types.ts` — never inline untyped objects or `any` responses
- Send/transform/batch logic lives in `utils.ts`; `perform`/`performBatch` are thin wrappers
- Follow error handling patterns from `packages/core/src/errors.ts`

## Constraints

- **DO NOT** use hardcoded templates — read the actual repo for patterns
- **DO NOT** hardcode credentials or secrets
- **DO NOT** skip tests — every action needs at least 2 unit tests (happy path + edge case) PLUS snapshot tests
- **DO NOT** register a destination ID in `destinations/index.ts` with a placeholder/generated ID — leave registration as a TODO for the production-assigned ID (see Step 6)
- **DO NOT** collapse `constants.ts` / `types.ts` / `utils.ts` back into the action `index.ts`
- **DO NOT** skip `performBatch` for event-sending actions unless the API cannot accept multiple records (and say so in the PR)
- **DO NOT** loop the single-record endpoint in `performBatch` when a dedicated batch endpoint exists — target the batch endpoint
- **DO NOT** duplicate identical single/batch mapping logic across `perform` and `performBatch` — share ONE `utils.ts` builder when the request shapes match; split into separate builders only when they genuinely differ
- **DO NOT** send untyped request bodies or read untyped (`any`) responses

## Quality Checklist

- [ ] All actions from the spec are implemented
- [ ] Every action has fields with proper types and defaults
- [ ] Every action has a `perform` function hitting the correct endpoint
- [ ] Every event-sending action implements `performBatch` with `enable_batching` / `batch_size` (+ `batch_keys` if grouping is needed)
- [ ] `performBatch` targets the dedicated batch endpoint when one exists (single-endpoint fan-out only as a documented fallback)
- [ ] `perform` and `performBatch` share ONE `utils.ts` builder when request shapes match; split into separate builders only where they genuinely differ (no duplicated mapping logic)
- [ ] `constants.ts`, `types.ts`, and `utils.ts` exist; endpoint/enums, request+response interfaces, and send logic are separated out
- [ ] All request bodies and API responses are typed (no inline untyped objects, no `any` responses)
- [ ] Every action has at least 2 unit tests (happy path + edge case)
- [ ] `__tests__/snapshot.test.ts` exists and snapshots are generated + reviewed
- [ ] Root `index.ts` imports and registers all actions
- [ ] `generated-types.ts` files match field definitions
- [ ] Destination is NOT registered with a placeholder ID in `destinations/index.ts` (registration left as a TODO for the production ID)
- [ ] Tests pass
- [ ] No hardcoded credentials or secrets

## Post-Output

After generating all files, print a summary:

```
Destination generated for <Destination Name>
   Location: packages/destination-actions/src/destinations/<slug>/
   Actions: <count> (batching: <enabled/reason-if-not>)
   Files: constants.ts, types.ts, utils.ts, index.ts + per-action folders
   Unit tests: <count>   Snapshot tests: generated for <count> actions
   Registered in index: NO — TODO: add register('<PROD_METADATA_ID>', './<slug>') once the
                        destination is created in production (ID must match across environments)

To verify:
   yarn types --path packages/destination-actions/src/destinations/<slug>
   cd packages/destination-actions && TZ=UTC ./node_modules/.bin/jest --testPathPattern="<slug>"
```
