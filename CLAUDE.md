# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Segment's Action Destinations repository - a monorepo for building streaming destinations with a customizable framework. It supports both cloud-mode (server-side) and device-mode (browser) destinations that allow customers to map Segment event sources to third-party tools.

### Key Concepts

- **Actions**: Functions that define what a destination does with events, including field definitions and perform logic
- **Destinations**: Collections of actions with shared authentication and configuration
- **Subscriptions**: JSON configurations that map Segment events to destination actions using FQL queries
- **Mapping Kit**: Tools for transforming and mapping data between Segment events and destination-specific formats
- **Batching**: Optional functionality to process multiple events in a single API call for efficiency

## Common Commands

### Build Commands

```bash
# Full build
yarn build               # Build all packages via NX + browser bundles
yarn clean-build         # Clean and rebuild everything

# Individual package builds (faster iteration)
yarn cloud build         # Build cloud-mode destinations only
yarn browser build-web   # Build browser-mode bundles only
yarn core build          # Build actions-core only

# Browser bundles from root
yarn build:browser-bundles  # Build only browser bundles
```

### Test Commands

```bash
# Run all tests
yarn test                # Run all tests (NX-based)
yarn test:clear-cache    # Clear test cache

# Individual package tests (faster iteration)
yarn cloud test          # Test cloud-mode destinations only
yarn browser test        # Test browser-mode destinations only
yarn core test           # Test actions-core only

# Specific test suites
yarn test-browser        # Run browser-specific tests
yarn test-partners       # Tests for partner-built destinations only

# Test a specific cloud-mode destination
yarn cloud jest --testPathPattern="slack"

# Test a specific browser-mode destination
yarn browser jest --testPathPattern="braze"

# Test a specific core module
yarn core jest --testPathPattern="mapping-kit"
```

### Lint & Type Checking

```bash
yarn lint                # ESLint on TypeScript files with cache
yarn typecheck           # TypeScript type checking across all packages
```

### Type Generation

```bash
yarn types               # Generate TypeScript definitions for all integrations
yarn types --path <glob>  # Generate types for specific paths
```

### Validation & Local Testing

```bash
yarn validate            # Validate all destination definitions
./bin/run serve [DESTINATION]  # Start local test server for a destination
```

## Architecture Overview

### Monorepo Structure

The project uses:

- **Yarn Workspaces** for dependency management
- **NX** for dependency-aware building and testing
- **Lerna** for publishing
- **TypeScript** with strict mode

### Core Packages

- **destination-actions** (`packages/destination-actions`): Cloud-mode destinations (~213 destinations). New destinations must be registered in `packages/destination-actions/src/index.ts`.
- **browser-destinations** (`packages/browser-destinations`): Device-mode (client-side) destinations. New destinations must be registered in `packages/destinations-manifest/index.ts`.
- **core** (`packages/core`): Runtime engine, destination-kit, mapping-kit, request client. Changes here affect all destinations — requires thorough regression testing.
- **destination-subscriptions** (`packages/destination-subscriptions`): Validates event payloads against an action's subscription AST.
- **browser-destination-runtime** (`packages/browser-destination-runtime`): Runtime for browser-mode destinations, handling action execution and event processing.
- **cli** (`packages/cli`): Command-line tools for scaffolding and local testing.
- **actions-shared**: Shared utilities across destinations.
- **ajv-human-errors** (`packages/ajv-human-errors`): Wrapper for AJV that produces user-friendly validation messages.

### Destination Definition Pattern

Every destination exports a `DestinationDefinition` object with:

```typescript
{
  name: string                      // Human-readable name
  slug: string                      // URL-friendly identifier
  mode: 'cloud' | 'device'          // Execution mode

  authentication: {                 // Auth scheme configuration
    scheme: string
    fields: Record<string, InputField>
    testAuthentication?: Function
  }

  extendRequest?: (ctx) => {}       // Add headers/auth to all requests

  actions: {
    [actionName]: ActionDefinition  // Discrete API operations
  }
}
```

### Action Definition Pattern

Each action represents a discrete operation:

```typescript
{
  title: string                      // Display name
  description: string

  fields: Record<string, InputField> // Configuration fields

  defaultSubscription?: string       // FQL query

  perform: (request, data) => {}     // Single-event handler
  performBatch?: (request, data) => {} // Batch handler
}
```

## Error Handling

Use the predefined error classes from `packages/core/src/errors.ts`. **Never** throw plain JavaScript `Error` objects from actions — all errors must include a message, error code, and status code.

### Built-in Error Handling

