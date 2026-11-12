import type { E2EObservation } from './adapters/types'
import type { E2EExpectation } from './types'

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

const fail = (reason: string): E2EVerdict => ({ passed: false, reason })

function checkBody(body: unknown, expectation: { bodyContains?: string; jsonContains?: unknown }): E2EVerdict {
  if (expectation.bodyContains && !stringify(body).includes(expectation.bodyContains)) {
    return fail(`response body does not contain "${expectation.bodyContains}": ${stringify(body).slice(0, 300)}`)
  }
  if (expectation.jsonContains !== undefined && !partialMatch(body, expectation.jsonContains)) {
    return fail(`response body does not match jsonContains: ${stringify(body).slice(0, 300)}`)
  }
  return { passed: true }
}

/** Judge an observation against a fixture's expectation. Pure, so any adapter's harness can use it. */
export function validate(expectation: E2EExpectation, observation: E2EObservation): E2EVerdict {
  const { exchanges, error, multistatus } = observation
  const last = exchanges[exchanges.length - 1]

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

  if (expectation.status === 'failure') {
    if (!last) return fail(`expected a partner response, but no request was sent${error ? `: ${error.message}` : ''}`)
    if (last.status !== expectation.httpStatus) {
      return fail(`expected partner status ${expectation.httpStatus}, got ${last.status}`)
    }
    return checkBody(last.body, expectation)
  }

  if (error) return fail(`expected success, got ${error.type} (${error.status ?? 'no status'}): ${error.message}`)
  if (!last) return fail('expected a partner request, but none was sent')
  const statusOk =
    expectation.httpStatus !== undefined
      ? last.status === expectation.httpStatus
      : last.status >= 200 && last.status < 300
  if (!statusOk) return fail(`expected partner status ${expectation.httpStatus ?? '2xx'}, got ${last.status}`)
  const failedItems = (multistatus ?? []).filter((item) => item.status < 200 || item.status >= 300)
  if (failedItems.length > 0) {
    const first = failedItems[0]
    return fail(`${failedItems.length} batch item(s) failed, first ${first.status} ${first.errortype ?? ''}`.trim())
  }
  return checkBody(last.body, expectation)
}
