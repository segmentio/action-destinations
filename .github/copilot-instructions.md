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
- [`browser-destinations`](../packages/browser-destinations): Browser-mode destinations that run on the client side. New destinations must be manually registered in [destination-manifest/index.ts](../packages/destinations-manifest/index.ts).
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

Start with a high-level understanding of the change's purpose, then review the code in
detail, focusing on logic and potential issues. Give specific, actionable feedback, and
suggest alternatives (with example code where helpful). Thoroughly check the following areas:

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
- Beyond these gating checks, raise the advisory **PR Author Nudges** (section 3a) when they apply.

### 2. Code Quality and Standards

- Follow the [Reviewer Guidelines](../docs/pr-guidelines/pull-request-guidance.md) rigorously
- Check for appropriate use of framework features like conditionally required fields
- Verify proper error handling according to [Error Handling Guidelines](../docs/error-handling.md)
- Look for consistent naming conventions and code style
- Ensure code is well-documented with clear comments
- Verify types are properly defined and used
- **Security and Secret Detection**: Carefully review all field definitions for sensitive data that should use `type: 'password'`
  - Refer to the Secret Fields section in README.md for detailed guidance
  - Remember: It's better to be overly cautious and suggest `type: 'password'` than to miss a potential security vulnerability

### 3. Breaking Changes Prevention

Breaking-change and customer-impact analysis, and feature-flag rollout for high-volume
destinations, are reviewed under the **Change Release Safety** section below (items 5 and 6) — that is the single source of truth; don't restate it here. When reviewing the diff
specifically, flag PRs that:

- Add new required fields to existing action definitions
- Change field types in ways that could break existing integrations
- Alter the behavior of existing functionality that customers rely on

#### Recognizing feature flags in a diff

Feature flags follow consistent conventions in this repo, so you can detect them when reviewing a diff:

- Flags are **kebab-case string literals**, usually defined as an exported constant whose name contains `FLAGON`, `FEATURE_FLAG`, `_FLAG`, or `FLAG_` (e.g. `S3_HASHING_FEATURE_FLAG`, `FLAGON_NAME`), or occasionally inlined as a literal.
- They are read off the perform bundle as `features?.['flag-name']` or `features['flag-name']` inside `perform` / `performBatch`.
- Real examples for reference:
  - [`mixpanel/trackEvent/index.ts`](../packages/destination-actions/src/destinations/mixpanel/trackEvent/index.ts) — `mixpanel-multistatus`
  - [`hubspot/upsertObject/index.ts`](../packages/destination-actions/src/destinations/hubspot/upsertObject/index.ts) — `actions-hubspot-lists-association-support`
  - [`s3/constants.ts`](../packages/destination-actions/src/destinations/s3/constants.ts) — `S3_HASHING_FEATURE_FLAG`

### 3a. PR Author Nudges

When reviewing a PR, post a short, friendly, **non-blocking** review comment (a suggestion, never "request changes") when either of the following applies. Prefer a single consolidated comment covering both.

- **Testing section not filled in** — the PR description's `## Testing` section has **no** checked boxes (`- [x]`). Remind the author to check the testing task(s) they actually completed (unit tests / local end-to-end / Hadron regression), or to describe the testing they performed. Staging and backward-compatibility are covered by the Change Release Safety Test Plan and Breaking Change & Customer Impact. See the [PR template](./PULL_REQUEST_TEMPLATE.md).
- **Feature-flag change without rollout details** — the diff **adds or changes a feature-flag reference** (per the conventions in "Recognizing feature flags in a diff" above) but the PR description's **Risk Mitigation** narrative and the **Feature flag / gate** item in the Change Control Checklist (both under Change Release Safety) are not filled in. Remind the author to confirm the flag name, that the flag is registered in Flagon and **defaults to off**, and to describe the rollout / rollback plan.

Keep these nudges advisory and encouraging — they help authors and reviewers, but they do not block merge.

