# Testing

## Outcome

Every change is covered by deterministic tests, and a reviewer can tell what was verified.

## Requirements

- TST-01: Unit tests use `createTestIntegration` and `createTestEvent` from `@segment/actions-core`, and mock every external call with `nock`. No test depends on a live service or on the clock or timezone; pin time when a result depends on it.
- TST-02: A new or changed action has tests for success, failure and error-handling paths (messages and status codes), plus edge cases and input validation.
- TST-03: Batching changes test several batch sizes, including a batch of one, and mixed valid and invalid payloads.
- TST-04: A feature-flagged change tests the flag on and off.
- TST-05: Tests run with `TZ=UTC` (for example `TZ=UTC yarn cloud test`) so snapshot tests are stable across timezones.
- TST-06: Snapshot tests are updated only when the output change is intended, and the PR says why.
- TST-07: The PR's Test Plan names the environments and tests run. Segment-owned changes are also tested in staging first.

## Commands

- `yarn cloud test`, `yarn browser test`, `yarn core test`; narrow with `yarn cloud jest --testPathPattern="<name>"`.
- `yarn lint`, `yarn typecheck`, `yarn validate` before opening a PR.
