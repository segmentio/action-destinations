# Requirements

What a change to this repo must satisfy before it merges. Detail on how to build destinations lives in `CLAUDE.md` and `docs/`.

## Outcome

Changes to destinations ship safely: no customer's existing mappings, events or auth break, and every production-reaching change can be verified and rolled back.

## Requirements

- REQ-01: A change does not add a new required field to an existing action definition, change a field's type incompatibly, or alter behavior customers rely on (mapping output, defaults, dropped events, auth, rate limits). New required fields count as breaking.
- REQ-02: A risky or high-volume change (Facebook, Google, Snapchat, TikTok and similar) is behind a feature flag that is registered and defaults to off. Flags are kebab-case strings read as `features?.['flag-name']` in `perform` / `performBatch`.
- REQ-03: The PR description follows `.github/PULL_REQUEST_TEMPLATE.md` and fills in Test Plan, Deployment Plan, Verification Plan, Rollback Plan, Risk Mitigation and Breaking Change & Customer Impact with specifics. Placeholders ("Tested in stage", "Unit tests pass", "Auto deployed", "Check dashboards", "N/A") are not acceptable for Segment-owned changes.
- REQ-04: Changes reach production only after +2 code review approvals (two reviewers, or one SME for small or urgent changes).
- REQ-05: Errors thrown from actions use the classes in `packages/core/src/errors.ts` (`PayloadValidationError`, `InvalidAuthenticationError`, `RetryableError`, `APIError`, `IntegrationError`), never a plain `Error`, so each has a message, code and status.
- REQ-06: Sensitive fields (API keys, tokens, secrets, client secrets) use `type: 'password'`. Tokens and PII are never logged. PII hashing goes through `processHashing`, not direct crypto calls.
- REQ-07: Changes to several destinations are split into separate PRs. A PR over 2,000 changed lines is split (see `.claude/rules/eng-automated-reviews.md`).
- REQ-08: CI passes before merge: Unit Tests, Lint, Validate, Browser Destination Bundle QA, Browser tests (actions-core), Required Field Check, Test External, Code coverage.
- REQ-09: Changes to `packages/core` are backward compatible with every existing destination and carry regression tests, because they affect all of them.

## Constraints

- New cloud destinations are registered in `packages/destination-actions/src/index.ts`; new browser destinations in `packages/destinations-manifest/index.ts`. A destination that is not registered does not ship.
- Do not edit generated type files by hand; regenerate them with `yarn types`.