- **Payload validation errors**: Caught automatically when events don't match the `ActionDefinition` (e.g. missing required fields, wrong types). Not retried.
- **HTTP errors**: Caught automatically by the `request` object when `throwHttpErrors` is `true` (default). Retried based on status code (see `core/src/errors.ts`).
- **Authentication errors**: Invalid tokens/keys are captured as `InvalidAuthenticationError`. Standard auth error codes are handled automatically.

### Custom Error Classes

Use these instead of `throw new Error(...)`:

| Error Class                  | When to Use                                         | Retried?               |
| ---------------------------- | --------------------------------------------------- | ---------------------- |
| `PayloadValidationError`     | Custom event payload validation failures            | No                     |
| `InvalidAuthenticationError` | Authentication-related errors                       | No                     |
| `RetryableError`             | Transient errors where Segment should retry         | Yes                    |
| `APIError`                   | Re-throwing HTTP errors with more readable messages | Depends on status code |
| `IntegrationError`           | All other error scenarios                           | No                     |

To override automatic HTTP error handling, set `throwHttpErrors: false` on the request object, then handle the response and throw the appropriate custom error.

## Implementation Best Practices

### Field Definitions

- Define input fields with accurate types, clear labels, and helpful descriptions
- Use `type: 'password'` for any sensitive fields (API keys, tokens, secrets)
- Use appropriate format validation for string fields (email, URI, etc.)
- Leverage conditionally required fields for complex validation scenarios
- Use mapping kit directives for default field values when appropriate

### Batching

- Implement `performBatch` for high-volume destinations
- Use appropriate batch keys with low cardinality to avoid inefficient batching
- Test various batch sizes and edge cases

### Security

- Never expose or log sensitive information like auth tokens or PII
- Use the `processHashing` utility for PII hashing rather than direct crypto calls
- Mark sensitive fields with `type: 'password'`

### Performance

- Be mindful of API rate limits when making external requests
- Optimize code in action perform methods for high-volume event processing
- For critical high-volume destinations (e.g., Facebook, Google, Snapchat), use feature flags to safely roll out changes

## Development Workflow

### Creating a New Destination

```bash
# 1. Scaffold
./bin/run init                          # Interactive setup

# 2. Create actions
./bin/run generate:action track server
./bin/run generate:action identify server

# 3. Generate types
./bin/run generate:types

# 4. Test locally
./bin/run serve <slug>                 # Start test server
# Visit http://localhost:3000 in browser
```

### Adding a New Action

```bash
# 1. Create action scaffold
./bin/run generate:action <actionName> server

# 2. Generate types
./bin/run generate:types

# 3. Test
yarn test
```

## Key Files & Directories

- `packages/destination-actions/src/destinations/`: All cloud-mode destinations
- `packages/destination-actions/src/index.ts`: Cloud destination registry
- `packages/browser-destinations/destinations/`: All browser-mode destinations
- `packages/destinations-manifest/index.ts`: Browser destination registry
- `packages/core/src/destination-kit/`: Core destination framework
- `packages/core/src/mapping-kit/`: Mapping transformation logic
- `packages/core/src/errors.ts`: Error classes for custom error handling
- `docs/create.md`: Comprehensive guide for creating new destinations
- `docs/authentication.md`: Authentication implementation guide
- `docs/error-handling.md`: Error handling guidelines

## Testing Pattern

Use `createTestIntegration` helper:

```typescript
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import nock from 'nock' // HTTP mocking

const testDestination = createTestIntegration(Destination)
const event = createTestEvent({ timestamp, event: 'Test Event' })

nock('https://api.example.com').post('/endpoint').reply(200, {})

const responses = await testDestination.testAction('actionName', {
  useDefaultMappings: true,
  event,
  mapping: {
    /* fields */
  }
})

expect(responses[0].status).toBe(200)
```

### Testing Guidelines

- Mock all external API calls (`nock` for cloud-mode destinations)
- Test both success and failure scenarios
- Include tests for edge cases and input validation
- Test error handling paths to ensure proper error messages
- For batching, test various batch sizes and scenarios
- Ensure tests are deterministic and don't rely on external services

## PR Review Guidelines

### Breaking Changes Prevention

- Don't add new required fields to existing action definitions
- Don't change field types in ways that could break existing integrations
- Don't alter behavior of existing functionality customers rely on
- For high-volume destinations, use feature flags for safe rollout

### PR Organization

- Split changes to multiple destinations into separate PRs
- Ensure PR descriptions clearly explain changes and testing performed

### CI Checks

All PRs must pass: Unit Tests, Lint, Validate, Browser Destination Bundle QA, Browser tests (actions-core), Required Field Check, Test External, Code coverage.
