import type { E2EExchange, E2EObservation, E2EObservedError } from './adapters/types'
import type { E2EExecutionMode, E2EExpectation, E2EMultistatusExpectation, E2EResponseChecks } from './types'

export interface E2EVerdict {
  passed: boolean
  reason?: string
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Partial deep match: every key/element in `expected` must be present and match in `actual`; '$absent' must be missing. */
function partialMatch(actual: unknown, expected: unknown): boolean {
  if (expected === '$absent') return actual === undefined
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

const fail = (reason: string): E2EVerdict => ({ passed: false, reason })

function checkBody(body: unknown, expectation: E2EResponseChecks): E2EVerdict {
  if (expectation.bodyContains && !stringify(body).includes(expectation.bodyContains)) {
    return fail(`response body does not contain "${expectation.bodyContains}": ${stringify(body).slice(0, 300)}`)
  }
  if (expectation.jsonContains !== undefined && !partialMatch(body, expectation.jsonContains)) {
    return fail(`response body does not match jsonContains: ${stringify(body).slice(0, 300)}`)
  }
  if (expectation.bodyEquals !== undefined && stringify(body ?? '').trim() !== expectation.bodyEquals.trim()) {
    return fail(`response body does not equal bodyEquals: ${stringify(body).slice(0, 300)}`)
  }
  return { passed: true }
}

/** The exchange a fixture judges: the last one matching its selector, or the last of all. */
function selectExchange(exchanges: E2EExchange[], expectation: E2EResponseChecks): E2EExchange | undefined {
  const { method, url } = expectation.exchange ?? {}
  const matches = exchanges.filter(
    (exchange) =>
      (method === undefined || exchange.method.toUpperCase() === method.toUpperCase()) &&
      (url === undefined || exchange.url.includes(url))
  )
  return matches[matches.length - 1]
}

/** Why no exchange was selected: none matched the selector, or `fallback` when none was sent. */
function noExchange(exchanges: E2EExchange[], expectation: E2EResponseChecks, fallback: string): string {
  if (exchanges.length === 0 || !expectation.exchange) return fallback
  const sent = exchanges.map((exchange) => `${exchange.method} ${exchange.url}`).join(', ')
  return `no partner request matched ${stringify(expectation.exchange)}; sent ${sent}`
}

const OAUTH_REFRESH_FAILED = 'OAUTH_REFRESH_FAILED'

function describeError(error: E2EObservedError, refreshFailed?: boolean): string {
  const detail = `${error.type} (${error.status ?? 'no status'}): ${error.message}`
  return refreshFailed || error.type === OAUTH_REFRESH_FAILED
    ? `OAuth refresh failed: re-authorize the sandbox app or check refreshAccessToken. ${detail}`
    : detail
}

/** What the fixture sent, for the rules that hold whatever the expectation. */
export interface E2EValidateContext {
  mode: E2EExecutionMode
  eventCount: number
}

function checkMultistatus(expectation: E2EMultistatusExpectation, observation: E2EObservation): E2EVerdict {
  const { error, multistatus } = observation
  if (error) return fail(`expected per-event results, got ${describeError(error, observation.refreshFailed)}`)
  if (!multistatus) return fail('expected per-event results, but the batch returned none')
  if (multistatus.length !== expectation.items.length) {
    return fail(`expected ${expectation.items.length} per-event result(s), got ${multistatus.length}`)
  }
  for (const [i, item] of expectation.items.entries()) {
    const actual = multistatus[i]
    const label = `event ${i}: `
    if (item.status === '2xx') {
      if (actual.status < 200 || actual.status >= 300) {
        return fail(
          `${label}expected 2xx, got ${actual.status} ${actual.errortype ?? ''} ${actual.errormessage ?? ''}`.trim()
        )
      }
      continue
    }
    if (actual.status !== item.status) {
      return fail(`${label}expected status ${item.status}, got ${actual.status} ${actual.errormessage ?? ''}`.trim())
    }
    if ('errortype' in item) {
      if (actual.errortype !== item.errortype) {
        return fail(
          `${label}expected error type ${item.errortype}, got ${actual.errortype}: ${actual.errormessage ?? ''}`
        )
      }
      if (!(actual.errormessage ?? '').includes(item.errormessage)) {
        return fail(`${label}error message does not contain "${item.errormessage}": ${actual.errormessage ?? ''}`)
      }
      if (item.errorreporter !== undefined && actual.errorreporter !== item.errorreporter) {
        return fail(`${label}expected error reporter ${item.errorreporter}, got ${actual.errorreporter}`)
      }
    }
  }
  return { passed: true }
}

/**
 * Judge an observation against a fixture's expectation. Pure, so any adapter's harness can use it.
 * With `context`, batch modes also need one result per event, and 'batchWithMultistatus' needs
 * performBatch to have returned a MultiStatusResponse where the adapter can tell.
 */
export function validate(
  expectation: E2EExpectation,
  observation: E2EObservation,
  context?: E2EValidateContext
): E2EVerdict {
  const { exchanges, error, multistatus } = observation

  if (context && context.mode !== 'single' && multistatus && multistatus.length !== context.eventCount) {
    return fail(`expected one result per event (${context.eventCount}), got ${multistatus.length}`)
  }
  if (context?.mode === 'batchWithMultistatus' && observation.returnedMultiStatus === false) {
    return fail('performBatch did not return a MultiStatusResponse, so per-event results only copy one response')
  }

  if (expectation.status === 'multistatus') return checkMultistatus(expectation, observation)

  if (expectation.status === 'error') {
    // In batch modes core reports each rejected event as a multistatus item instead of throwing.
    const errors = error
      ? [error]
      : (multistatus ?? []).map((item) => ({
          type: item.errortype,
          message: item.errormessage ?? '',
          status: item.status
        }))
    if (errors.length === 0) return fail('expected our code to reject the event, but it did not')
    if (exchanges.length > 0) return fail(`expected no partner request, but ${exchanges.length} were sent`)
    for (const e of errors) {
      if (e.type !== expectation.errorType) {
        return fail(`expected error type ${expectation.errorType}, got ${e.type ?? `status ${e.status}`}: ${e.message}`)
      }
      if (expectation.httpStatus !== undefined && e.status !== expectation.httpStatus) {
        return fail(`expected error status ${expectation.httpStatus}, got ${e.status}`)
      }
      if (expectation.errorMessage && !e.message.includes(expectation.errorMessage)) {
        return fail(`error message does not contain "${expectation.errorMessage}": ${e.message}`)
      }
    }
    return { passed: true }
  }

  if (expectation.exchangeCount !== undefined && exchanges.length !== expectation.exchangeCount) {
    const sent = exchanges.map((exchange) => `${exchange.method} ${exchange.url} ${exchange.status}`).join(', ')
    return fail(`expected ${expectation.exchangeCount} partner request(s), got ${exchanges.length}: ${sent}`)
  }
  const exchange = selectExchange(exchanges, expectation)

  if (expectation.status === 'failure') {
    if (!exchange) {
      const sentNone = `expected a partner response, but no request was sent${error ? `: ${error.message}` : ''}`
      return fail(noExchange(exchanges, expectation, sentNone))
    }
    if (exchange.status !== expectation.httpStatus) {
      return fail(`expected partner status ${expectation.httpStatus}, got ${exchange.status}`)
    }
    return checkBody(exchange.body, expectation)
  }

  if (error) return fail(`expected success, got ${describeError(error, observation.refreshFailed)}`)
  if (!exchange) return fail(noExchange(exchanges, expectation, 'expected a partner request, but none was sent'))
  const statusOk =
    expectation.httpStatus !== undefined
      ? exchange.status === expectation.httpStatus
      : exchange.status >= 200 && exchange.status < 300
  if (!statusOk) return fail(`expected partner status ${expectation.httpStatus ?? '2xx'}, got ${exchange.status}`)
  const failedItems = (multistatus ?? []).filter((item) => item.status < 200 || item.status >= 300)
  if (failedItems.length > 0) {
    const first = failedItems[0]
    return fail(`${failedItems.length} batch item(s) failed, first ${first.status} ${first.errortype ?? ''}`.trim())
  }
  return checkBody(exchange.body, expectation)
}
