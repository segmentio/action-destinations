/**
 * Local E2E runner for cloud-mode destinations.
 *
 * It drives the CLI `serve` server (`./bin/run serve --destination <folder> --noUI`) over HTTP:
 * for each fixture it frames a serve request, POSTs it to `http://127.0.0.1:3000/<action>`, and
 * asserts the outcome against the fixture's `expect`.
 *
 * Why this lives in `destination-actions` and not in core: the runner needs `node:http`,
 * `node:crypto`, and `process.env`, which core bans via `no-restricted-imports`. The fixture
 * TYPES and event builders (ported from PR #3829) sit alongside it here; the pure `frame` and
 * `validate` functions are exported so an out-of-repo harness (e.g. the integrations service's
 * scheduled/gating harness) can reuse the exact same framing and assertions against a deployed
 * integrations service instead of a local serve process.
 *
 * Boundary to know: `serve` returns the raw outbound HTTP exchange(s) the destination made
 * (`[{ request, response }]`), or, when our code throws before any request leaves, a single
 * `[{ requestError: true, statusCode, message, fields? }]`. It does NOT expose Segment's
 * per-item `MultiStatusResponse`, so `batchWithMultistatus` fixtures assert the partner's
 * batch HTTP response (including a `failed_records`-style body) — per-item MultiStatus index
 * assertions require in-process execution and are out of scope for the local serve runner.
 */
import { randomUUID } from 'node:crypto'
import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

import type { E2EDestinationConfig, E2EFixture, E2ESettingsObject } from './types'

export const DEFAULT_BASE_URL = 'http://127.0.0.1:3000'

export interface E2ERunnerOptions {
  /** Destination folder name (as passed to `serve --destination`), used only for the describe label. */
  destination: string
  /** Action slug — the serve route this suite POSTs to (`/<action>`). */
  action: string
  /** Per-destination config; its `settings` (with `{ $env }` markers) are resolved from process.env. */
  config: E2EDestinationConfig
  /** The fixtures to run. */
  fixtures: E2EFixture[]
  /** Base URL of the serve/integrations endpoint. Defaults to http://127.0.0.1:3000. */
  baseUrl?: string
  /** Per-request timeout in milliseconds. Defaults to 30000. */
  timeoutMs?: number
  /** Default retry count for fixtures that do not set their own `retries`. Defaults to 0. */
  defaultRetries?: number
}

/** The body shape the serve per-action route expects. */
export interface ServeRequestBody {
  payload: unknown
  settings: Record<string, unknown>
  mapping: Record<string, unknown>
  features: Record<string, boolean>
}

/** One raw HTTP exchange the destination made, as summarized by the serve server. */
export interface ServeExchange {
  request: { url: string; headers: Record<string, string>; method: string; body: unknown }
  response: { statusCode: number; statusMessage?: string; headers: unknown; body: unknown }
}

/** The error object serve returns (wrapped in a single-element array) when our code throws. */
export interface ServeErrorOutput {
  requestError: true
  statusCode: number
  message?: unknown
  fields?: Record<string, string>
  stack?: string[]
}

export type ServeResponse = ServeExchange[] | [ServeErrorOutput]

// --- Dynamic value + secret resolution (pure) --------------------------------------------------

/**
 * Recursively resolve dynamic markers in a value:
 *   '$now'          → current ISO-8601 timestamp
 *   '$guid'         → a fresh UUID v4 each occurrence
 *   '$guid:<name>'  → a UUID v4 stable within one call (same name → same value), via guidCache
 * Other strings, numbers, booleans and null pass through unchanged.
 */
export function resolveDynamicValues<T>(value: T, guidCache: Map<string, string> = new Map()): T {
  if (typeof value === 'string') {
    if (value === '$now') return new Date().toISOString() as unknown as T
    if (value === '$guid') return randomUUID() as unknown as T
    if (value.startsWith('$guid:')) {
      const key = value.slice('$guid:'.length)
      let cached = guidCache.get(key)
      if (!cached) {
        cached = randomUUID()
        guidCache.set(key, cached)
      }
      return cached as unknown as T
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveDynamicValues(item, guidCache)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveDynamicValues(v, guidCache)
    }
    return out as unknown as T
  }
  return value
}

