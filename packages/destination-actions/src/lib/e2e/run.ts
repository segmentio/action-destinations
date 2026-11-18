import { randomUUID } from 'node:crypto'
import type { RefreshAccessTokenResult } from '@segment/actions-core'
import { E2ESetupError } from './adapters/types'
import type { E2EAdapter, E2EObservation } from './adapters/types'
import { hookContext } from './hooks'
import { buildInvocation, withRefreshedTokens } from './invocation'
import { missingBeforeKeys, missingSecrets, resolveSettings } from './resolve'
import type { E2EExpectation, E2EFixture, E2EFixtureCleanup, E2EHookValues, E2EResult, E2ESuite } from './types'
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
  /** Handed to hooks for naming partner resources. Defaults to a fresh short id. */
  runId?: string
  onResult?: (result: E2EResult) => void
}

export interface E2EReport {
  adapter: string
  runId: string
  startedAt: string
  ms: number
  results: E2EResult[]
  setupErrors: string[]
  /** Failed `after` hooks: resources may be left behind, but the exit code is unaffected. */
  warnings: string[]
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

const message = (err: unknown) => (err as Error)?.message ?? String(err)

/** A fixture that can't be judged as written, or undefined. */
function fixtureProblem(fixture: E2EFixture): string | undefined {
  if (fixture.expect.status !== 'multistatus') return undefined
  if (fixture.mode !== 'batchWithMultistatus') return `a multistatus expectation needs mode 'batchWithMultistatus'`
  if (fixture.expect.items.length !== fixture.events.length) {
    return `multistatus lists ${fixture.expect.items.length} item(s) for ${fixture.events.length} event(s)`
  }
  return undefined
}

function expectationFor(suite: E2ESuite, fixture: E2EFixture): E2EExpectation {
  return fixture.expect.status === 'success' && suite.defaultSuccess
    ? { ...suite.defaultSuccess, ...fixture.expect }
    : fixture.expect
}

/**
 * Run suites through any adapter. Fixtures inside a suite run in order; suites run in parallel.
 * The core owns scoping, preflight, hooks, retries, quarantine and the exit code; the adapter only sends.
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
  const runId = options.runId ?? randomUUID().slice(0, 8)
  const setupErrors: string[] = []
  const warnings: string[] = []
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
    const descriptions = suite.fixtures.map((fixture) => fixture.description)
    const duplicates = [...new Set(descriptions.filter((d, i) => descriptions.indexOf(d) !== i))]
    if (duplicates.length > 0) {
      setupErrors.push(`${label}: fixture descriptions must be unique, repeated: ${duplicates.join(', ')}`)
      return false
    }
    return true
  })

  /** Attempts one fixture, reusing and updating the suite's refreshed tokens. Rethrows E2ESetupError. */
  const runFixture = async (
    suite: E2ESuite,
    fixture: E2EFixture,
    values: E2EHookValues,
    auth: { tokens?: RefreshAccessTokenResult }
  ): Promise<{ result: E2EResult; observation?: E2EObservation }> => {
    const fixtureStarted = Date.now()
    const retries = fixture.retries ?? suite.retries ?? options.defaultRetries ?? 0
    const expectation = expectationFor(suite, fixture)
    let attempts = 0
    let reason: string | undefined
    let passed = false
    let observation: E2EObservation | undefined

    while (!passed && attempts <= retries) {
      if (attempts > 0) await sleep(backoffMs * 2 ** (attempts - 1))
      attempts++
      try {
        const invocation = buildInvocation(suite, fixture, env, { values, tokens: auth.tokens })
        observation = await adapter.run(invocation, suite)
        auth.tokens = observation.refreshedTokens ?? auth.tokens
        const verdict = validate(expectation, observation, {
          mode: fixture.mode,
          eventCount: invocation.events.length
        })
        passed = verdict.passed
        reason = verdict.reason
      } catch (err) {
        if (err instanceof E2ESetupError) throw err
        reason = `adapter threw: ${message(err)}`
      }
    }

    const failedOutcome = isQuarantined(suite, fixture, options.quarantine ?? [], now) ? 'quarantined' : 'failed'
    const result: E2EResult = {
      suite: `${suite.destination}/${suite.action}`,
      fixture: fixture.description,
      outcome: passed ? 'passed' : failedOutcome,
      attempts,
      ms: Date.now() - fixtureStarted,
      ...(passed
        ? {}
        : { reason: fixture.verboseFailureHint ? `${reason} (hint: ${fixture.verboseFailureHint})` : reason })
    }
    return { result, observation }
  }

