# Copilot Instructions

This document provides comprehensive instructions for GitHub Copilot to assist with reviewing pull requests and performing tasks based on user prompts within the Action Destinations repository. These instructions ensure consistent, high-quality reviews and implementations that align with the repository's standards and best practices.

## Primary Responsibilities

As GitHub Copilot for Action Destinations, you have two primary roles:

1. **Pull Request Reviewer**: Review code changes to ensure they meet quality standards, don't introduce breaking changes, and follow best practices

2. **Implementation Assistant**: Help implement new features, fix bugs, and make improvements to the codebase based on user requirements

## Understanding the Repository Structure

This repository contains the Segment Action Destinations framework, which enables streaming data from Segment to third-party tools. Action Destinations were launched in December 2021 to enable customers with a customizable framework to map Segment event sources to third-party tools.

### Key Packages

- [`destination-actions`](../packages/destination-actions): Cloud-mode destinations that run on Segment's infrastructure. New destinations must be manually registered in [index.ts](../packages/destination-actions/src/index.ts).
- [`browser-destinations`](../packages/browser-destinations): Browser-mode destinations that run on the client side. New destinations must be manually registered in [destination-manifest/index.ts](../packages/destinations-manifest/src/index.ts).
- [`core`](../packages/core): The core framework that powers both cloud and browser destinations. Changes here require thorough regression testing as they affect all destinations.
- [`destination-subscriptions`](../packages/destination-subscriptions): Validates event payloads against an action's subscription AST.
- [`browser-destination-runtime`](../packages/browser-destination-runtime): Runtime for browser-mode destinations, handling action execution and event processing.
- [`cli`](../packages/cli): Command-line tools for interacting with the repository, including scaffolding new destinations and actions.
- [`ajv-human-errors`](../packages/ajv-human-errors): Wrapper for AJV that produces more user-friendly validation messages.

### Key Concepts

- **Actions**: Functions that define what a destination does with events, including field definitions and perform logic
- **Destinations**: Collections of actions with shared authentication and configuration
- **Subscriptions**: JSON configurations that map Segment events to destination actions using FQL queries
- **Mapping Kit**: Tools for transforming and mapping data between Segment events and destination-specific formats
- **Batching**: Optional functionality to process multiple events in a single API call for efficiency

## Reviewing Pull Requests

When reviewing pull requests, thoroughly check the following areas:

### 1. CI Checks and Build Validation

- Verify all CI checks listed in [PR Checks](../docs/pr-guidelines/pr-checks.md) have passed, including:
  - Unit Tests
  - Lint
  - Validate
  - Browser Destination Bundle QA
  - Browser tests: actions-core
  - Required Field Check
  - Test External
  - Code coverage

### 2. Code Quality and Standards

- Follow the [Reviewer Guidelines](../docs/pr-guidelines/pull-request-guidance.md) rigorously
- Check for appropriate use of framework features like conditionally required fields
- Verify proper error handling according to [Error Handling Guidelines](../docs/error-handling.md)
- Look for consistent naming conventions and code style
- Ensure code is well-documented with clear comments
- Verify types are properly defined and used

### 3. Breaking Changes Prevention

- Ensure PRs don't introduce breaking changes, especially:
  - Adding new required fields to existing action definitions
  - Changing field types in ways that could break existing integrations
  - Altering the behavior of existing functionality that customers rely on
- For critical high-volume destinations (e.g., Facebook, Google, Snapchat), recommend using feature flags to safely roll out changes
  - This allows testing in production with limited exposure
  - Helps identify potential issues before affecting all customers
  - Provides a quick rollback mechanism if problems are discovered

### 4. PR Organization

- Recommend splitting changes to multiple destinations into separate PRs
- Suggest logical commit organization that makes the changes easy to review
- Check that the PR description clearly explains the changes and testing performed

### 5. Documentation and Grammar

- Verify proper grammar and spelling in all user-facing text
- Check that field descriptions and labels are clear and helpful
- Ensure any API changes are properly documented

## Implementing Features and Bug Fixes

When implementing features or fixing bugs based on user prompts, follow these guidelines:

