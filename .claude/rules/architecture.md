# Architecture

## Outcome

A reviewer knows where code belongs and which changes have repo-wide reach.

## Requirements

- ARC-01: Cloud-mode destinations live in `packages/destination-actions/src/destinations/<slug>/`; device-mode destinations in `packages/browser-destinations/destinations/<slug>/`.
- ARC-02: A destination exports a `DestinationDefinition` (name, slug, mode, authentication, optional `extendRequest`, `actions`). Each action is an `ActionDefinition` with title, description, `fields`, optional `defaultSubscription` (FQL), `perform` and optional `performBatch`.
- ARC-03: Shared logic inside one destination goes in that destination's `shared/` or utility files, not copied between actions. Logic shared across destinations goes in `packages/actions-shared`.
- ARC-04: `packages/core` holds the runtime, destination-kit, mapping-kit and request client. A change there is treated as a change to every destination.
- ARC-05: API versions are extracted to a `versioning-info.ts` file in the destination, as in `facebook-conversions-api/versioning-info.ts`.
- ARC-06: Batching: Segment groups events before `performBatch` runs, so actions do not chunk by themselves. `batch_size` caps events per batch and is exposed to customers only when needed, with `minimum` and `maximum`. `batch_bytes` caps payload size, stays `unsafe_hidden: true` and is not exposed. Batch keys have low cardinality.
- ARC-07: Actions are event-agnostic by default: they support every Segment event type and default to a `track` subscription; customers choose the types through subscription filters.

## Constraints

- HTTP errors are handled by the request client (`throwHttpErrors` is true by default). An action that sets it to false handles the response itself and throws the right custom error.