  const runSuite = async (suite: E2ESuite) => {
    const label = `${suite.destination}/${suite.action}`
    const auth: { tokens?: RefreshAccessTokenResult } = {}
    // Hooks see the latest refreshed tokens too.
    const context = () =>
      hookContext(suite, withRefreshedTokens(resolveSettings(suite.config.settings, env), auth.tokens), runId)
    let suiteValues: E2EHookValues = {}
    const cleanups: E2EFixtureCleanup[] = []

    try {
      if (suite.before) {
        try {
          suiteValues = await suite.before(context())
        } catch (err) {
          setupErrors.push(`${label}: suite before failed: ${message(err)}`)
          return
        }
      }

      for (const fixture of suite.fixtures) {
        const fixtureLabel = `${label} › ${fixture.description}`
        const problem = fixtureProblem(fixture)
        if (problem) {
          setupErrors.push(`${fixtureLabel}: ${problem}`)
          continue
        }
        let values = suiteValues
        let observation: E2EObservation | undefined
        let outcome: E2EResult['outcome'] | undefined
        try {
          if (fixture.before) {
            try {
              values = { ...suiteValues, ...(await fixture.before({ ...context(), values: suiteValues })) }
            } catch (err) {
              setupErrors.push(`${fixtureLabel}: fixture before failed: ${message(err)}`)
              continue
            }
          }
          const events = fixture.mode === 'single' ? [fixture.event] : fixture.events
          const missing = missingBeforeKeys([events, fixture.mapping], values)
          if (missing.length > 0) {
            setupErrors.push(`${fixtureLabel}: no before hook returned ${missing.join(', ')}`)
            continue
          }
          const run = await runFixture(suite, fixture, values, auth)
          observation = run.observation
          outcome = run.result.outcome
          results.push(run.result)
          options.onResult?.(run.result)
        } catch (err) {
          setupErrors.push(`${label}: ${message(err)}`)
          break
        } finally {
          let cleaned = false
          if (fixture.after) {
            try {
              await fixture.after({ ...context(), values, observation })
              cleaned = true
            } catch (err) {
              warnings.push(`${fixtureLabel}: fixture after failed: ${message(err)}`)
            }
          }
          cleanups.push({ description: fixture.description, values, outcome, cleaned })
        }
      }
    } finally {
      if (suite.after) {
        try {
          await suite.after({ ...context(), values: suiteValues, fixtures: cleanups })
        } catch (err) {
          warnings.push(`${label}: suite after failed: ${message(err)}`)
        }
      }
    }
  }

  const queue = [...runnable]
  const worker = async () => {
    for (let suite = queue.shift(); suite; suite = queue.shift()) await runSuite(suite)
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
    runId,
    startedAt: new Date(started).toISOString(),
    ms: Date.now() - started,
    results,
    setupErrors,
    warnings,
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
  for (const warning of report.warnings) lines.push(`WARN  ${warning}`)
  const count = (outcome: E2EResult['outcome']) => report.results.filter((result) => result.outcome === outcome).length
  lines.push(
    `${count('passed')} passed, ${count('failed')} failed, ${count('quarantined')} quarantined, ` +
      `${report.setupErrors.length} setup error(s), ${report.warnings.length} warning(s) · adapter ${report.adapter} · exit ${report.exitCode}`
  )
  return lines.join('\n')
}
