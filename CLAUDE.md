# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build & Development

- `yarn build` - Build all packages and browser bundles
- `yarn clean-build` - Clean caches and rebuild everything
- `yarn install` - Install dependencies
- `./bin/run serve` - Start local development server with debugging

### Testing

- `yarn test` - Run all tests (for Segment employees)
- `yarn test-partners` - Run tests excluding internal packages (for external contributors)
- `yarn test-browser` - Run browser-specific tests
- `yarn test:clear-cache` - Clear nx test cache

### Linting & Validation

- `yarn lint` - Lint TypeScript files across all packages
- `yarn typecheck` - Run TypeScript type checking across packages
- `./bin/run validate` - Validate destination configurations

### CLI Operations

- `./bin/run init` - Scaffold a new destination
- `./bin/run generate:action <ACTION_NAME> <browser|server>` - Create new action
- `./bin/run generate:types` - Generate TypeScript definitions
- `./bin/run --help` - View all CLI commands

## Architecture

This is a monorepo using Lerna, NX, and Yarn Workspaces with the following key packages:

### Core Packages

- **`packages/core`** - Core runtime engine for actions and mapping-kit transforms. Changes here affect all destinations.
- **`packages/destination-actions`** - Cloud-mode destination definitions. New destinations registered in `src/index.ts`.
- **`packages/browser-destinations`** - Browser-mode destination definitions. New destinations registered in `packages/destinations-manifest/src/index.ts`.
- **`packages/cli`** - Command-line tools for scaffolding and development
- **`packages/destination-subscriptions`** - Event validation against action subscription AST

### Supporting Packages

- **`packages/actions-shared`** - Shared utilities and components
- **`packages/ajv-human-errors`** - User-friendly AJV validation error messages
- **`packages/browser-destination-runtime`** - Runtime for browser-mode destinations

### Project Structure

Action destinations are organized as:

```
packages/destination-actions/src/destinations/{destination}/
├── index.ts (main destination definition)
├── generated-types.ts
└── {actionName}/
    ├── index.ts (action definition)
    └── generated-types.ts
```

## Key Development Patterns

### Action Definition Structure

- Actions have `fields` (input schema), `perform` function (execution logic), and optional `performBatch` for batching
- Use `defaultSubscription` for automatic subscription setup
- Implement `presets` for common use cases
- Use conditional fields with `depends_on` for dynamic UX

### Authentication & Requests

- Define authentication in destination's main `index.ts`
- Use `extendRequest` to add common headers/auth across actions
- HTTP requests use Fetch API wrapper with additional options (`json`, `searchParams`, etc.)

### Testing Requirements

- Mock all external API calls using `nock` for cloud destinations
- Write unit tests for all new functionality
- Use existing test patterns as reference
- Tests located alongside source files

### Code Quality

- Follow existing code conventions and patterns
- Use TypeScript strictly - leverage generated types
- Implement error handling and validation
- Use framework features like conditional required fields

## Important Guidelines

### Pull Request Requirements

- Run `yarn lint` and `yarn typecheck` before committing
- Ensure all tests pass
- Follow PR guidelines in `docs/pr-guidelines/`
- Split multi-destination changes into separate PRs

### Security & Best Practices

- Never commit secrets or API keys
- Use `processHashing` utility for PII hashing instead of raw crypto
- Implement proper error handling and retry logic
- Follow authentication patterns established in existing destinations

### Testing Strategy

- External contributors use `yarn test-partners`
- Mock all API calls in tests
- Test both success and error scenarios
- Validate input field schemas and transformations
