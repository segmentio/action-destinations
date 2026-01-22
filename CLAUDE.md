# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the official repository for Segment's Action Destinations, a framework for building streaming destinations on Segment's platform. Action Destinations allow mapping Segment event sources to third-party tools with customizable configurations.

## Project Structure

This is a monorepo with multiple packages managed using:

- `lerna` for publishing
- `nx` for dependency-tree aware building, linting, testing, and caching
- Yarn Workspaces for package symlinking and hoisting

Key packages:

- `packages/destination-actions` - Cloud-mode destinations that run on Segment's servers
- `packages/browser-destinations` - Device-mode destinations that run directly in the browser via Analytics 2.0
- `packages/core` - Core runtime engine for actions, including mapping-kit transforms
- `packages/cli` - Command-line tools for interacting with the repo
- `packages/destination-subscriptions` - Validates events against an action's subscription AST
- `packages/ajv-human-errors` - A wrapper around AJV for more human-friendly validation messages
- `packages/browser-destination-runtime` - Runtime for browser-mode destinations

## Common Commands

### Environment Setup

```bash
# Clone the repo locally
git clone https://github.com/segmentio/action-destinations.git
cd action-destinations

# Install dependencies (Node 18.17 or 22.13+ required)
yarn --ignore-optional
yarn install

# Build the project
yarn build

# Clean and rebuild the project
yarn clean-build
```

### Development Commands

```bash
# Start local development server
./bin/run serve

# Start development server with debug capabilities
./bin/run serve --inspect

# Scaffold a new destination
./bin/run init

# Scaffold a new action within a destination
./bin/run generate:action <ACTION_NAME> <browser|server>

# Generate TypeScript definitions for an integration
./bin/run generate:types

# Generate TypeScript definitions with watch mode
yarn types --watch
```

### Testing Commands

```bash
# Run all tests
yarn test

# Run tests for a specific destination
yarn cloud test --testPathPattern=src/destinations/<DESTINATION_SLUG>

# Run tests with cache clearing
yarn test:clear-cache

# Run tests for partners (external contributors)
yarn test-partners

# Run browser tests
yarn test-browser

# Generate snapshot tests
NODE_ENV=test yarn jest --testPathPattern='./packages/destination-actions/src/destinations/<DESTINATION_SLUG>' --updateSnapshot
```

### Linting and Type Checking

```bash
# Run linting
yarn lint

# Run type checking
yarn typecheck
```

## Development Workflows

### Creating a New Destination

1. Use `./bin/run init` to scaffold a new destination
2. Define authentication, settings, and actions
3. Implement actions with appropriate fields and perform function
4. Add unit tests and snapshot tests
5. Test locally using the Actions Tester via `./bin/run serve`

### Adding an Action to an Existing Destination

1. Use `./bin/run generate:action <ACTION_NAME> <browser|server>` to scaffold a new action
2. Define fields, implement the perform function, and add any necessary helper functions
3. Write tests for the new action
4. Test the action using Actions Tester

### Local Testing Options

There are two main approaches to local testing:

1. **Actions Tester UI** - Provides a visual interface to test actions (`./bin/run serve`)
2. **cURL or Postman** - For more advanced testing, including batch operations

For browser destinations, use: `./bin/run serve --directory ./packages/browser-destinations/destinations --browser`

## Architecture & Framework Concepts

### Core Concepts

1. **Destinations** - Top-level integrations with third-party tools
2. **Actions** - Individual operations that can be performed with a destination
3. **Fields** - Configuration inputs for actions and authentication
4. **Perform Functions** - The code that executes the action logic (`perform` and `performBatch`)
5. **Mapping-Kit** - Transforms between Segment events and destination fields
6. **Subscriptions** - FQL queries that determine when actions should trigger

### Error Handling

When handling errors, follow these guidelines:

- **DO NOT** throw generic JavaScript `Error` objects
- Use predefined error classes from `packages/core/src/errors.ts`:
  - `PayloadValidationError` - For custom event payload validations (not retried)
  - `InvalidAuthenticationError` - For authentication errors (not retried)
  - `RetryableError` - For transient errors you want Segment to retry
  - `APIError` - For capturing HttpErrors with better messages (retried based on status code)
  - `IntegrationError` - For all other scenarios

### Best Practices

1. **Action Design**:

   - Actions should map to a single feature in the target platform
   - Keep actions atomic (performing a single operation)
   - Use appropriate field types and validations
   - Implement conditionally required fields where appropriate

2. **Testing**:

   - Write unit tests for all actions
   - Mock all external API calls using `nock`
   - Add snapshot tests for request/response validation

3. **Pull Request Guidelines**:

   - Don't introduce new required fields to existing actions
   - Follow error handling guidelines
   - Ensure proper grammar in field descriptions
   - Split changes to multiple destinations into separate PRs

4. **Code Quality**:
   - Implement proper error handling
   - Follow the security best practices
   - Use the framework features (conditionally required fields, etc.)
   - Use appropriate validation for input fields
