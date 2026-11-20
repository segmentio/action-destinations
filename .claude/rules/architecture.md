# Architecture

How the monorepo is divided.

## Outcome

A change lands in the package that owns it, and a change to shared code is checked against every destination.

## Requirements

- ARC-01: A cloud-mode destination lives under `packages/destination-actions/src/destinations/`, and a device-mode one under `packages/browser-destinations/destinations/`.
- ARC-02: A change to `packages/core` is regression-tested across destinations, because every destination runs on it.
- ARC-03: A destination's actions are defined as `ActionDefinition` objects inside a `DestinationDefinition`; chunking for `performBatch` is left to the Segment platform.

## Constraints

- ARC-04: A PR changes one destination, not several.