### 4. PR Organization

- Recommend splitting changes to multiple destinations into separate PRs
- Suggest logical commit organization that makes the changes easy to review
- Check that the PR description clearly explains the changes (testing is covered by the
  Change Release Safety Test Plan)

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
- Implement hooks when appropriate for specialized initialization needs
- For audience-related functionality, implement appropriate audience support methods

#### For Core Framework Changes

- Be extremely cautious as changes affect all destinations
- Ensure backward compatibility with existing implementations
- Add extensive tests covering various scenarios and edge cases
- Document changes thoroughly and update relevant documentation
- Consider performance implications across all destination types

## Change Release Safety (Change Control) — required review

Context: Per the internal "Segment Change Release Safety" guidelines, nearly half of
recent incidents were self-inflicted (defect escape or regression), with outsized
impact on our largest enterprise customers. Reviewing changes against these guidelines
is a first-class part of every review — not an afterthought.

When you review a PR that can reach production, verify the PR description contains all of
the items below, each in enough detail that another engineer with similar expertise could
reproduce them. For each item, report its status (✅ present / ⚠️ too vague / ❌ missing),
quote the relevant text from the description, and suggest concrete additions specific to
this change (e.g. the exact dashboards, metrics, or tests to watch). Reject placeholder
answers such as "Tested in stage", "Unit tests pass", "Auto deployed", "Check dashboards",
"Revert PR and push", or "N/A".

Each item corresponds to a checkbox in the PR template's Change Control Checklist
(`.github/PULL_REQUEST_TEMPLATE.md`).

1. **Test Plan** — environment(s) used and tests/metrics verified; tested in **staging
   first** with sufficient bake time for end-to-end tests to complete; covers flag/gate
   states (on, off, and partial rollout).
2. **Deployment Plan** — deploy steps, environments, and any linked PRs / flags / gates /
   cob vars that must land or change together.
3. **Verification Plan** — how the change is verified in production (dashboard links,
   metrics monitored, prod tests expected to pass); aim for ~3 independent signals. This
   is a required complement to the Test Plan, not a substitute for it.
4. **Rollback Plan** — clear steps any teammate can execute quickly; risky rollbacks
   should be tested in staging.
5. **Risk Mitigation** — actions taken to reduce the risk of the change (e.g. feature
   flag/gate behavior and how it protects the change). For critical high-volume
   destinations (e.g. Facebook, Google, Snapchat), confirm risky changes are gated behind a
   flag that defaults to off.
6. **Breaking Change & Customer Impact** — whether the change alters behavior customers
   depend on (schema/field changes, new required fields, removed/renamed fields, changed
   defaults, API or version bumps, altered mapping output, auth or rate-limit changes,
   dropped events); who is affected (which destinations/integrations, customer segments,
   event volumes — call out top enterprise customers) and the customer-visible impact
   (data loss, delivery failures, duplicate/missing events, downstream schema breakage,
   silent behavior changes); and the backward-compatibility / migration path (gating,
   versioning, opt-in, deprecation notice). Treat new required fields as breaking. Reject a
   bare "no impact" — require the analysis behind it.

Approval & process expectations (flag anything that looks bypassed):

7. **+2 code review approvals** before merge to the protected branch — two +1s from two
   different reviewers, or a single +2 from a subject-matter expert for small/urgent changes.
8. **Non-code production changes** — configuration changes, Flagon gates/flags, cob var
   changes, Terraform, infra via the AWS console, direct prod DB reads/writes, and script
   execution require at least one approval; pairing is mandatory for non-standard operational
   work that cannot be staged and reviewed (script execution and DB writes/queries).
9. **Director involvement / approval** for major/risky changes — skipping (or approving the
   skip of) testing in staging for hotfixes, restoring DBs from backup, operations that could
   cause data loss, COGS-driven infra changes, and any Statuspage maintenance window
   (contractual customer-notice requirements apply).