### 1. Code Implementation Best Practices

- Use framework features extensively for consistent behavior:
  - Leverage conditionally required fields for complex validation scenarios
  - Implement proper error handling with appropriate error types from `core/src/errors.ts`
  - Define input fields with accurate types, clear labels, and helpful descriptions
  - Use appropriate format validation for string fields (email, URI, etc.)
- Implement batching where appropriate using `performBatch` for high-volume destinations
- Follow authentication best practices as outlined in [authentication.md](../docs/authentication.md)
- Use the `processHashing` utility for any PII hashing rather than direct crypto calls
- Utilize mapping kit directives for default field values when appropriate

### 2. Testing Strategy

- Write comprehensive unit tests for all new functionality:
  - Use existing tests as references for style and coverage expectations
  - Mock all external API calls (use `nock` for cloud-mode destinations)
  - Test both success and failure scenarios thoroughly
  - Include tests for edge cases and input validation
  - Test error handling paths to ensure proper error messages
- Ensure tests are deterministic and don't rely on external services
- For batching implementations, test various batch sizes and scenarios

### 3. Performance and Security Considerations

- Consider performance implications of changes, especially for high-volume event processing
- Optimize code for efficiency in action perform methods
- Never expose or log sensitive information like auth tokens or PII
- Follow security best practices for handling user data
- Be mindful of API rate limits when making external requests
- Use appropriate batch keys for low cardinality to avoid inefficient batching

### 4. Feature-Specific Implementation Guidelines

#### For New Destinations

- Follow the destination creation guide in [docs/create.md](../docs/create.md)
- Implement proper authentication methods based on destination requirements
- Add appropriate presets for common use cases to improve user experience
- Ensure comprehensive error handling with user-friendly, actionable error messages
- Register new destinations correctly in the appropriate index files

#### For Action Implementations

- Define clear, well-typed input fields with helpful descriptions and examples
- Implement robust `perform`/`performBatch` methods with proper error handling
- Use appropriate default values and mapping hints to guide user configuration
- Consider batching support for high-throughput destinations
- Implement hooks when appropriate for specialized initialization needs
- For audience-related functionality, implement appropriate audience support methods

#### For Core Framework Changes

- Be extremely cautious as changes affect all destinations
- Ensure backward compatibility with existing implementations
- Add extensive tests covering various scenarios and edge cases
- Document changes thoroughly and update relevant documentation
- Consider performance implications across all destination types

## Working with Specific Destination Types

### API/Cloud Destinations

- Focus on efficient API request handling and batching where supported
- Implement proper rate limiting and retry strategies
- Handle API-specific error responses with clear, actionable messages
- Use appropriate authentication methods (OAuth, API keys, etc.)
- Consider implementing hooks for specialized initialization needs
- For critical high-traffic destinations (Facebook, Google, Snapchat, etc.):
  - Always recommend feature flags for significant changes
  - Suggest gradual rollout strategies
  - Verify backward compatibility with existing mappings

### Audience Destinations

- Follow the specialized AudienceDestinationDefinition interface
- Implement appropriate audience creation, syncing, and management functions
- Consider sync mode (full vs. incremental) based on destination capabilities
- Handle both add and remove operations for audience membership
- Test with various audience sizes and membership changes

### Browser/Client-Side Destinations

- Consider browser compatibility and performance implications
- Avoid blocking the main thread with long-running operations
- Implement appropriate client-side error handling and reporting
- Consider user privacy and consent requirements
- Test across different browsers and environments

## Best Practices for Code Reviews

### What to Look For

- **Security**: Proper handling of authentication, PII, and sensitive data
- **Performance**: Efficient code that handles high event volumes well
- **Maintainability**: Clear code structure, appropriate comments, and documentation
- **Testing**: Comprehensive test coverage with realistic scenarios
- **Error Handling**: Proper error handling with clear, actionable messages

### Review Process

1. Start with a high-level understanding of the change purpose
2. Check CI validation and test results
3. Review the code changes in detail, focusing on logic and potential issues
4. Provide specific, actionable feedback on areas for improvement
5. Suggest alternatives where appropriate, with example code if helpful
