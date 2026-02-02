# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (requires Node 18.17+ or 22.13+)
yarn --ignore-optional && yarn install && yarn build

# Run all tests (uses Nx caching)
yarn test                    # For Segment employees
yarn test-partners           # For external partners (excludes internal packages)

# Run tests for a specific destination
yarn jest packages/destination-actions/src/destinations/<destination-name>/__tests__/

# Run a single test file
yarn jest packages/destination-actions/src/destinations/slack/__tests__/slack.test.ts

# Generate TypeScript types from field schemas
./bin/run generate:types

# Start local dev server (default port 3000)
./bin/run serve
PORT=3001 ./bin/run serve    # Custom port

# Scaffold new destination
./bin/run init

# Add action to existing destination
./bin/run generate:action <ACTION_NAME> <browser|server>

# Lint and typecheck
yarn lint
yarn typecheck

# Clean rebuild
yarn clean-build

# Clear Nx cache
nx clear-cache
```

## Repository Architecture

This is a monorepo using Lerna (publishing), Nx (building/testing/caching), and Yarn Workspaces.

### Key Packages

- **`packages/destination-actions`** - Cloud-mode destinations (~210 implementations). New destinations must be registered in `src/index.ts`
- **`packages/browser-destinations`** - Device-mode destinations (~50 implementations). New destinations must be registered in `packages/destinations-manifest/index.ts`
- **`packages/core`** - Core runtime, types, mapping-kit transforms. Changes here affect all destinations
- **`packages/cli`** - CLI tools for scaffolding, serving, type generation
- **`packages/actions-shared`** - Internal Segment utilities (not available to partners)

### Destination Structure

```
packages/destination-actions/src/destinations/<name>/
├── index.ts                 # DestinationDefinition export
├── generated-types.ts       # Auto-generated from fields
├── <action-name>/
│   ├── index.ts            # ActionDefinition with perform()
│   └── generated-types.ts  # Payload interface
└── __tests__/
    └── *.test.ts           # Jest tests with nock mocking
```

### Core Patterns

**Destination Definition:**

```typescript
const destination: DestinationDefinition<Settings> = {
  name: 'Example',
  slug: 'actions-example',
  mode: 'cloud',
  authentication: { scheme: 'custom', fields: {...}, testAuthentication: async (request) => {...} },
  extendRequest: ({ settings }) => ({ headers: { Authorization: `Bearer ${settings.apiKey}` } }),
  actions: { actionName: {...} }
}
```

**Action Definition:**

```typescript
const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: { label: 'Event', type: 'string', required: true, default: { '@path': '$.event' } }
  },
  perform: async (request, { payload, settings }) => {
    return request('https://api.example.com', { method: 'POST', json: payload })
  },
  performBatch: async (request, { payload }) => {
    /* payload is array */
  }
}
```

### Field Types & Mapping Directives

Field types: `string`, `text`, `number`, `integer`, `boolean`, `datetime`, `password`, `object`

Mapping directives for defaults:

- `{ '@path': '$.properties.value' }` - Extract from event
- `{ '@template': 'Hello {{name}}' }` - Template string
- `{ '@if': { exists: {...}, then: {...}, else: {...} } }` - Conditional

### Testing Pattern

```typescript
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

it('should send event', async () => {
  nock('https://api.example.com').post('/events').reply(200)

  await testDestination.testAction('sendEvent', {
    event: createTestEvent({ event: 'Test' }),
    mapping: { eventName: 'Test' },
    settings: { apiKey: 'test-key' },
    useDefaultMappings: true
  })
})
```

### Error Classes (from `@segment/actions-core`)

- `IntegrationError` - General destination error
- `PayloadValidationError` - Field validation failure (not retried)
- `InvalidAuthenticationError` - Auth failure (not retried)
- `RetryableError` - Transient error (will retry)
- `APIError` - HTTP error with status code

## Critical Guidelines

### Security

- Always use `type: 'password'` for API keys, tokens, secrets, and credentials
- Use `processHashing` utility for PII hashing instead of direct crypto calls
- Never log sensitive information

### Breaking Changes

- Never add required fields to existing actions
- Never change field types in ways that break existing integrations
- For high-volume destinations (Facebook, Google, etc.), use feature flags for rollouts

### Code Quality

- Write tests for success and failure scenarios using nock for HTTP mocking
- Use conditionally required fields (`required: { conditions: [...] }`) for complex validation
- Use `depends_on` for conditional field visibility
- Implement `performBatch` for high-throughput destinations

### ESLint Environment Rules

- `destination-actions`: Can use Node.js APIs (process, Buffer, fs, crypto)
- `core`/`actions-shared`: Cannot use Node.js or browser-specific APIs
- `browser-destinations`: Can use browser APIs (window, document, localStorage)
