/**
 * Local E2E test framework for cloud-mode destinations.
 *
 * - Fixture types + event builders (ported from PR #3829, kept out of core).
 * - `runE2EFixtures` — a jest runner that drives `./bin/run serve` over HTTP.
 * - `frame` / `validate` / `resolveSettings` / `resolveDynamicValues` — pure functions an
 *   out-of-repo harness (e.g. the integrations gating harness) can reuse against a deployed
 *   integrations service without depending on jest or a local serve process.
 */
export * from './types'
export * from './helpers'
export {
  runE2EFixtures,
  frame,
  validate,
  resolveSettings,
  resolveDynamicValues,
  sendToServe,
  DEFAULT_BASE_URL
} from './e2e-runner'
export type { E2ERunnerOptions, ServeRequestBody, ServeExchange, ServeErrorOutput, ServeResponse } from './e2e-runner'
