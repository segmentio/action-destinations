// The seam between the runner core and whatever executes a fixture. The core builds an
// E2EInvocation and judges the E2EObservation; an adapter only sends and reports. The in-process
// adapter lives here; integrations implements its own against its CloudEvents route.
import type { JSONObject, SegmentEvent } from '@segment/actions-core'
import type { E2EExecutionMode, E2ESuite } from '../types'

/** Everything needed to run one fixture, already resolved, independent of how it is sent. */
export interface E2EInvocation {
  /** The destination definition's slug, e.g. 'actions-mixpanel'. */
  slug: string
  action: string
  mode: E2EExecutionMode
  /** One event for 'single', otherwise the batch. Dynamic markers are resolved. */
  events: SegmentEvent[]
  /** Destination settings with `{ $env }` markers resolved. No subscription. */
  settings: Record<string, unknown>
  subscribe: string
  /** The action's field defaults overlaid with the fixture's mapping, as a stored subscription carries it. */
  mapping: JSONObject
  features: Record<string, boolean>
}

/** One partner HTTP exchange. `status` and `body` are the partner's response. */
export interface E2EExchange {
  method: string
  url: string
  status: number
  body: unknown
}

export interface E2EObservedError {
  /** Segment error code, as integrations reports it (e.g. 'PAYLOAD_VALIDATION_FAILED'). */
  type: string
  message: string
  status?: number
}

export interface E2EMultiStatusItem {
  status: number
  errortype?: string
  errormessage?: string
}

/** What happened, in terms both adapters can observe. */
export interface E2EObservation {
  exchanges: E2EExchange[]
  error?: E2EObservedError
  multistatus?: E2EMultiStatusItem[]
}

export interface E2EAdapter {
  /** 'in-process' here; integrations names its own. Recorded in the report. */
  readonly name: string
  /**
   * Send one invocation and report what happened. Throw E2ESetupError when the target itself is
   * unusable (e.g. unreachable); any other throw counts as a fixture failure.
   */
  run(invocation: E2EInvocation, suite: E2ESuite): Promise<E2EObservation>
}

/** A problem with the run's setup rather than with a destination: makes the run exit 2. */
export class E2ESetupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'E2ESetupError'
  }
}
