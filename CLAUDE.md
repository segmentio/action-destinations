# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Segment's Action Destinations repository - a monorepo for building streaming destinations with a customizable framework. It supports both cloud-mode (server-side) and device-mode (browser) destinations that allow customers to map Segment event sources to third-party tools.

## Common Commands

### Build Commands

```bash
# Full build
yarn build               # Build all packages via NX + browser bundles
yarn clean-build         # Clean and rebuild everything

# Specific builds
yarn build:browser-bundles  # Build only browser bundles
```

### Test Commands

```bash
# Run all tests
yarn test                # Run all tests (NX-based)
yarn test:clear-cache    # Clear test cache

# Specific test suites
yarn test-browser        # Run browser-specific tests
yarn test-partners       # Tests for partner-built destinations only

# Run a single test
yarn nx test destination-actions --testPathPattern="slack"  # Test specific destination
yarn nx test core --testPathPattern="mapping-kit"          # Test specific core module
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

- **core**: Runtime engine, destination-kit, mapping-kit, request client
- **destination-actions**: Cloud-mode destination definitions (~213 destinations)
- **browser-destinations**: Device-mode (client-side) destination implementations
- **cli**: Command-line tools for scaffolding and local testing
- **actions-shared**: Shared utilities across destinations

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
- `packages/browser-destinations/destinations/`: All browser-mode destinations
- `packages/core/src/destination-kit/`: Core destination framework
- `packages/core/src/mapping-kit/`: Mapping transformation logic
- `docs/create.md`: Comprehensive guide for creating new destinations

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