/**
 * Resolve `{ $env: 'NAME' }` secret markers in a settings object from `env`.
 * When a referenced variable is unset: throw (so success/failure fixtures fail loudly with a
 * clear message), unless `allowMissing` is true (error-expectation fixtures fail schema
 * validation before settings matter, so a placeholder is substituted to let the request frame).
 */
export function resolveSettings(
  settings: E2ESettingsObject,
  env: NodeJS.ProcessEnv,
  allowMissing = false
): Record<string, unknown> {
  const resolve = (obj: E2ESettingsObject): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && '$env' in value) {
        const name = (value as { $env: string }).$env
        const resolved = env[name]
        if (resolved === undefined) {
          if (allowMissing) {
            out[key] = `<<missing:${name}>>`
            continue
          }
          throw new Error(
            `E2E: required environment variable "${name}" is not set (needed to resolve setting "${key}"). ` +
              `Export it (e.g. via chamber) before running this fixture.`
          )
        }
        out[key] = resolved
      } else if (value && typeof value === 'object') {
        out[key] = resolve(value)
      } else {
        out[key] = value
      }
    }
    return out
  }
  return resolve(settings)
}

// --- Frame (pure) ------------------------------------------------------------------------------

/**
 * Build the serve request body for a fixture. `settings` must already be resolved. A `guidCache`
 * is shared across the event(s) + mapping of one fixture so `$guid:<name>` stays consistent.
 */
export function frame(
  fixture: E2EFixture,
  settings: Record<string, unknown>,
  guidCache: Map<string, string> = new Map()
): ServeRequestBody {
  const mapping = resolveDynamicValues((fixture.mapping ?? {}) as Record<string, unknown>, guidCache)
  const features = fixture.features ?? {}
  const payload =
    fixture.mode === 'single'
      ? resolveDynamicValues(fixture.event, guidCache)
      : resolveDynamicValues(fixture.events, guidCache)
  return { payload, settings, mapping, features }
}

// --- Validate (pure; uses jest `expect`) -------------------------------------------------------

function isErrorOutput(response: ServeResponse): response is [ServeErrorOutput] {
  return Array.isArray(response) && response.length > 0 && (response[0] as ServeErrorOutput).requestError === true
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Partial deep match: every key/element in `expected` must be present and match in `actual`. */
function partialMatch(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false
    return expected.every((item, i) => partialMatch(actual[i], item))
  }
  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object') return false
    const a = actual as Record<string, unknown>
    return Object.entries(expected as Record<string, unknown>).every(([k, v]) => partialMatch(a[k], v))
  }
  return actual === expected
}

/**
 * Assert a serve response against a fixture's expectation. Throws (via jest `expect`) on mismatch.
 * Exported so an external harness can reuse the exact assertions.
 */
