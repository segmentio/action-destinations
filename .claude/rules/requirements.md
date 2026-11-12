# Requirements

What every destination and action in this repo must do for customers.

## Outcome

Existing customer mappings keep working, and events are delivered or fail with a clear, correctly retried error.

## Requirements

- REQ-01: Every error thrown from an action is one of the classes in `packages/core/src/errors.ts`, with a message and status code.
- REQ-02: A field holding a secret, such as an API key or token, has `type: 'password'`.
- REQ-03: PII is hashed with the `processHashing` utility.
- REQ-04: A high-volume destination, such as Facebook, Google or Snapchat, rolls out a change behind a feature flag.
- REQ-05: A destination or action that is new is registered in `packages/destination-actions/src/index.ts` (cloud) or `packages/destinations-manifest/index.ts` (browser).

## Constraints

- REQ-06: No new required field is added to an existing action definition.
- REQ-07: No field type changes in a way that breaks existing mappings.
- REQ-08: No plain `Error` is thrown from an action.
- REQ-09: No auth token or PII is logged or exposed.
- REQ-10: `batch_bytes` is not exposed to customers (`unsafe_hidden: true`).
