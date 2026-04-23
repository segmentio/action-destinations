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

| Spec Auth Type | Code Pattern |
|---|---|
| OAuth 2.0 | `scheme: 'oauth2'` with `refreshAccessToken` |
| API Key | `scheme: 'custom'` with key in `fields` |
| Basic Auth | `scheme: 'basic'` with username/password |

### Event Types

| Spec Event | `defaultSubscription` |
|---|---|
| identify | `'type = "identify"'` |
| track | `'type = "track"'` |
| track + identify | `'type = "track" or type = "identify"'` |
| track (specific event) | `'type = "track" and event = "Event Name"'` |

### Field Types

| Spec Type | Actions Field Type |
|---|---|
| String / Email / Phone / URL / Select | `type: 'string'` |
| Number / Integer | `type: 'number'` |
| Boolean | `type: 'boolean'` |
| Date / DateTime | `type: 'datetime'` |
| Object / JSON | `type: 'object'` |
| Array of objects | `type: 'object'` with `multiple: true` |

### Default Paths

| Segment Field | `@path` Expression |
|---|---|
| traits.* | `'$.traits.<field>'` |
| properties.* | `'$.properties.<field>'` |
| userId | `'$.userId'` |
| anonymousId | `'$.anonymousId'` |
| event | `'$.event'` |
| timestamp | `'$.timestamp'` |

### Action Pattern Detection

| Spec Pattern | Code Pattern |
|---|---|
| "upsert" | Query API then create/update |
| "batch" / "bulk" | `performBatch` with chunking |
| "hash" / "SHA-256" | `crypto.createHash('sha256')` helper |
| "archive" / "delete" | PATCH with `{archived: true}` or DELETE |
| "create if not found" | try/catch with 404 fallback to POST |

## Code Style Rules

- Use `import type` for type-only imports
- Use `async/await` in all perform functions
- Use `request()` from actions-core (not `fetch`)
- Use `json` option on request (not `body: JSON.stringify(...)`)
- Action names: `camelCase` in code, `kebab-case` for folders
- Always `export default` for actions and destination
- Shared helpers go in a root-level utility file
- Follow error handling patterns from `packages/core/src/errors.ts`

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
