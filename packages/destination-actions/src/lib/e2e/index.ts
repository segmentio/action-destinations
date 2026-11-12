/**
 * E2E framework for cloud-mode destinations: fixtures, the adapter-neutral runner core, and the
 * registry of onboarded suites. Any harness plugs in an E2EAdapter and calls runSuites; the
 * integrations harness imports this from the published package. The in-process adapter is not
 * exported here, so that harness never loads it.
 */
export * from './types'
export * from './helpers'
export * from './adapters/types'
export { resolveDynamicValues, resolveSettings, missingSecrets } from './resolve'
export { buildInvocation } from './invocation'
export { validate } from './validate'
export type { E2EVerdict } from './validate'
export { runSuites, formatSummary } from './run'
export type { E2ERunOptions, E2EReport, E2EQuarantineEntry } from './run'
export { suites } from './registry'
