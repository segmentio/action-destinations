/**
 * E2E framework for cloud-mode destinations: fixtures, the adapter-neutral runner core, the
 * registry of onboarded suites, and InProcessAdapter. Any harness plugs in an E2EAdapter and calls
 * runSuites; the integrations harness imports this from the published package and runs
 * InProcessAdapter first, then its own adapter for the contract subset.
 */
export * from './types'
export * from './helpers'
export * from './adapters/types'
export { resolveDynamicValues, resolveSettings, missingSecrets, missingBeforeKeys } from './resolve'
export { buildInvocation, withRefreshedTokens } from './invocation'
export type { E2EInvocationState } from './invocation'
export { hookContext } from './hooks'
export { InProcessAdapter } from './adapters/in-process'
export { validate } from './validate'
export type { E2EVerdict, E2EValidateContext } from './validate'
export { runSuites, formatSummary } from './run'
export type { E2ERunOptions, E2EReport, E2EQuarantineEntry } from './run'
export { suites } from './registry'