export function validate(fixture: E2EFixture, response: ServeResponse): void {
  const expectation = fixture.expect

  if (expectation.status === 'error') {
    // Our code threw before any HTTP request left. Serve surfaces this as requestError:true.
    // NOTE: serve does not return the thrown error's class name, so `errorType` is not asserted
    // in local serve mode (an in-process harness can assert it). We assert what serve exposes.
    expect(isErrorOutput(response)).toBe(true)
    const err = (response as [ServeErrorOutput])[0]
    if (expectation.httpStatus !== undefined) {
      expect(err.statusCode).toBe(expectation.httpStatus)
    }
    if (expectation.errorMessage) {
      expect(stringify(err.message)).toContain(expectation.errorMessage)
    }
    return
  }

  if (expectation.status === 'failure') {
    // A request was sent and the partner returned a non-2xx. The serve request client throws on
    // non-2xx (throwHttpErrors defaults true), so this also arrives as requestError:true, but with
    // the partner's status code and body as `message`.
    expect(isErrorOutput(response)).toBe(true)
    const err = (response as [ServeErrorOutput])[0]
    expect(err.statusCode).toBe(expectation.httpStatus)
    if (expectation.bodyContains) {
      expect(stringify(err.message)).toContain(expectation.bodyContains)
    }
    if (expectation.jsonContains !== undefined) {
      expect(partialMatch(err.message, expectation.jsonContains)).toBe(true)
    }
    return
  }

  // success: a request was sent and the partner returned a 2xx. Assert on the outbound exchange.
  expect(isErrorOutput(response)).toBe(false)
  const exchanges = response as ServeExchange[]
  expect(exchanges.length).toBeGreaterThan(0)
  const last = exchanges[exchanges.length - 1]
  const status = last.response.statusCode
  if (expectation.httpStatus !== undefined) {
    expect(status).toBe(expectation.httpStatus)
  } else {
    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(300)
  }
  if (expectation.bodyContains) {
    expect(stringify(last.response.body)).toContain(expectation.bodyContains)
  }
  if (expectation.jsonContains !== undefined) {
    expect(partialMatch(last.response.body, expectation.jsonContains)).toBe(true)
  }
}

// --- Transport (node:http) ---------------------------------------------------------------------

/** POST a framed body to the serve/integrations endpoint and return the parsed JSON response. */
export async function sendToServe(
  baseUrl: string,
  action: string,
  body: ServeRequestBody,
  timeoutMs: number
): Promise<ServeResponse> {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${action}`)
  const payload = JSON.stringify(body)
  const transport = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) },
        timeout: timeoutMs
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c as Buffer))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          try {
            resolve(JSON.parse(text) as ServeResponse)
          } catch {
            reject(
              new Error(
                `E2E: serve returned non-JSON (HTTP ${
                  res.statusCode
                }). Is the serve server running at ${baseUrl}? Body: ${text.slice(0, 500)}`
              )
            )
          }
        })
      }
    )
    req.on('timeout', () => req.destroy(new Error(`E2E: request to ${url.href} timed out after ${timeoutMs}ms`)))
    req.on('error', (e) =>
      reject(new Error(`E2E: request to ${url.href} failed (${e.message}). Is the serve server running at ${baseUrl}?`))
    )
    req.write(payload)
    req.end()
  })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// --- Runner (wires the above into jest) --------------------------------------------------------

/**
 * Register a jest suite that runs each fixture against the serve endpoint. Call from a
 * `*.test.ts` file. Guard the call yourself (e.g. only when `process.env.RUN_E2E`) so normal
 * unit-test runs stay green without a serve server.
 */
export function runE2EFixtures(options: E2ERunnerOptions): void {
  const {
    destination,
    action,
    config,
    fixtures,
    baseUrl = process.env.BASE_URL || DEFAULT_BASE_URL,
    timeoutMs = 30000,
    defaultRetries = 0
  } = options

  describe(`E2E: ${destination} / ${action}`, () => {
    for (const fixture of fixtures) {
      const retries = fixture.retries ?? defaultRetries
      test(
        fixture.description,
        async () => {
          // Error-expectation fixtures fail schema validation before settings matter, so missing
          // secrets are tolerated; success/failure fixtures resolve strictly and fail loudly.
          const allowMissingSecrets = fixture.expect.status === 'error'
          const settings = resolveSettings(config.settings, process.env, allowMissingSecrets)

          let lastError: unknown
          for (let attempt = 0; attempt <= retries; attempt++) {
            try {
              const body = frame(fixture, settings, new Map())
              const response = await sendToServe(baseUrl, action, body, timeoutMs)
              validate(fixture, response)
              return
            } catch (e) {
              lastError = e
              if (attempt < retries) await sleep(250 * 2 ** attempt)
            }
          }
          if (fixture.verboseFailureHint) {
            // eslint-disable-next-line no-console
            console.error(`E2E hint for "${fixture.description}": ${fixture.verboseFailureHint}`)
          }
          throw lastError
        },
        timeoutMs + 5000
      )
    }
  })
}
