import { E2ESetupError } from './adapters/types'
import type { E2EAdapter } from './adapters/types'
import { buildInvocation } from './invocation'
import { missingSecrets } from './resolve'
import type { E2EFixture, E2EResult, E2ESuite } from './types'
import { validate } from './validate'

/** Excuses failures until `expires`. Without `action` / `fixture`, it covers the whole destination or action. */
export interface E2EQuarantineEntry {
  destination: string
  action?: string
  /** The fixture's `description`. */
  fixture?: string
  /** ISO date; the entry is ignored from then on. */
  expires: string
  reason?: string
}

export interface E2ERunOptions {
  /** Only these destination folders. Unknown names are a setup error. */
  destinations?: string[]
  /** Suites run in parallel up to this. Defaults to 4. */
  concurrency?: number
  /** Retries for fixtures that set none. Defaults to 0. */
  defaultRetries?: number
  /** First retry delay in ms, doubled each attempt. Defaults to 250. */
  backoffMs?: number
  quarantine?: E2EQuarantineEntry[]
  /** Where `{ $env }` settings come from. Defaults to process.env. */
  env?: NodeJS.ProcessEnv
  /** Clock for quarantine expiry. Defaults to now. */
  now?: Date
  onResult?: (result: E2EResult) => void
}

export interface E2EReport {
  adapter: string
  startedAt: string
  ms: number
  results: E2EResult[]
  setupErrors: string[]
  /** 0 all passed or excused, 1 a fixture failed, 2 setup error. A harness maps it to its process exit. */
  exitCode: 0 | 1 | 2
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function isQuarantined(suite: E2ESuite, fixture: E2EFixture, entries: E2EQuarantineEntry[], now: Date): boolean {
  return entries.some(
    (entry) =>
      entry.destination === suite.destination &&
      (entry.action === undefined || entry.action === suite.action) &&
      (entry.fixture === undefined || entry.fixture === fixture.description) &&
      new Date(entry.expires) > now
  )
}

function selectSuites(suites: E2ESuite[], options: E2ERunOptions, setupErrors: string[]): E2ESuite[] {
  let selected = suites
  if (options.destinations?.length) {
    const known = new Set(suites.map((suite) => suite.destination))
    for (const name of options.destinations) {
      if (!known.has(name)) setupErrors.push(`no suites registered for destination "${name}"`)
    }
    selected = suites.filter((suite) => options.destinations?.includes(suite.destination))
  }
  if (selected.length === 0) setupErrors.push('no suites to run')
  return selected
}

/**
 * Run suites through any adapter. Fixtures inside a suite run in order; suites run in parallel.
 * The core owns scoping, preflight, retries, quarantine and the exit code; the adapter only sends.
 */
export async function runSuites(
  adapter: E2EAdapter,
  suites: E2ESuite[],
  options: E2ERunOptions = {}
): Promise<E2EReport> {
  const started = Date.now()
  const env = options.env ?? process.env
  const now = options.now ?? new Date()
  const backoffMs = options.backoffMs ?? 250
  const setupErrors: string[] = []
  const results: E2EResult[] = []

  const selected = selectSuites(suites, options, setupErrors)

  // Preflight: a missing secret is a setup error, never a silent skip.
  const runnable = selected.filter((suite) => {
    const label = `${suite.destination}/${suite.action}`
    if (!suite.definition.actions[suite.action]) {
      setupErrors.push(`${label}: the destination has no action "${suite.action}"`)
      return false
    }
    const missing = missingSecrets(suite.config.settings, env)
    if (missing.length > 0) {
      setupErrors.push(`${label}: missing environment variables ${missing.join(', ')}`)
      return false
    }
    return true
  })

  const runFixture = async (suite: E2ESuite, fixture: E2EFixture): Promise<E2EResult> => {
    const fixtureStarted = Date.now()
    const retries = fixture.retries ?? suite.retries ?? options.defaultRetries ?? 0
    let attempts = 0
    let reason: string | undefined
    let passed = false

    while (!passed && attempts <= retries) {
      if (attempts > 0) await sleep(backoffMs * 2 ** (attempts - 1))
      attempts++
      try {
        const observation = await adapter.run(buildInvocation(suite, fixture, env), suite)
        const verdict = validate(fixture.expect, observation)
        passed = verdict.passed
        reason = verdict.reason
      } catch (err) {
        if (err instanceof E2ESetupError) throw err
        reason = `adapter threw: ${(err as Error)?.message ?? String(err)}`
      }
    }

    const failedOutcome = isQuarantined(suite, fixture, options.quarantine ?? [], now) ? 'quarantined' : 'failed'
    return {
      suite: `${suite.destination}/${suite.action}`,
      fixture: fixture.description,
      outcome: passed ? 'passed' : failedOutcome,
      attempts,
      ms: Date.now() - fixtureStarted,
      ...(passed
        ? {}
        : { reason: fixture.verboseFailureHint ? `${reason} (hint: ${fixture.verboseFailureHint})` : reason })
    }
  }

  const queue = [...runnable]
  const worker = async () => {
    for (let suite = queue.shift(); suite; suite = queue.shift()) {
      for (const fixture of suite.fixtures) {
        try {
          const result = await runFixture(suite, fixture)
          results.push(result)
          options.onResult?.(result)
        } catch (err) {
          setupErrors.push(`${suite.destination}/${suite.action}: ${(err as Error).message}`)
          break
        }
      }
    }
  }
  const concurrency = options.concurrency ?? 4
  if (Number.isInteger(concurrency) && concurrency >= 1) {
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
  } else {
    setupErrors.push(`concurrency must be a positive integer, got ${concurrency}`)
  }
  // A run that judged nothing must not pass.
  if (results.length === 0 && setupErrors.length === 0) setupErrors.push('no fixtures ran')

  const exitCode = setupErrors.length > 0 ? 2 : results.some((result) => result.outcome === 'failed') ? 1 : 0
  return {
    adapter: adapter.name,
    startedAt: new Date(started).toISOString(),
    ms: Date.now() - started,
    results,
    setupErrors,
    exitCode
  }
}

/** A plain-text summary of a report, for a terminal or a CI log. */
export function formatSummary(report: E2EReport): string {
  const lines = report.results.map((result) => {
    const mark = result.outcome === 'passed' ? 'PASS' : result.outcome === 'quarantined' ? 'QUAR' : 'FAIL'
    const detail = result.reason ? `\n       ${result.reason}` : ''
    return `${mark}  ${result.suite} › ${result.fixture} (${result.attempts} attempt(s), ${result.ms}ms)${detail}`
  })
  for (const error of report.setupErrors) lines.push(`SETUP ${error}`)
  const count = (outcome: E2EResult['outcome']) => report.results.filter((result) => result.outcome === outcome).length
  lines.push(
    `${count('passed')} passed, ${count('failed')} failed, ${count('quarantined')} quarantined, ` +
      `${report.setupErrors.length} setup error(s) · adapter ${report.adapter} · exit ${report.exitCode}`
  )
  return lines.join('\n')
}
