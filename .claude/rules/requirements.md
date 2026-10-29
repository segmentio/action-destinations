# Review requirements

Review guidance that is not in `CLAUDE.md` (which every review already reads). Change Release Safety items, error classes, batching and testing rules are in `CLAUDE.md`.

## Outcome

Reviews catch changes that could break customers, and nudge authors toward the PR template without blocking them.

## Requirements

- REQ-01: A change does not add a new required field to an existing action, change a field's type incompatibly, or alter behavior customers rely on. New required fields count as breaking.
- REQ-02: Risky or high-volume changes (Facebook, Google, Snapchat, TikTok and similar) sit behind a feature flag that is registered and defaults to off. A flag is a kebab-case string, usually an exported constant whose name contains `FLAGON`, `FEATURE_FLAG`, `_FLAG` or `FLAG_`, read as `features?.['flag-name']` in `perform` or `performBatch`. Examples: `mixpanel/trackEvent/index.ts` (`mixpanel-multistatus`), `s3/constants.ts` (`S3_HASHING_FEATURE_FLAG`).
- REQ-03: Field definitions are reviewed for sensitive data. When in doubt, suggest `type: 'password'`.
- REQ-04: Changes to several destinations are split into separate PRs, with commits that are easy to review.
- REQ-05: Field labels and descriptions are clear and correctly spelled, since customers read them in the UI.

## Author nudges

Post one short, friendly, non-blocking comment (never "request changes") when either applies:

- The PR's `### Test Plan` is empty or a placeholder (for example "Tested in stage") and no testing checkbox is checked. Ask for the environments and tests run.
- The diff adds or changes a feature-flag reference but `## Feature flag / Rollout` is not filled in. Remind the author to confirm the flag name, that it is registered and defaults to off, and to describe the rollout and rollback plan.

## Review process

1. Understand the purpose of the change.
2. Check CI results.
3. Review the code for logic and risk.
4. Give specific, actionable feedback, with example code when it helps.
