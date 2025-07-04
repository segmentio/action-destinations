# Copilot Instructions

This document provides instructions for GitHub Copilot to assist with reviewing pull requests and performing tasks based on user prompts. It references existing guidelines and role-specific instructions available in this repository.

## Understanding the repository

Read the [README](../README.md) to understand the purpose of this repository and its structure. On high level, this repository contains the following key packages:

- [`action-destinations`](../packages/destination-actions): This contains all cloud-mode destinations. All new destinations are registered manually and the destination metadata id is then updated in [index.ts](../packages/destination-actions/src/index.ts).
- [`browser-destinations`](../packages/browser-destinations): This contains all browser-mode destinations. All new destinations are registered manually and the destination metadata id is then updated in [destination-manifest/index.ts](../packages/destinations-manifest/src/index.ts).
- [`core`](../packages/core): This contains all the core framework for running the destinations. Any changes made here will affect both cloud-mode and browser-mode destinations. Thorough regression testing is requried for these changes.
- [`destination-subscriptions`](../packages/destination-subscriptions): This package validates event payloads against an action's subscription AST.
- [`browser-destination-runtime`](../packages/browser-destination-runtime): This package contains the runtime for browser-mode destinations, including the logic for executing actions and handling events.

## Reviewing Pull Requests

When reviewing pull requests, Copilot should:

1. Ensure all the required checks mentioned [here](../docs/pr-guidelines/pr-checks.md) have passed.
2. Follow the expectations outlined in the [Reviewer Guidelines](../docs/pr-guidelines/pull-request-guidance.md).
3. Suggest splitting changes to multiple destinations into separate pull requests.
4. Ensure that the pull request doesn't introduce known breaking changes as called out in the [Pull Request Guidance](../docs/pr-guidelines/pull-request-guidance.md).

## Performing Tasks

When performing tasks based on user prompts, Copilot should:

1. Refer to the relevant guidelines and documentation in this repository.
2. Ensure that any code changes follow the principles outlined in the [Contributor Guidelines](../docs/pr-guidelines/pull-request-guidance.md).
3. Ensure that code changes are implemented using as many framework features as possible, such as conditionally required fields, error handling etc.
4. Write clear unit tests for any new functionality or changes made to existing functionality.
   - Use the existing tests as a reference for writing new tests.
   - All external calls should be mocked in the tests. For cloud-mode destinations, we use `nock` to mock external calls.
